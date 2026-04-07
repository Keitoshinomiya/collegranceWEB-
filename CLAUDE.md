# COLLEGRANCE Website - Claude Code ルール
Last Updated: 2026-04-07

> **運用スキル一覧**: `SKILLS.md` を参照（在庫更新、価格更新、画像生成・品質管理、AI診断カタログ更新、デプロイ等）

## 常に日本語で応答してください。

## プロジェクト概要
- **サイト**: collegrance.com（高級ブランド香水の小分け販売 + フルボトル直販）
- **構成**: 静的HTML + JS + Netlify Functions → GitHub → Netlify
- **ブランチ**: `feature/catalog-image-enhancements`（新shop.html）、`main`（本番）
- **プレビュー**: https://deploy-preview-55--collegrance.netlify.app/shop.html
- **GA4**: G-6DM95225F6
- **Stripe**: acct_1SVQAgIYUZm6bpup（フルボトル販売用）
  - 本番キー: `pk_live_...` / `sk_live_...`
  - テストキー: `pk_test_...` / `sk_test_...`（プレビュー環境で使用中）
  - **本番デプロイ前に必ずliveキーに戻すこと**
- **LINE**: @collegrance（lin.ee/BTytLdX）— Harness移行予定
- **Anthropic API**: AI診断用
- **Slack Bot**: COLLEGRANCE Bot → C091LDC8MKN（注文通知・価格確認）

## Netlify環境変数（必須）
| Key | 用途 | 備考 |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe決済 | テスト中は`sk_test_`、本番は`sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | Webhook署名検証 | テスト/本番で別のWebhookを作成 |
| `ANTHROPIC_API_KEY` | AI診断 | |
| `SLACK_BOT_TOKEN` | Slack通知 | |
| `SLACK_CHANNEL_ID` | 通知先チャンネル | C091LDC8MKN |

---

## 1. データ構造

### products.json（182商品、全商品データ）
| フィールド | 説明 |
|---|---|
| `id` | 商品ID |
| `brand` | ブランド名（英語） |
| `name` | 商品名（英語） |
| `nameJa` | 商品名（日本語） |
| `size` | 容量 |
| `concentration` | **必須** — EDT / EDP / EDC / Cologne / Parfum / Body Care |
| `cost` | 卸値（税抜） |
| `sellPrice` | 販売価格（`卸値 × 1.25 × 1.10`、10円切上） |
| `img` | 商品画像パス |
| `notes` | フレグランスノート（"Top, Heart, Base"） |
| `tags` | 香り系統タグ（floral, woody, citrus, sweet, oriental） |
| `type` | `sample_and_fullbottle` or `fullbottle` |
| `inStock` | 在庫状態（false=非表示） |
| `amazonAsin` | Amazon子ASIN（小分け商品のみ） |
| `samplePrice` | Amazon小分け販売価格（小分け商品のみ） |
| `amazonRating` | Amazon星評価（親ASIN B0G4RXB2F8 基準、共通4.2） |
| `amazonReviewCount` | Amazon評価件数 |
| `salesCount` | Amazon小分け販売数 |
| `popular` | 人気フラグ（売上TOP5） |

### catalog_full.json（128商品、AI診断カタログ）
- メイクアップ在庫リストから香水カテゴリ・¥3,000以上でフィルタ
- **全商品にnotes, description, spec(濃度)が必須**
- Netlify Function（ai-diagnosis.js）が動的に読み込む

### 仕入れ・価格ルール
- **マージン**: 25%（`卸値 × 1.25 × 1.10 = 販売価格`）
- **仕入れ先**: メイクアップ（フルボトル主体）+ k-style（小分け・ニッチブランド）
- **安い方から仕入れる** — 同じ商品でも仕入れ先が異なる場合がある
- **在庫の真実**: メイクアップの週次Excelが最新在庫。リストにない=仕入れ不可

---

## 2. shop.html（統合ショップページ）

### 構成
- 公開ページ（SEOルール適用）
- ヘッダー下に常時表示サブナビ（SHOP / ABOUT / JOURNAL / SUPPORT）
- モバイル: ハンバーガーメニュー → ドロワー式ナビ
- ヒーロー → AI診断CTAボタン → Popular Picks → ブランドタイル → Quick Guide → タブ+フィルター → 商品グリッド → TikTokソーシャルプルーフ → LINE CTA → フッター

### タブ（ビュー切替）
すべて / 人気 / 小分け / フルボトル / 新着

### 商品カードUI
- **濃度バッジ**: ブランド名横にEDT/EDP/Cologne等を常に表示
- **ノート表示**: 画像ホバーで白背景オーバーレイ（Top/Heart/Base グリッド）
- **モバイル**: タップでノート → 再タップでライトボックス
- **Amazonレビュー**: 星評価+件数（小分け商品）
- **購入ボタン**: フルボトル → カート追加 / 小分け → Amazon（?th=1&psc=1）

---

## 3. AI香り診断

### Netlify Function: `netlify/functions/ai-diagnosis.js`
- **モデル**: Claude Haiku 4.5（低コスト、高速）
- **カタログ**: catalog_full.jsonから動的読み込み（128商品）
- **出力**: パーソナルレター形式（personalMessage + profileType + 3本の推薦）

### 診断フロー（リピーター/新規分岐）
```
Q1: 試したことある？ → 分岐
  [リピーター] Q2:前回の商品 → Q3:感想 → Q4:次の希望
  [新規]      Q2:シーン → Q3:香り系統 → Q4:印象 → Q5:購入タイプ
  [共通]      強さ+季節 → 性別+年代 → 自由記述
  → AI結果（パーソナルレター + 3本推薦 + LINEで共有）
