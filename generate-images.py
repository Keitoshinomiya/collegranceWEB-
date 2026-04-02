#!/usr/bin/env python3
"""
高品質な商品プレースホルダー画像を生成するスクリプト
ラグジュアリーブランドのECサイトに相応しい、ミニマルで洗練されたデザイン
"""

import json
import os
import math
from PIL import Image, ImageDraw, ImageFont

DEST = "assets/images/fullbottle"
PRODUCTS_JSON = "products.json"

# 画像サイズ（4:5 アスペクト比）
W, H = 800, 1000

# ブランドカラーマッピング（実際のブランドカラーを参考）
BRAND_COLORS = {
    "Maison Francis Kurkdjian": ("#c8a87c", "#f5ede3"),  # ゴールド系
    "TOM FORD":                 ("#1a1a1a", "#f0f0f0"),   # ブラック
    "DIPTYQUE":                 ("#2c3e2f", "#f5f3ef"),   # ダークグリーン
    "Jo Malone London":         ("#1a1a1a", "#faf5e4"),   # クリーム
    "Maison Margiela":          ("#ffffff", "#f0f0f0"),   # ホワイト
    "DIOR":                     ("#1a1a1a", "#f5f5f5"),   # ブラック
    "LOEWE":                    ("#3d2b1f", "#f7f3ef"),   # ブラウン
    "YSL":                      ("#1a1a1a", "#f5f5f5"),   # ブラック
    "Chloé":                    ("#d4a574", "#faf6f0"),   # ベージュ
    "BVLGARI":                  ("#1a1a1a", "#f5f5f5"),   # ブラック
    "VERSACE":                  ("#c5a55a", "#f5f0e8"),   # ゴールド
    "BURBERRY":                 ("#a67b5b", "#f5f0e8"),   # キャメル
    "Giorgio Armani":           ("#1a1a1a", "#f5f5f5"),   # ブラック
    "Dolce & Gabbana":          ("#1a1a1a", "#f5f5f5"),   # ブラック
    "Calvin Klein":             ("#1a1a1a", "#ffffff"),   # モノトーン
    "ISSEY MIYAKE":             ("#4a6670", "#f0f4f5"),   # ブルーグレー
    "LANVIN":                   ("#6b4c8a", "#f5f0f8"),   # パープル
}

DEFAULT_COLORS = ("#1a1a1a", "#f5f5f5")


