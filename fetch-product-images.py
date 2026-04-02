#!/usr/bin/env python3
"""
全商品の画像を統一オペレーションで取得・生成するスクリプト
Web検索 → ダウンロード → rembg背景除去 → 統一背景に合成

使い方:
  python fetch-product-images.py          # 画像がない/プレースホルダーの商品のみ
  python fetch-product-images.py --all    # 全商品を再取得（既存画像も上書き）
  python fetch-product-images.py --id 1 3 8  # 指定IDのみ再取得
"""

import json, os, io, sys, time, re, argparse
import numpy as np
import requests
from PIL import Image, ImageDraw
from rembg import remove

# ===== 設定 =====
DEST = "assets/images/fullbottle"
W, H = 800, 1000          # 出力画像サイズ
QUALITY = 92               # JPEG品質
BOTTLE_AREA = 0.78         # 瓶が占める面積比（高さ基準）
PADDING_TOP_RATIO = 0.08   # 上部の余白比率

# 背景: サイトのトンマナに合わせたウォームグレーグラデーション
BG_TOP = (245, 243, 240)      # 上部: ほんのりウォーム
BG_BOTTOM = (238, 235, 232)   # 下部: やや濃い

# ===== 全商品の検索クエリ =====
# "bottle only" + "-box" で瓶単体の画像を優先取得
SEARCH_QUERIES = {
    # --- purchase_history (ID 1-23) ---
    1:  "Maison Margiela Replica Lazy Sunday Morning EDT bottle only white background -box",
    2:  "Hermes Un Jardin sur le Nil EDT bottle only white background -box",
    3:  "Maison Margiela Replica Jazz Club EDT bottle only white background -box",
    4:  "Diptyque Orpheon EDP 75ml bottle only white background -box",
    5:  "Jo Malone English Pear Freesia cologne bottle only white background -box",
    6:  "Loewe 001 Man EDP bottle only white background -box",
    7:  "Byredo Blanche EDP 100ml bottle only white background -box",
    8:  "Le Labo Another 13 EDP bottle only white background -box",
    9:  "Decorte Kimono Yui fragrance bottle only white background -box",
    10: "Loewe 001 Woman EDP bottle only white background -box",
    11: "Tiffany Rose Gold EDP bottle only white background -intense -box",
    12: "Dior Sauvage Parfum bottle only white background -box",
    13: "Diptyque Fleur de Peau EDP bottle only white background -box",
    14: "Issey Miyake L'Eau d'Issey women EDT conical bottle only white background -box -homme",
    15: "YSL Libre EDP bottle only white background -box",
    16: "Calvin Klein ck one EDT bottle only white background -box",
    17: "Dior Hypnotic Poison EDT bottle only white background -box",
    18: "Dolce Gabbana Light Blue EDT women bottle only white background -box",
    19: "Diptyque Tam Dao EDP bottle only white background -box",
    20: "Jo Malone Nectarine Blossom Honey cologne bottle only white background -box",
    21: "The House of Oud The Time EDP bottle only white background -box",
    22: "Byredo Gypsy Water EDP 100ml bottle only white background -box",
    23: "Nonfiction Gentle Night perfume bottle only white background -box",
    # --- wholesale (ID 24-59) ---
    24: "Maison Francis Kurkdjian Baccarat Rouge 540 EDP bottle only white background -extrait -box",
    25: "Tom Ford Soleil Neige EDP 50ml bottle only white background -box",
    26: "Diptyque Eau Rose EDT bottle only white background -box",
    27: "Diptyque Do Son EDT bottle only white background -box",
    28: "Diptyque Philosykos EDT bottle only white background -box",
    29: "Jo Malone Blackberry Bay cologne bottle only white background -box",
    30: "Maison Margiela Replica Lazy Sunday Morning body lotion bottle only white background -box",
    31: "Dior Sauvage EDT bottle only white background -box",
    32: "Loewe 001 Woman EDP bottle only white background -box",
    33: "YSL Libre EDP bottle only white background -box",
    34: "Chloe EDP perfume bottle only white background -box",
    35: "Chloe Love Story EDP bottle only white background -box",
    36: "Bvlgari Omnia Amethyste EDT bottle only white background -box",
    37: "Bvlgari Pour Homme EDT bottle only white background -box",
    38: "Versace Yellow Diamond EDT bottle only white background -box",
    39: "Versace Bright Crystal EDT bottle only white background -box",
    40: "Versace Dylan Blue Pour Femme EDP bottle only white background -box",
    41: "Burberry Weekend Women EDP bottle only white background -box",
    42: "Giorgio Armani Acqua di Gio EDT bottle only white background -box",
    43: "Dolce Gabbana The One Men EDT bottle only white background -box",
    44: "Dolce Gabbana Light Blue Capri in Love women EDT bottle only white background -box",
    45: "Calvin Klein Eternity Women EDP bottle only white background -box",
    46: "Calvin Klein CK Everyone EDT bottle only white background -box",
    47: "Issey Miyake L'Eau d'Issey Pivoine Intense bottle only white background -box",
    48: "Lanvin Eclat d'Arpege EDP bottle only white background -box",
    49: "Chloe Perfumed Body Cream jar only white background -box",
    50: "Maison Margiela Replica hand cream Lazy Sunday Morning only white background -box",
    51: "Dolce Gabbana Dolce Blue Jasmine EDP bottle only white background -box",
    52: "Versace Man Eau Fraiche EDT bottle only white background -box",
    53: "Bvlgari Omnia Crystalline EDT bottle only white background -box",
    54: "Calvin Klein Eternity Men EDT bottle only white background -box",
    55: "Issey Miyake Wood Wood EDP bottle only white background -box",
    56: "Lanvin Jeanne Lanvin EDP bottle only white background -box",
    57: "Burberry Touch Men EDT bottle only white background -box",
    58: "Giorgio Armani Acqua di Gioia EDP bottle only white background -box",
    59: "Versace Eros Flame EDP bottle only white background -box",
}


