#!/usr/bin/env python3
"""
毎週金曜10:00にSlack秘書Botから在庫更新リマインドを送信
crontab: 0 10 * * 5 python3 /Users/keito/GitHub/collegranceWEB-/weekly-reminder.py
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
    'text': (
        "📅 *週次在庫更新のお時間です*\n\n"
        "ターミナルで以下のコマンドを実行してください:\n"
        "```\n"
        "python3 weekly-update.py\n"
        "```\n"
        "処理内容:\n"
        "• メイクアップExcel取得\n"
        "• k-styleスプシ照合\n"
        "• 価格・在庫更新\n"
        "• 画像チェック\n"
        "• デプロイ\n\n"
        "完了後、レポートがこのチャンネルに届きます。"
    ),
}, headers={
    'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
    'Content-Type': 'application/json',
})
print("Reminder sent")
