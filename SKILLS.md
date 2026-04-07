# COLLEGRANCE サイト運用スキル一覧
Last Updated: 2026-04-08

---

## 1. 在庫更新（メイクアップExcel受信時の完全フロー）
**トリガー**: メイクアップ（yamamoto@makeup-inc.com）から価格リストExcelが届いた時
**自動スクリプト**: `python check-makeup-email.py`（Mac Mini cronで毎朝10時実行）

### Step 1: Excel取得
```
Gmail API で yamamoto@makeup-inc.com の新着メールチェック
  ↓ 添付Excelを自動ダウンロード
  ↓ Slackに「新しい価格リストが届きました」通知
```

### Step 2: メイクアップExcelとk-styleスプシの照合
```
メイクアップExcel: カテゴリ「香水」× 販売価格¥3,000以上でフィルタ
  ↓
k-styleスプシ（https://docs.google.com/spreadsheets/d/1B2Y5Lh670VzwS7TvvPGuhK-4t_pCwAdebJTdxwhSQH4/）と照合
  ↓
同一商品がある場合 → 高い方の卸値を採用（安全策）
  ・理由: k-styleは安いが情報伝搬が遅い。高い方で設定すればどちらから仕入れても利益が出る
  ・判断に迷う場合 → Slack（C091LDC8MKN）でKeitoに確認
```

### Step 3: products.json更新
```
・inStock ON/OFF（リストにある=true、ない=false）
・価格更新（高い方の卸値 × 1.25 × 1.10、10円切上）
・concentration設定（Excelのspec列: EDTSP→EDT, EDPSP→EDP等）
・同一商品のサイズ違いは最大サイズのみ表示（小さいサイズはinStock=false）
・重複チェック（同ブランド・同名・同サイズ・同濃度）→ 重複あればSlack通知
```

### Step 4: 新商品の処理
```
新商品があれば:
  ① products.jsonに追加（全必須フィールドを埋める）
  ② concentration（濃度）設定
  ③ Claudeでnotes（Top/Heart/Base）+ description生成
  ④ 画像取得（python fetch-product-images.py --id {新ID}）
  ⑤ 画像品質チェック（python validate-images.py --id {新ID}）
  ⑥ Keitoに画像目視確認依頼（特にEDT/EDP瓶の違い）
```

### Step 5: カタログ・表示更新
```
・catalog_full.json再生成（AI診断用、全在庫商品をカバー）
・デフォルト並び順の確認:
  ① 小分けあり商品が最上位
  ② 売上数順
  ③ ブランド人気度順
  ④ ブランド名アルファベット順
```

### Step 6: 検証
```
・python check-prices.py（価格5重チェック: 計算・サイズ整合・範囲・濃度・重複）
・python validate-images.py（画像品質チェック: 全商品）
・検索テスト（部分一致・日本語・英語・複数語で引っかかるか）
・Slackにレポート送信
```

### Step 7: デプロイ
```
・git add / commit / push
・Netlifyプレビューで確認
・Keitoの承認後、mainにマージ（本番反映）
```

### 注意事項
- 小分け商品（id 1-23）のinStockはAmazon在庫に依存するため、このExcelでは変更しない
- k-styleにしかない商品もproducts.jsonに追加する（k-styleスプシを都度確認）
- 画像カバー率100%を維持（新商品追加時は必ず画像取得）
- AI診断カタログ（catalog_full.json）も100%カバーを維持

### cron設定（Mac Mini）
```
0 10 * * * cd /Users/keito/GitHub/collegranceWEB- && SLACK_BOT_TOKEN=xoxb-... python3 check-makeup-email.py >> /var/log/collegrance-inventory.log 2>&1
```

---

## 2. 価格ルール
**計算式**: `販売価格 = 高い方の卸値（税抜）× 1.25（マージン）× 1.10（消費税）` → 10円単位切り上げ
**対象ファイル**: products.json, catalog_full.json

**仕入れ先比較**:
- メイクアップ（Excel、3日に1回更新）とk-style（スプシ、更新遅め）を比較
- **高い方の卸値を採用**（安全策: どちらから仕入れても利益確保）
- 判断に迷う場合はSlackでKeitoに確認

**チェックスクリプト**: `python check-prices.py`
- 計算チェック（卸値×1.25×1.10 = sellPrice）
- サイズ整合（大サイズが小サイズより安くないか）
- 価格範囲（¥1,000未満 or ¥60,000超は異常）
- 濃度漏れ（全商品にconcentration必須）
- 重複（同ブランド・同名・同サイズ・同濃度で複数存在しないか）

