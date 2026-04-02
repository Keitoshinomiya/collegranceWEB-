#!/usr/bin/env python3
"""
チャネル別 Amazon リンク生成ツール

各チャネル（LINE / TikTok / Instagram / Blog / 自社サイト）用の
UTMパラメータ付きAmazonリンクを一括生成する。

使い方:
  python generate-links.py              # 全チャネル × 全商品のリンクを生成
  python generate-links.py --channel line  # LINE用のみ
  python generate-links.py --csv        # CSV出力
"""

import json
import argparse
import sys
from urllib.parse import urlencode

def load_config():
    with open('attribution-config.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_link(asin, channel_key, channel_config):
    base = f"https://www.amazon.co.jp/dp/{asin}"
    params = {}

    # Attribution タグがあればそれを使用
    tag = channel_config.get('tag', '')
    if tag:
        params['maas'] = tag

    # UTMパラメータを追加（トラッキング用）
    utm = channel_config.get('utm', '')
    if utm:
        for pair in utm.split('&'):
            k, v = pair.split('=', 1)
            params[k] = v

    # ref パラメータ（チャネル識別用フォールバック）
    params['ref'] = f'clg_{channel_key}'

    return f"{base}?{urlencode(params)}" if params else base

def main():
    parser = argparse.ArgumentParser(description='チャネル別Amazonリンク生成')
    parser.add_argument('--channel', help='特定チャネルのみ生成')
    parser.add_argument('--csv', action='store_true', help='CSV形式で出力')
    parser.add_argument('--campaign', default='', help='utm_campaignを追加')
    args = parser.parse_args()

    config = load_config()
    channels = config['channels']
    products = config['products']

    if args.channel:
        if args.channel not in channels:
            print(f"Error: channel '{args.channel}' not found. Available: {', '.join(channels.keys())}")
            sys.exit(1)
        channels = {args.channel: channels[args.channel]}

    if args.csv:
        print("channel,channel_name,asin,product_name,url")

    for ch_key, ch_conf in channels.items():
        if not args.csv:
            print(f"\n{'='*60}")
            print(f"📢 {ch_conf['name']} ({ch_key})")
            print(f"{'='*60}")

        for product in products:
            # キャンペーン指定があれば追加
            if args.campaign:
                ch_conf_copy = dict(ch_conf)
                utm = ch_conf_copy.get('utm', '')
                ch_conf_copy['utm'] = f"{utm}&utm_campaign={args.campaign}"
                url = generate_link(product['asin'], ch_key, ch_conf_copy)
            else:
                url = generate_link(product['asin'], ch_key, ch_conf)

            if args.csv:
                print(f"{ch_key},{ch_conf['name']},{product['asin']},{product['name']},{url}")
            else:
                print(f"  {product['name']}")
                print(f"    {url}")
                print()

    if not args.csv:
        print(f"\n{'='*60}")
        print("💡 使い方:")
        print("  LINE配信: --channel line のリンクをLINEメッセージに貼付")
        print("  TikTok:   --channel tiktok のリンクをプロフィールに設定")
        print("  Instagram: --channel instagram のリンクをストーリーズに設定")
        print("  ブログ:   --channel blog のリンクを記事内に埋め込み")
        print()
        print("  キャンペーン別: --campaign summer2026 でUTM_campaign追加")
        print("  CSV出力:  --csv でスプレッドシート用に出力")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()
