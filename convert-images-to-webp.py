#!/usr/bin/env python3
"""
商品画像を WebP に変換するスクリプト。

機能:
1. assets/images/fullbottle/*.jpg を .webp に変換（quality=82）
2. 既存 .webp はスキップ（再変換したい場合は --force）
3. 元の .jpg は残す（<picture>タグでフォールバック）

使い方:
  python3 convert-images-to-webp.py                # 未変換のみ
  python3 convert-images-to-webp.py --force        # 全件再変換
  python3 convert-images-to-webp.py --dir DIR      # 別ディレクトリ
"""
import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print('❌ Pillow が必要です: pip3 install Pillow')
    sys.exit(1)


DEFAULT_DIRS = [
    'assets/images/fullbottle',
    'assets/images/journal',
    'assets/images',
]
QUALITY = 82  # WebP品質。82は視覚的にほぼ無損失で、JPEG92相当よりも小さい


def convert_directory(directory: Path, force: bool = False) -> dict:
    """指定ディレクトリの .jpg/.png を .webp に変換"""
    stats = {'converted': 0, 'skipped': 0, 'failed': 0, 'saved_bytes': 0}

    if not directory.exists():
        print(f'⚠️  ディレクトリ不在: {directory}')
        return stats

    images = list(directory.glob('*.jpg')) + list(directory.glob('*.jpeg')) + list(directory.glob('*.png'))
    print(f'📂 {directory}: {len(images)}件')

    for img_path in images:
        webp_path = img_path.with_suffix('.webp')
        if webp_path.exists() and not force:
            stats['skipped'] += 1
            continue

        try:
            with Image.open(img_path) as img:
                # PNG透過対応: RGBAをそのまま保持
                if img.mode == 'RGBA':
                    img.save(webp_path, 'WEBP', quality=QUALITY, method=6)
                else:
                    img.convert('RGB').save(webp_path, 'WEBP', quality=QUALITY, method=6)

            orig_size = img_path.stat().st_size
            new_size = webp_path.stat().st_size
            stats['saved_bytes'] += orig_size - new_size
            stats['converted'] += 1
            ratio = (1 - new_size / orig_size) * 100
            print(f'  ✅ {img_path.name}: {orig_size//1024}KB → {new_size//1024}KB (-{ratio:.0f}%)')
        except Exception as e:
            stats['failed'] += 1
            print(f'  ❌ {img_path.name}: {e}')

    return stats


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force', action='store_true', help='既存.webpも再変換')
    parser.add_argument('--dir', default=None, help='変換対象ディレクトリ（複数指定: カンマ区切り）')
    args = parser.parse_args()

    if args.dir:
        dirs = [Path(d.strip()) for d in args.dir.split(',')]
    else:
        dirs = [Path(d) for d in DEFAULT_DIRS]

    total = {'converted': 0, 'skipped': 0, 'failed': 0, 'saved_bytes': 0}

    for d in dirs:
        s = convert_directory(d, force=args.force)
        for k, v in s.items():
            total[k] += v
        print()

    print('=' * 50)
    print(f'✅ 変換: {total["converted"]}件')
    print(f'⏭️  スキップ: {total["skipped"]}件')
    print(f'❌ 失敗: {total["failed"]}件')
    print(f'💾 削減サイズ: {total["saved_bytes"]/1024/1024:.1f} MB')


if __name__ == '__main__':
    main()