---

## 3. 商品画像生成 & 品質管理
**トリガー**: 新商品追加時、または画像品質に問題がある時

### 3a. 画像取得
1. `python fetch-product-images.py` — 画像がない商品を自動検出
2. 画像ソース優先順: **公式サイト > 大手EC（Sephora等）> DuckDuckGo検索**
3. **検索クエリにEDT/EDPの濃度を必ず含める**
4. `rembg`で背景除去 → グラデーション背景(#F5F3F0〜#EBE8E4)に合成
5. 800x1000px、JPEG quality 92で保存
6. 保存先: `assets/images/fullbottle/`

**オプション**: `--all` 全再取得 / `--id 1 3 8` 指定IDのみ

### 3b. 品質チェック（必ず取得後に実行）
```
python validate-images.py          # 全画像チェック
python validate-images.py --fix    # 不合格画像を自動再生成
python validate-images.py --id 21  # 指定IDのみ
```

**判定基準**:
| 指標 | 合格基準 | 検出内容 |
|---|---|---|
| sharpness | ≥ 1.5 | 極端なぼやけ |
| edge_residue | ≤ 15% | 背景残留物（花・影） |
| obj_area | 1.5%〜65% | 瓶が極端に小さい or 背景除去失敗 |
| aspect | ≥ 0.45 | 横広すぎ（瓶でない可能性） |
| high_sat | ≤ 45% | 異常な色（誤画像の可能性） |

### 3c. ⚠️ EDT/EDP瓶の違い（信頼度に直結）

**自動チェックだけでは検出できない問題。新商品画像追加後は必ずKeitoに目視確認を依頼すること。**

| ブランド | EDT | EDP | 注意点 |
|---|---|---|---|
| DIPTYQUE | 新型:楕円型白ラベル | 楕円型黒ラベル | ラベル色で判別 |
| LOEWE | 同デザイン | 同デザイン | **箱の表記で判別** |
| DIOR Sauvage | 同デザイン | キャップ微妙に異なる | |
| Jo Malone | 全ライン共通 | — | |
| BYREDO | 全サイズ共通 | — | |

- **箱付き画像の場合、箱の表記が商品データの濃度と一致しているか確認**
- **広告画像（モデル+ロゴ等）は使用しない** — 瓶単体 or 箱+瓶のプロダクトショットのみ
- **画像カバー率100%を維持** — 在庫あり商品に画像がない状態にしない

---

## 4. 商品データの必須フィールド
新商品をproducts.jsonに追加する際、以下が**全て埋まっている**ことを確認:

| フィールド | 取得元 | 備考 |
|---|---|---|
| brand | Excelのブランド名 | 英語表記に統一 |
| name / nameJa | Excelの商品名 | 英語名+日本語名 |
| size | Excelの容量 | |
| **concentration** | **Excelのspec列** | **必須。EDT/EDP/EDC/Cologne/Parfum/Body Care** |
| cost | 高い方の卸値（メイクアップ or k-style） | |
| sellPrice | cost × 1.25 × 1.10 | 10円切上 |
| notes | Claudeで生成 | "Top, Heart, Base" 形式 |
| tags | Claudeで推定 | floral/woody/citrus/sweet/oriental |
| img | 画像取得スクリプト | 品質チェック+目視確認必須 |
| inStock | true | |
| type | "fullbottle" | 小分けもある場合は "sample_and_fullbottle" |

---

## 5. AI診断カタログ更新
**トリガー**: 在庫更新後
**目標**: 全在庫商品がカタログに含まれていること（100%カバー）

1. products.jsonの全inStock商品からcatalog_full.jsonを再生成
2. 新商品にはClaudeでフレグランスノート（Top/Heart/Base）と日本語説明文を生成
3. **全商品にspec（濃度）が入っていることを確認**
4. Netlify Functionが動的読み込みするので、JSONを更新すればOK

---

## 6. 商品表示ルール

### デフォルト並び順（おすすめ順）
1. **小分けあり商品**（type=sample_and_fullbottle）が最上位
2. **売上数順**（salesCount降順）
3. **ブランド人気度**（全商品の売上合計で順位付け）
4. **ブランド名アルファベット順**

### サイズ違いの扱い
- 同一商品のサイズ違いは**最大サイズのみ表示**
- 小さいサイズはinStock=false

### 検索
- 部分一致対応（「マルジェラ」「レイジー」「ナイル」等）
- 複数語AND検索（「マルジェラ ジャズ」で Jazz Club のみ）
- 日本語・英語混在OK
- 検索対象: ブランド名、商品名、日本語名、notes、濃度、サイズ

### 「もっと見る」ボタン
- PC: 初期24商品表示
- モバイル: 初期12商品表示
- ボタンクリックで追加読み込み

---

## 7. Amazon小分け価格同期
**トリガー**: Amazon販売価格を変更した時
**データソース**: Googleスプレッドシート `1gJhlnIB-01-oF8krjL3VzyhXZgKjLQALulirzx-Arzc` (gid=912844206)
**対象**: products.jsonの`samplePrice`（id 1-23）
**注意**: samplePriceはAmazonの販売価格であり、マージン計算は不要

---

## 8. Amazonレビュー更新
**トリガー**: 月1回程度
**方法**: Seller Central「ブランド」→「カスタマーレビュー」
**対象**: products.jsonの`amazonRating`、`amazonReviewCount`
**注意**: 全小分け商品は親ASIN B0G4RXB2F8のバリエーション。星評価は全商品共通。

---

## 9. TikTok動画差替
**場所**: shop.html内の`<!-- SOCIAL PROOF -->`セクション
**形式**: `<iframe src="https://www.tiktok.com/embed/v2/{VIDEO_ID}"`
**現在**: 7610032768461917458, 7611025632880790792, 7611870041704959252

---

## 10. ブログ記事追加
**データソース**: `assets/js/articles.js`（window.journalArticles）
**手順**: 記事HTML作成 → articles.jsに追加 → 日付降順で自動表示

---

## 11. 注文処理（Stripe決済後）
**トリガー**: Slackに注文通知が届いた時

1. Slack通知で注文内容・配送先を確認
2. 商品を準備・梱包（ギフトラッピングの場合はラッピング+メッセージカード）
3. ヤマト運輸で発送
4. info@collegrance.com から発送完了メール送信（追跡番号付き）
5. Stripeダッシュボード（https://dashboard.stripe.com/payments）で注文ステータス確認

**返品対応**: 未開封・未使用7日以内 → Stripeダッシュボードから返金処理

---

## 12. 本番デプロイ手順（重要）
**現在**: shop.htmlは `feature/catalog-image-enhancements` ブランチ。本番（main）には未反映。

**デプロイ時のチェックリスト**:
1. shop.htmlの`STRIPE_PK`を`pk_live_...`に戻す
2. Netlify環境変数の`STRIPE_SECRET_KEY`を`sk_live_...`に戻す
3. Stripe本番用Webhookを作成（URL: `https://collegrance.com/.netlify/functions/stripe-webhook`）
4. Webhook Signing Secretを`STRIPE_WEBHOOK_SECRET`に設定
5. `python check-prices.py` で全商品価格チェック
6. `python validate-images.py` で全画像チェック
7. mainにマージ → Netlify自動デプロイ
8. 決済テスト（本番カードで小額商品を購入→返金）

**Netlify環境変数**:
- `STRIPE_SECRET_KEY` — テスト中は`sk_test_`、本番は`sk_live_`
- `STRIPE_WEBHOOK_SECRET` — Webhook署名検証
- `ANTHROPIC_API_KEY` — AI診断
- `SLACK_BOT_TOKEN` — Slack通知
- `SLACK_CHANNEL_ID` — C091LDC8MKN
- `LINE_CHANNEL_ACCESS_TOKEN` — LINE配信
- `BROADCAST_ENABLED` — LINE配信の安全スイッチ

---

## 13. Slack通知
**Bot名**: COLLEGRANCE Bot
**チャンネル**: C091LDC8MKN
**Token**: `.env`の`SLACK_BOT_TOKEN`

**通知されるもの**:
- 新規注文（Stripe Webhook経由）
- 在庫更新時のレポート（新商品追加、在庫切れ、価格変更）
- 重複商品の価格確認依頼

**重複商品の価格確認フロー**:
1. 在庫更新で重複検出
2. Slackに「k-style ¥XX vs メイクアップ ¥YY どちらにしますか？」を通知
3. Keitoが回答 → 価格を確定
4. 基本ルール: **高い方の仕入れ値 × 25%マージン**