```

### 重要ルール
- リピーターが「大好き+フルボトル欲しい」→ **1位は必ず同じ商品のフルボトルを推薦**
- フルボトル購入を基本の推薦（自社サイト売上が目的）
- 小分けは「まず試してみる」の保険として提示
- 自由記述には**必ず共感+知識で応答**（パーソナルメッセージに反映）
- サイト訪問者の99%はAmazon小分け購入者 → 次の小分け or フルボトルへ導く

### GA4トラッキング
- `ai_diagnosis_start` / `ai_diagnosis_answer`（各ステップ）/ `ai_diagnosis_complete`
- 診断推薦商品をカートに入れた場合 `from_diagnosis: true` が付与される
- localStorageに診断セッション保存 → 購入との紐付け可能

---

## 4. 商品画像ルール

### 生成
- **スクリプト**: `fetch-product-images.py`（DuckDuckGo検索 → rembg背景除去 → 合成）
- **サイズ**: 800x1000px、JPEG quality 92
- **背景**: グラデーション（#F5F3F0 → #EBE8E4）
- **保存先**: `assets/images/fullbottle/`
- **画像ソース優先順**: 公式サイト > 大手EC（Sephora等）> DuckDuckGo検索

### 品質チェック: `validate-images.py`
- `python validate-images.py` — 全画像チェック
- `python validate-images.py --fix` — 不合格画像を自動再取得
- **チェック項目**: シャープネス(≥1.5)、背景残留(≤15%)、オブジェクトサイズ(≥1.5%)、形状(縦横比≥0.45)、異常彩度(≤45%)

### ⚠️ EDT/EDP 瓶の違いに注意（信頼度に直結）
| ブランド | EDT | EDP |
|---|---|---|
| DIPTYQUE | 旧:丸型 / 新(2022~):楕円型・白ラベル | 楕円型・黒ラベル |
| LOEWE | 同デザイン（箱の表記が異なる） | 同デザイン |
| DIOR Sauvage | 同デザイン | キャップ形状が微妙に異なる |
| Jo Malone | 全ライン同デザイン | — |
| BYREDO | 全サイズ同デザイン | — |

- **画像取得時に濃度（EDT/EDP）を検索クエリに含めること**
- **箱付き画像の場合、箱の表記（Eau de Toilette / Eau de Parfum）が商品データと一致しているか確認**
- **新商品画像追加後は必ずKeitoに目視確認を依頼**

### フルボトル画像にはLe Laboスタイルのフィルターを適用しない

---

## 5. ビジュアル・ロジック保全ルール

### フォント
- `Zen Kaku Gothic Antique` (sans-serif) — 変更禁止

### 画像フィルター (Le Labo スタイル)
- グローバル: `sepia(10%) grayscale(10%) contrast(95%) brightness(102%)`
- ロゴ: `filter: none !important`
- フルボトル商品画像: **フィルターなし**

### 開発プロトコル
1. CSS編集前に既存スタイルの末尾を確認
2. UIの修正は**追記**で行う（大量置換でチューニングを消さない）
3. 変更後は必ず Mobile (< 768px) で検証
4. JS更新時はHTMLのクエリパラメータバージョンを上げる

### SEO基準（公開ページ）
- 対象キーワード: "香水 お試し"、"香水 小分け"、"ブランド香水 少量"
- Title/Description/Canonical/OGP/構造化データ 必須
- Lazy Loading、44x44pxタップターゲット

---

## 6. トラッキング & 計測

### GA4 eコマースイベント（shop.html）
`view_item` / `add_to_cart` / `begin_checkout` / `purchase` / `search` / `select_content` / `cart_abandonment` / `ai_diagnosis_*`

### tracking.js
チャネル判定（UTM/リファラー）、Amazonクリック計測、購入コンバージョン、Attribution タグ付与

### リターゲティング（計画）
Phase 1: GA4イベント ✅ → Phase 2: Meta Pixel → Phase 3: LINE LIFF連携

---

## 7. Stripe決済 & 注文処理

### 決済フロー
```
カート → create-checkout.js → Stripe Checkout画面
  ・商品画像（https://collegrance.com/assets/images/fullbottle/...）
  ・配送先住所入力（日本のみ）
  ・送料自動計算（¥700、¥30,000以上で無料）
  ・ギフトラッピング（+¥300）
