#!/bin/bash
# Mac Miniにsns-report.pyをセットアップするスクリプト
# MacBook Airで実行: bash setup-macmini-report.sh

MINI="minobetomomi@192.168.0.133"
REMOTE_DIR="~/collegrance"

echo "=== COLLEGRANCE 日次レポート Mac Mini セットアップ ==="

# 1. リモートディレクトリ作成
echo "[1/4] ディレクトリ作成..."
ssh $MINI "mkdir -p $REMOTE_DIR"

# 2. 必要ファイル転送
echo "[2/4] ファイル転送..."
scp sns-report.py $MINI:$REMOTE_DIR/
scp ga4-service-account.json $MINI:$REMOTE_DIR/
scp .env $MINI:$REMOTE_DIR/

# 3. パッケージインストール
echo "[3/4] パッケージインストール..."
ssh $MINI "pip3 install google-analytics-data requests"

# 4. morning_batch.sh に追記
echo "[4/4] morning_batch.sh に追記..."
ssh $MINI 'grep -q "sns-report" ~/morning_batch.sh 2>/dev/null || cat >> ~/morning_batch.sh << "BATCH"

# --- COLLEGRANCE 日次レポート ---
echo "[$(date +%H:%M)] COLLEGRANCE 日次レポート開始"
cd ~/collegrance && python3 sns-report.py --daily >> ~/batch_logs/collegrance_report.log 2>&1
echo "[$(date +%H:%M)] COLLEGRANCE 日次レポート完了"
BATCH'

# 週次レポートは weekly_batch.sh に追記
ssh $MINI 'grep -q "sns-report.*weekly" ~/weekly_batch.sh 2>/dev/null || cat >> ~/weekly_batch.sh << "BATCH"

# --- COLLEGRANCE 週次レポート ---
echo "[$(date +%H:%M)] COLLEGRANCE 週次レポート開始"
cd ~/collegrance && python3 sns-report.py --weekly >> ~/batch_logs/collegrance_report.log 2>&1
echo "[$(date +%H:%M)] COLLEGRANCE 週次レポート完了"
BATCH'

echo ""
echo "=== セットアップ完了 ==="
echo "  日次: morning_batch.sh に追加（毎日 9:00-11:50）"
echo "  週次: weekly_batch.sh に追加（月曜 9:00-11:50）"
echo "  月次: 手動実行 or 別途cron追加"
echo ""
echo "テスト実行: ssh $MINI 'cd $REMOTE_DIR && python3 sns-report.py --daily --dry-run'"
