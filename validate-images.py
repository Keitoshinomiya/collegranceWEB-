#!/usr/bin/env python3
"""
商品画像の品質検証 & 自動再生成スクリプト
- 背景除去の品質チェック（輪郭ぼやけ、残留物検出）
- 不合格画像は別ソースで再取得→再生成
- レポート出力

使い方:
  python validate-images.py              # 全画像チェック、不合格をレポート
  python validate-images.py --fix        # 不合格画像を自動で再取得・再生成
  python validate-images.py --id 47 55   # 指定IDのみチェック
"""

import json, os, sys, io, argparse, time, re
import numpy as np
from PIL import Image, ImageFilter, ImageStat

DEST = "assets/images/fullbottle"
W, H = 800, 1000
QUALITY = 92
BG_TOP = (245, 243, 240)
BG_BOTTOM = (238, 235, 232)


def check_edge_sharpness(img):
    """エッジのシャープネスを検出。ぼやけた輪郭はスコアが低い"""
    gray = img.convert('L')
    edges = gray.filter(ImageFilter.FIND_EDGES)
    stat = ImageStat.Stat(edges)
    return stat.mean[0]


def check_background_residue(img):
    """背景領域に余計なオブジェクトが残っていないかチェック"""
    arr = np.array(img.convert('RGB'))
    bg_mask = (
        (arr[:,:,0] > 220) & (arr[:,:,0] < 255) &
        (arr[:,:,1] > 218) & (arr[:,:,1] < 255) &
        (arr[:,:,2] > 215) & (arr[:,:,2] < 255)
    )
    non_bg_ratio = 1.0 - bg_mask.sum() / (arr.shape[0] * arr.shape[1])

    h, w = arr.shape[:2]
    margin = 0.10
    edge_regions = np.zeros((h, w), dtype=bool)
    edge_regions[:int(h*margin), :] = True
    edge_regions[int(h*(1-margin)):, :] = True
    edge_regions[:, :int(w*margin)] = True
    edge_regions[:, int(w*(1-margin)):] = True

    edge_non_bg = (~bg_mask & edge_regions).sum()
    edge_total = edge_regions.sum()
    edge_residue_ratio = edge_non_bg / edge_total if edge_total > 0 else 0

    return non_bg_ratio, edge_residue_ratio


def check_object_size(img):
    """主要オブジェクト（瓶）が適切なサイズか"""
    arr = np.array(img.convert('RGB'))
    bg_mask = (arr[:,:,0] > 220) & (arr[:,:,1] > 218) & (arr[:,:,2] > 215)
    non_bg = ~bg_mask

    rows = non_bg.any(axis=1)
    cols = non_bg.any(axis=0)
    if not rows.any():
        return 0, 0, 0
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    obj_height_ratio = (rmax - rmin) / arr.shape[0]
    obj_width_ratio = (cmax - cmin) / arr.shape[1]
    obj_area_ratio = non_bg.sum() / (arr.shape[0] * arr.shape[1])

    return obj_height_ratio, obj_width_ratio, obj_area_ratio


def validate_image(filepath):
    """画像を検証し、品質スコアと問題点を返す"""
    issues = []
    scores = {}

    try:
        img = Image.open(filepath)
    except Exception as e:
        return {'pass': False, 'issues': [f'読み込みエラー: {e}'], 'scores': {}}

    # 1. エッジシャープネス
    edge_score = check_edge_sharpness(img)
    scores['sharpness'] = round(edge_score, 2)
    if edge_score < 1.5:
        issues.append(f'輪郭ぼやけ (sharpness={edge_score:.1f}, 基準≥1.5)')

    # 2. 背景残留
    non_bg_ratio, edge_residue = check_background_residue(img)
    scores['non_bg'] = round(non_bg_ratio, 3)
    scores['edge_residue'] = round(edge_residue, 3)
    if edge_residue > 0.15:
        issues.append(f'背景残留 (端の{edge_residue:.0%}に残留物, 基準≤15%)')

    # 3. オブジェクトサイズ
    obj_h, obj_w, obj_area = check_object_size(img)
    scores['obj_area'] = round(obj_area, 3)
    if obj_area < 0.015:
        issues.append(f'商品が小さすぎ (面積{obj_area:.1%}, 基準≥1.5%)')
    if obj_area > 0.65:
        issues.append(f'背景除去不十分 (面積{obj_area:.0%}, 基準≤65%)')

    # 4. サイズ
    if img.size != (W, H):
        issues.append(f'サイズ不正 {img.size}')

    # 5. 形状チェック: 香水瓶は一般的に縦長。横広の塊は誤画像の可能性
    if obj_h > 0 and obj_w > 0:
        aspect = obj_h / obj_w if obj_w > 0 else 0
        scores['aspect'] = round(aspect, 2)
        if aspect < 0.45:
            issues.append(f'横広すぎ — 瓶でない可能性 (縦横比={aspect:.2f}, 基準≥0.45)')

    # 6. 色の異常チェック: 極端に彩度が高い領域が大きい場合は誤画像
    arr_rgb = np.array(img.convert('RGB'))
    # Calculate saturation (simple: max-min of RGB channels)
    r, g, b = arr_rgb[:,:,0].astype(float), arr_rgb[:,:,1].astype(float), arr_rgb[:,:,2].astype(float)
    max_rgb = np.maximum(np.maximum(r, g), b)
    min_rgb = np.minimum(np.minimum(r, g), b)
    saturation = np.where(max_rgb > 0, (max_rgb - min_rgb) / max_rgb, 0)
    high_sat_ratio = (saturation > 0.7).sum() / (arr_rgb.shape[0] * arr_rgb.shape[1])
    scores['high_sat'] = round(float(high_sat_ratio), 3)
    if high_sat_ratio > 0.45:
        issues.append(f'異常に鮮やかな色 — 誤画像の可能性 (高彩度{high_sat_ratio:.0%}, 基準≤45%)')

    return {'pass': len(issues) == 0, 'issues': issues, 'scores': scores}