def get_font(size, bold=False, japanese=False):
    """システムフォントを取得"""
    if japanese:
        jp_paths = [
            "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
            "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        ]
        for p in jp_paths:
            try:
                return ImageFont.truetype(p, size)
            except (OSError, IOError):
                continue

    paths = [
        "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def draw_perfume_silhouette(draw, cx, cy, accent_color, scale=1.0):
    """ミニマルな香水ボトルのシルエットを描画"""
    s = scale

    # ボトル本体（角丸長方形風）
    body_w, body_h = int(120*s), int(220*s)
    body_x = cx - body_w//2
    body_y = cy - body_h//2 + int(40*s)

    # ボトルのグラデーション効果（複数の矩形で表現）
    for i in range(body_h):
        ratio = i / body_h
        # 上から下に微妙なグラデーション
        r = int(int(accent_color[1:3], 16) * (0.85 + 0.15 * ratio))
        g = int(int(accent_color[3:5], 16) * (0.85 + 0.15 * ratio))
        b = int(int(accent_color[5:7], 16) * (0.85 + 0.15 * ratio))
        r, g, b = min(r, 255), min(g, 255), min(b, 255)
        color = f"#{r:02x}{g:02x}{b:02x}"
        draw.rectangle(
            [body_x + int(3*s), body_y + i, body_x + body_w - int(3*s), body_y + i + 1],
            fill=color
        )

    # ボトルの縁取り
    draw.rectangle(
        [body_x, body_y, body_x + body_w, body_y + body_h],
        outline=accent_color, width=2
    )

    # キャップ
    cap_w, cap_h = int(60*s), int(50*s)
    cap_x = cx - cap_w//2
    cap_y = body_y - cap_h + int(5*s)
    draw.rectangle(
        [cap_x, cap_y, cap_x + cap_w, cap_y + cap_h],
        fill=accent_color, outline=accent_color
    )

    # ネック部分
    neck_w = int(40*s)
    neck_x = cx - neck_w//2
    draw.rectangle(
        [neck_x, cap_y + cap_h - int(5*s), neck_x + neck_w, body_y + int(10*s)],
        fill=accent_color
    )

    # ボトル中央の装飾ライン
    line_y = cy + int(20*s)
    draw.line(
        [body_x + int(15*s), line_y, body_x + body_w - int(15*s), line_y],
        fill=accent_color, width=1
    )


def generate_product_image(brand, name, name_ja, size_ml, accent_color, bg_color, output_path):
    """1商品分の画像を生成"""
    img = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(img)

    # 微妙なテクスチャ（ノイズ的な点描）
    import random
    random.seed(hash(brand + name))
    for _ in range(800):
        x = random.randint(0, W-1)
        y = random.randint(0, H-1)
        r, g, b = img.getpixel((x, y))
        delta = random.randint(-3, 3)
        img.putpixel((x, y), (
            max(0, min(255, r + delta)),
            max(0, min(255, g + delta)),
            max(0, min(255, b + delta))
        ))
    draw = ImageDraw.Draw(img)

    # 上部: ブランド名
    font_brand = get_font(28, bold=False)
    brand_upper = brand.upper()
    bbox = draw.textbbox((0, 0), brand_upper, font=font_brand)
    brand_w = bbox[2] - bbox[0]
    draw.text(
        ((W - brand_w) // 2, 80),
        brand_upper,
        fill=accent_color,
        font=font_brand
    )

    # ブランド名の下に細い線
    line_w = min(brand_w + 40, W - 100)
    draw.line(
        [(W - line_w) // 2, 120, (W + line_w) // 2, 120],
        fill=accent_color,
        width=1
    )

    # 中央: 香水ボトルのシルエット
    draw_perfume_silhouette(draw, W // 2, H // 2 - 30, accent_color, scale=1.2)

    # 下部: 商品名
    font_name = get_font(36, bold=True)
    bbox = draw.textbbox((0, 0), name, font=font_name)
    name_w = bbox[2] - bbox[0]
    name_y = H - 220
    draw.text(
        ((W - name_w) // 2, name_y),
        name,
        fill=accent_color,
        font=font_name
    )

    # 日本語名
    if name_ja:
        font_ja = get_font(20, japanese=True)
        bbox_ja = draw.textbbox((0, 0), name_ja, font=font_ja)
        ja_w = bbox_ja[2] - bbox_ja[0]
        draw.text(
            ((W - ja_w) // 2, name_y + 50),
            name_ja,
            fill=accent_color,
            font=font_ja
        )

    # 容量
    font_size = get_font(18)
    size_text = size_ml
    bbox_s = draw.textbbox((0, 0), size_text, font=font_size)
    s_w = bbox_s[2] - bbox_s[0]
    draw.text(
        ((W - s_w) // 2, H - 140),
        size_text,
        fill=accent_color,
        font=font_size
    )

    # 下部の装飾ライン
    draw.line(
        [(W//2 - 30), H - 110, (W//2 + 30), H - 110],
        fill=accent_color,
        width=1
    )

    # COLLEGRANCE ロゴテキスト（最下部）
    font_logo = get_font(12)
    logo_text = "COLLEGRANCE"
    bbox_l = draw.textbbox((0, 0), logo_text, font=font_logo)
    l_w = bbox_l[2] - bbox_l[0]
    draw.text(
        ((W - l_w) // 2, H - 80),
        logo_text,
        fill=accent_color,
        font=font_logo
    )

    # JPEG保存（高品質）
    img.save(output_path, "JPEG", quality=90, optimize=True)
    return os.path.getsize(output_path)


def main():
    os.makedirs(DEST, exist_ok=True)

    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)

    generated = 0
    updated = False

    for p in products:
        # 既に画像がある商品はスキップ
        if p.get("img") and os.path.exists(p["img"]):
            continue

        brand = p["brand"]
        name = p["name"]
        name_ja = p.get("nameJa", "")
        size = p.get("size", "")

        accent, bg = BRAND_COLORS.get(brand, DEFAULT_COLORS)

        # ファイル名
        safe_name = f"product_{p['id']:02d}.jpg"
        output_path = os.path.join(DEST, safe_name)

        file_size = generate_product_image(brand, name, name_ja, size, accent, bg, output_path)

        # products.jsonを更新
        p["img"] = f"assets/images/fullbottle/{safe_name}"
        updated = True
        generated += 1

        print(f"✅ {safe_name} ({file_size//1024}KB) - {brand} / {name}")

    if updated:
        with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n合計: {generated}枚の画像を生成しました")


if __name__ == "__main__":
    main()