def make_background():
    """サイトのトンマナに合うグラデーション背景を生成"""
    bg = Image.new("RGB", (W, H), BG_TOP)
    draw = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    return bg


def search_image(query, retries=3):
    """DuckDuckGo画像検索で商品画像URLを取得（リトライ付き）"""
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    for attempt in range(retries):
        try:
            if attempt > 0:
                wait = 3 * (attempt + 1)
                print(f"  リトライ {attempt + 1}/{retries} ({wait}秒待機)...")
                time.sleep(wait)

            r = requests.get(
                f"https://duckduckgo.com/?q={requests.utils.quote(query)}&iax=images&ia=images",
                headers=headers, timeout=15,
            )
            vqd = None
            for pattern in [r'vqd="([^"]+)"', r"vqd='([^']+)'", r'vqd4="([^"]+)"']:
                m = re.search(pattern, r.text)
                if m:
                    vqd = m.group(1)
                    break
            if not vqd:
                # VQD取得失敗時、HTMLからトークンを探す別パターン
                m = re.search(r'vqd=([\d-]+)', r.text)
                if m:
                    vqd = m.group(1)
            if not vqd:
                continue

            params = {"l": "jp-jp", "o": "json", "q": query, "vqd": vqd, "f": ",,,", "p": "1"}
            r2 = requests.get("https://duckduckgo.com/i.js", params=params, headers=headers, timeout=15)
            if r2.ok:
                urls = []
                for res in r2.json().get("results", [])[:12]:
                    url = res.get("image", "")
                    if url and any(ext in url.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                        urls.append(url)
                if urls:
                    return urls
        except Exception as e:
            print(f"  Search error (attempt {attempt + 1}): {e}")
    return []


def download_image(url):
    """画像をダウンロードしてPIL Imageで返す"""
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        if r.ok and len(r.content) > 3000:
            img = Image.open(io.BytesIO(r.content)).convert("RGB")
            # 極端に小さい画像は除外
            if img.width >= 200 and img.height >= 200:
                return img
    except Exception:
        pass
    return None


def remove_background(img):
    """rembgで背景除去してRGBA画像を返す"""
    buf = io.BytesIO()
    img.save(buf, "PNG")
    buf.seek(0)
    result = remove(buf.read())
    return Image.open(io.BytesIO(result)).convert("RGBA")


def compose_product_image(fg_rgba, output_path):
    """
    背景除去済みの前景を統一背景に合成
    - 瓶を中央やや上に配置
    - 下に淡いリフレクション（映り込み）を追加
    """
    bg = make_background()

    # 前景のトリミング（透明部分を除去）
    bbox = fg_rgba.getbbox()
    if bbox:
        fg_rgba = fg_rgba.crop(bbox)

    fw, fh = fg_rgba.size

    # 瓶のサイズを計算（高さ基準でフィット）
    max_h = int(H * BOTTLE_AREA)
    max_w = int(W * 0.70)
    scale = min(max_w / fw, max_h / fh)
    nw, nh = int(fw * scale), int(fh * scale)
    fg_resized = fg_rgba.resize((nw, nh), Image.LANCZOS)

    # 配置位置（中央、やや上寄り）
    x = (W - nw) // 2
    y = int(H * PADDING_TOP_RATIO) + (int(H * BOTTLE_AREA) - nh) // 2

    # メイン画像を合成
    bg.paste(fg_resized, (x, y), fg_resized)

    bg.save(output_path, "JPEG", quality=QUALITY, optimize=True)
    return os.path.getsize(output_path)


def post_validate(output_path):
    """生成した画像の品質を簡易チェック"""
    try:
        img = Image.open(output_path).convert("RGB")
        arr = np.array(img)
        bg_mid = np.array([(BG_TOP[i] + BG_BOTTOM[i]) // 2 for i in range(3)])
        diff = np.abs(arr.astype(float) - bg_mid.astype(float)).mean(axis=2)
        subject_ratio = (diff > 20).sum() / diff.size
        std = arr.std()
        warnings = []
        if subject_ratio < 0.08:
            warnings.append(f"被写体小 ({subject_ratio:.1%})")
        if std < 18:
            warnings.append(f"コントラスト低 (std={std:.1f})")
        return warnings
    except Exception:
        return ["検証エラー"]


def process_product(product):
    """1商品を処理: 検索 → ダウンロード → 背景除去 → 合成 → 検証"""
    pid = product["id"]
    brand = product["brand"]
    name = product["name"]

    fname = f"product_{pid:02d}.jpg"
    output = os.path.join(DEST, fname)

    # Use predefined query or auto-generate from English brand/name
    query = SEARCH_QUERIES.get(pid)
    if not query:
        # Clean up name for search (remove Japanese, tester markers, size info)
        import re as _re
        clean_name = _re.sub(r'【.*?】', '', name).strip()
        clean_name = _re.sub(r'\(Tester\)', '', clean_name).strip()
        query = f"{brand} {clean_name} perfume bottle only white background -box"
    print(f"\n[{pid:02d}] {brand} / {name}")
    print(f"  Query: {query}")

    urls = search_image(query)
    if not urls:
        print(f"  ❌ 画像が見つかりません")
        return False

    best_result = None
    best_warnings = None

    # 複数候補を試行
    for i, url in enumerate(urls[:5]):
        print(f"  [{i+1}] {url[:70]}...")
        img = download_image(url)
        if not img:
            print(f"      ↳ ダウンロード失敗")
            continue

        print(f"      ↳ ダウンロード成功 ({img.width}x{img.height})")
        try:
            fg = remove_background(img)

            # 背景除去の品質チェック
            alpha = fg.getchannel("A")
            total = alpha.width * alpha.height
            transparent = sum(1 for p in alpha.getdata() if p < 128)
            ratio = transparent / total
            if ratio < 0.15:
                print(f"      ↳ 背景除去が不十分 (透明率 {ratio:.0%}) → 次の候補へ")
                continue

            fsize = compose_product_image(fg, output)
            warnings = post_validate(output)

            if not warnings:
                product["img"] = f"assets/images/fullbottle/{fname}"
                print(f"  ✅ {fname} ({fsize // 1024}KB)")
                return True

            # 警告ありだが、ベストを記録して次の候補も試す
            if best_result is None or len(warnings) < len(best_warnings):
                best_result = (fg, fsize)
                best_warnings = warnings
            print(f"      ↳ 品質警告: {', '.join(warnings)} → 次の候補を試行")

        except Exception as e:
            print(f"      ↳ 処理エラー: {e}")
            continue

    # 全候補に警告があった場合、ベスト結果を採用
    if best_result:
        fg, fsize = best_result
        compose_product_image(fg, output)
        product["img"] = f"assets/images/fullbottle/{fname}"
        print(f"  ⚠️  {fname} ({fsize // 1024}KB) - 警告あり: {', '.join(best_warnings)}")
        return True

    print(f"  ❌ 全候補で失敗")
    return False


def is_placeholder(img_path):
    """プレースホルダー画像かどうかを判定（コントラストが極端に低い）"""
    try:
        import numpy as np
        im = Image.open(img_path).convert("RGB")
        arr = np.array(im)
        return arr.std() < 15 and arr.mean() > 230
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description="商品画像の統一取得・生成")
    parser.add_argument("--all", action="store_true", help="全商品を再取得（既存も上書き）")
    parser.add_argument("--id", type=int, nargs="+", help="指定IDのみ再取得")
    args = parser.parse_args()

    os.makedirs(DEST, exist_ok=True)

    with open("products.json", "r", encoding="utf-8") as f:
        products = json.load(f)

    # 処理対象の決定
    targets = []
    if args.id:
        targets = [p for p in products if p["id"] in args.id]
        print(f"指定ID {args.id} の {len(targets)} 商品を処理")
    elif args.all:
        targets = products
        print(f"全 {len(targets)} 商品を再取得")
    else:
        # デフォルト: 画像なし or プレースホルダーの商品のみ
        for p in products:
            img_path = p.get("img", "")
            if not img_path or not os.path.exists(img_path):
                targets.append(p)
            elif is_placeholder(img_path):
                targets.append(p)
        print(f"画像なし/プレースホルダー {len(targets)} 商品を処理")

    if not targets:
        print("処理対象がありません")
        return

    success = 0
    failed = []

    for p in targets:
        if process_product(p):
            success += 1
        else:
            failed.append(f"ID {p['id']}: {p['brand']} {p['name']}")
        time.sleep(1.5)  # レート制限

    # products.json 更新
    with open("products.json", "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 50}")
    print(f"成功: {success} / 失敗: {len(failed)} / 合計: {len(targets)}")
    if failed:
        print("失敗した商品:")
        for f_ in failed:
            print(f"  {f_}")


if __name__ == "__main__":
    main()