→ 決済完了 → stripe-webhook.js
  ・Slack通知（注文詳細、配送先、Stripeリンク）
  ・レシートメール（Stripe設定で有効化済み）
→ サンクスページ（GA4 purchase イベント）
```

### 注文後の運用フロー
1. Slack通知で注文を確認
2. 商品を準備・梱包（ギフトラッピングの場合はラッピング）
3. ヤマト運輸で発送
4. info@collegrance.com から発送完了メール送信（追跡番号付き）

### 重要ルール
- **本番デプロイ前にStripeキーをliveに戻す**（shop.htmlの`STRIPE_PK`とNetlify環境変数の`STRIPE_SECRET_KEY`）
- **Stripe Webhookは本番用とテスト用で別**（本番URL: `https://collegrance.com/.netlify/functions/stripe-webhook`）
- **並行輸入品の表記**: 「海外正規代理店から直接仕入れ。国内定価よりもお求めやすい価格でお届けします。」（ポジティブに表現）

### 配送・返品ポリシー
- 送料: ¥700（¥30,000以上で無料）、小分けはAmazon経由で送料無料
- 配送: ヤマト運輸、2〜4営業日（土日祝除く）、追跡番号通知あり
- 返品: 未開封・未使用に限り7日以内OK。不備があった場合は開封済みでも交換対応
- ギフトラッピング: +¥300、メッセージカード付き

---

## 8. 重複商品の処理ルール

### 同じ商品が複数仕入れ先にある場合
1. **高い方の仕入れ値 × 25%マージン**で販売価格を設定
2. 小分けありの商品（Amazon ASIN付き）を**優先的に残す**
3. 判断に迷う場合は**Slack（C091LDC8MKN）でKeitoに確認**してから決定
4. `check-prices.py`で重複チェックを必ず実行

### 在庫更新時のチェック順序
1. メイクアップExcel読み込み
2. 香水カテゴリ・¥3,000以上でフィルタ
3. 重複チェック → Slack通知（必要に応じて）
4. 価格5重チェック（`python check-prices.py`）
5. 画像品質チェック（`python validate-images.py`）
6. Keitoに目視確認依頼（特にEDT/EDP瓶の違い）

---

## 9. 関連ツール・スクリプト

| ファイル | 用途 |
|---|---|
| `products.json` | 全商品データ（182商品） |
| `catalog_full.json` | AI診断用カタログ（128商品、notes付き） |
| `fetch-product-images.py` | Web画像取得 + rembg背景除去 |
| `validate-images.py` | 商品画像の品質チェック + 自動再生成 |
| `check-prices.py` | 価格5重チェック（計算・サイズ整合・範囲・濃度・重複） |
| `update-prices.py` | 卸値から価格再計算（マージン25%） |
| `stripe-setup.py` | Stripe商品一括登録（画像URL自動変換） |
| `netlify/functions/ai-diagnosis.js` | AI香り診断API |
| `netlify/functions/create-checkout.js` | Stripe Checkout Session作成 |
| `netlify/functions/stripe-webhook.js` | 決済完了→Slack通知 |
| `.env` | APIキー（gitignored） |

---

## 10. ナビゲーション構成（メガメニュー）

各カテゴリにホバーでリッチドロップダウン表示:
```
SHOP（2カラム）:
  カテゴリ: すべて | 人気ランキング | 小分けで試す | フルボトル
  香り系統: フローラル | シトラス | ウッディ | スイート | オリエンタル
  + AIコンシェルジュに相談するリンク

ABOUT: ブランドストーリー | AI香り診断 | 品質へのこだわり | LINEコンシェルジュ
JOURNAL: 新着記事 | レビュー | 香水の基礎知識 | トレンド
SUPPORT: お問い合わせ | 配送・返品 | FAQ | 特商法
```
