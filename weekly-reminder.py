#!/usr/bin/env python3
"""
毎週金曜10:00にSlack秘書Botから在庫更新リマインドを送信
crontab: 0 10 * * 5 cd /Users/keito/GitHub/collegranceWEB- && python3 weekly-reminder.py
"""
import os, requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(SCRIPT_DIR, '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN', '')
SLACK_CHANNEL = 'C091LDC8MKN'

requests.post('https://slack.com/api/chat.postMessage', json={
    'channel': SLACK_CHANNEL,
    'blocks': [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "📅 週次在庫更新のお時間です"}
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": "ターミナルで以下のコマンドを実行してください:"}
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": "```cd /Users/keito/GitHub/collegranceWEB- && python3 weekly-update.py```"}
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": "*処理内容:*\n• メイクアップ最新Excel取得（Gmail API）\n• k-styleスプシ照合（価格比較）\n• products.json 価格・在庫更新\n• 新商品の画像取得・品質チェック\n• AI診断カタログ更新\n• 価格8項目チェック\n• Git push → 自動デプロイ"}
        },
        {
            "type": "divider"
        },
        {
            "type": "context",
            "elements": [{"type": "mrkdwn", "text": "完了後、レポートがこのチャンネルに届きます。所要時間: 約10秒"}]
        }
    ]
}, headers={
    'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
    'Content-Type': 'application/json',
})
print("Reminder sent")