def make_background():
    """グラデーション背景を生成"""
    bg = Image.new('RGB', (W, H))
    pixels = bg.load()
    for y in range(H):
        r = ratio = y / H
        cr = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * ratio)
        cg = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * ratio)
        cb = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * ratio)
        for x in range(W):
            pixels[x, y] = (cr, cg, cb)
    return bg


def regenerate_image(product_id, products):
    """不合格画像を別ソースから再取得"""
    try:
        import requests
        from rembg import remove
    except ImportError:
        print("  [ERROR] pip install requests rembg が必要")
        return False

    p = next((x for x in products if x['id'] == product_id), None)
    if not p:
        return False

    brand = p.get('brand', '')
    name = p.get('name', '')

    queries = [
        f"{brand} {name} perfume bottle product photo white background",
        f"{brand} {name} fragrance bottle cutout PNG transparent",
        f"{brand} {name} parfum flacon packshot",
    ]

    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

    for qi, query in enumerate(queries):
        print(f"  クエリ{qi+1}: {query[:50]}...")
        try:
            resp = requests.get('https://duckduckgo.com/',
                params={'q': query, 'iax': 'images', 'ia': 'images'},
                headers=headers, timeout=10)
            vqd_match = re.search(r'vqd=["\']([^"\']+)', resp.text)
            if not vqd_match:
                continue

            img_resp = requests.get('https://duckduckgo.com/i.js',
                params={'l': 'jp-jp', 'o': 'json', 'q': query, 'vqd': vqd_match.group(1)},
                headers=headers, timeout=10)
            results = img_resp.json().get('results', [])

            for ri, result in enumerate(results[qi*2:(qi+1)*2+3]):
                img_url = result.get('image', '')
                if not img_url:
                    continue

                print(f"    画像{ri+1} ダウンロード...")
                try:
                    img_data = requests.get(img_url, headers=headers, timeout=15).content
                except:
                    continue

                print(f"    背景除去...")
                removed = remove(img_data,
                    alpha_matting=True,
                    alpha_matting_foreground_threshold=240,
                    alpha_matting_background_threshold=10,
                    alpha_matting_erode_size=10)
                fg = Image.open(io.BytesIO(removed)).convert('RGBA')

                bg = make_background()
                fg_w, fg_h = fg.size
                target_h = int(H * 0.78)
                scale = target_h / fg_h
                new_w, new_h = int(fg_w * scale), target_h
                if new_w > W * 0.85:
                    scale = (W * 0.85) / fg_w
                    new_w, new_h = int(fg_w * scale), int(fg_h * scale)

                fg_resized = fg.resize((new_w, new_h), Image.LANCZOS)
                paste_x = (W - new_w) // 2
                paste_y = int(H * 0.08)
                bg.paste(fg_resized, (paste_x, paste_y), fg_resized)

                temp_path = f"/tmp/validate_temp_{product_id}.jpg"
                bg.save(temp_path, 'JPEG', quality=QUALITY)

                check = validate_image(temp_path)
                if check['pass']:
                    img_name = p.get('img', '').split('/')[-1] or f'product_{product_id:02d}.jpg'
                    final_path = os.path.join(DEST, img_name)
                    bg.save(final_path, 'JPEG', quality=QUALITY)
                    print(f"    ✓ 合格！ → {final_path}")
                    os.remove(temp_path)
                    return True
                else:
                    print(f"    ✗ 不合格: {check['issues'][0]}")
                    os.remove(temp_path)

        except Exception as e:
            print(f"    エラー: {e}")
        time.sleep(1)

    print(f"  ✗ 全クエリで合格画像を取得できず")
    return False


def main():
    parser = argparse.ArgumentParser(description='商品画像の品質検証')
    parser.add_argument('--fix', action='store_true', help='不合格画像を自動再生成')
    parser.add_argument('--id', nargs='+', type=int, help='指定IDのみチェック')
    args = parser.parse_args()

    with open('products.json') as f:
        products = json.load(f)

    targets = [p for p in products if p.get('img')]
    if args.id:
        targets = [p for p in targets if p['id'] in args.id]

    print(f"=== 商品画像品質チェック ({len(targets)}商品) ===\n")

    passed, failed, missing = [], [], []

    for p in targets:
        img_path = p.get('img', '')
        if not os.path.exists(img_path):
            missing.append(p)
            continue

        result = validate_image(img_path)
        if result['pass']:
            passed.append((p, result))
        else:
            failed.append((p, result))
            print(f"✗ id={p['id']:3d} {p['brand']:20s} {p['name'][:25]}")
            for issue in result['issues']:
                print(f"         {issue}")
            print(f"         scores: {result['scores']}")

    print(f"\n{'='*50}")
    print(f"合格: {len(passed)} / 不合格: {len(failed)} / 画像なし: {len(missing)}")

    if failed and args.fix:
        print(f"\n=== 不合格画像を再生成 ({len(failed)}件) ===\n")
        fixed = 0
        for p, result in failed:
            print(f"\n再生成: id={p['id']} {p['brand']} {p['name']}")
            if regenerate_image(p['id'], products):
                fixed += 1
            time.sleep(2)
        print(f"\n修正: {fixed}/{len(failed)}")
    elif failed:
        print(f"\n修正するには: python validate-images.py --fix")


if __name__ == '__main__':
    main()
