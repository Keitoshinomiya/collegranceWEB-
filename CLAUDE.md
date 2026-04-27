# COLLEGRANCE Website - Claude Code ルール
Last Updated: 2026-04-14

> **運用スキル一覧**: `SKILLS.md` を参照（在庫更新、価格更新、画像生成・品質管理、AI診断カタログ更新、デプロイ等）

## 常に日本語で応答してください。

## プロジェクト概要
- **サイト**: collegrance.com（高級ブランド香水の小分け販売 + フルボトル直販）
- **構成**: 静的HTML + JS + Netlify Functions → GitHub → Netlify
- **ブランチ**: `feature/catalog-image-enhancements`（開発）、`main`（本番）
- **ページ構成**: `index.html` = ショップ（トップ）、`brand-story.html` = ブランドストーリー（旧トップ）
- **GA4**: G-6DM95225F6（Property ID: 357932107、CHO-JUアカウント内。**hostName=collegrance.comフィルタ必須**）
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

### 在庫更新の自動化
- **スクリプト**: `check-makeup-email.py`（Gmail API + Python）
- **送信者**: 山本明彦 <yamamoto@makeup-inc.com>
- **頻度**: 週2〜3回（「X/X 価格リスト 【メイクアップ 山本】」形式）
- **Mac Mini cron**: 毎朝10時に自動チェック
- **処理**: Excel添付DL → 在庫更新 → 重複チェック → 新商品notes+画像生成 → Slack通知

### 新商品追加時の必須処理
1. products.jsonに追加（全必須フィールド埋める）
2. **concentration（濃度）設定**（Excelのspec列から）
3. **Claudeでnotes + description生成**
4. **商品画像取得**（`fetch-product-images.py --id {新ID}`）
5. **画像品質チェック**（`validate-images.py --id {新ID}`）
6. **Keitoに画像目視確認依頼**（特にEDT/EDP瓶）
7. catalog_full.json再生成

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

---

## 11. ブログ記事量産フロー

### 生成手順（2ステップ）
```
Step 1: Claude Code に「記事を10本書いて drafts.json に保存して」と指示
Step 2: python3 generate-articles.py
  → Nano Banana (Gemini API) で画像生成 → HTML作成 → articles.js更新 → Slack通知
```

### 記事内の商品導線ルール（必ず守ること）
- **product-card-inline** のショップボタン: `href="/?product={商品ID}"`（`/` ではなく商品直リンク）
- **小分けボタン**: `小分けで試す ¥{価格}` と価格を表示、ASINはproducts.jsonの`amazonAsin`を使用
- **記事末尾CTA**: AI香り診断への誘導を必ず入れる
- **ASIN注意**: products.jsonのamazonAsinフィールドを正とし、推測でASINを書かない

### キャッシュバスティング（重要）
- `articles.js` はキャッシュ対策で `?v=YYYYMMDD` パラメータ付きで読み込んでいる
- **記事追加後は全HTMLの `articles.js?v=` の日付を更新すること**
- netlify.tomlでJSファイルは `max-age=0, must-revalidate`（毎回確認）に設定済み
- CSS・画像は長期キャッシュ（変更なし）

### 画像生成
- Gemini API モデル: `gemini-2.5-flash-image`（Nano Banana）
- 無料枠: 1日50枚（Google AI Studio経由）
- 保存先: `assets/images/journal/{slug}.png`

### 記事の日付
- SEO自然化のため過去日付に分散して設定
- articles.js の `date` と HTML内の `<time>`, `datePublished`, `dateModified` を全て一致させる

---

## 12. 商品パーマリンクと小分けLP

### 商品パーマリンク
- URL: `collegrance.com/?product={ID}`
- アクセスするとページ読み込み後に該当商品カードまでスクロール+ハイライト
- 各商品カードに共有ボタン（↑マーク）あり、クリックでURLコピー
- LINEやSNSで「この商品です」と個別共有可能

### 小分け→フルボトル専用LP
- URL: `collegrance.com/?from=sample&product={ID}`
- 小分け購入者向けの専用オーバーレイモーダルを表示
- 内容: 商品画像、使用期間比較（1週間→半年〜1年）、安心ポイント4つ、カート追加ボタン
- LINE配信のシナリオからこのURLを送ることで、フルボトルへの転換を促進
- `type=sample_and_fullbottle` の商品のみ対象（22商品）

---

## 13. SNSトラッキングとレポート

### UTMリンク設計（UTM_LINKS.md参照）
- Threads: `?utm_source=threads&utm_medium=social&utm_campaign=profile`
- Instagram: `?utm_source=instagram&utm_medium=social&utm_campaign=profile`
- tracking.jsがUTMパラメータ+リファラーから流入元を自動判定し、全GA4イベントに`traffic_source`を付与

### レポートスクリプト（sns-report.py）
```
python3 sns-report.py --daily     # 日次（朝バッチに組み込み予定）
python3 sns-report.py --weekly    # 週次（月曜バッチに組み込み予定）
python3 sns-report.py --monthly   # 月次
```
- GA4 Property: 357932107（CHO-JUアカウント、**hostName=collegrance.comフィルタ済み**）
- サービスアカウント: `ga4-service-account.json`（gitignored）

---

## 14. AI最適化（llms.txt + 構造化データ）

### llms.txt（AI向けサイト情報）
- `llms.txt` — 基本版（サイト概要、専門領域、主要ページ）
- `llms-full.txt` — 詳細版（記事一覧、商品一覧、FAQ）
- **記事追加時は `llms-full.txt` の記事一覧も更新すること**

### 構造化データ（index.html内）
- **Organization** — 合同会社ヤシノミの事業者情報、連絡先、SNSリンク
- **FAQPage** — FAQ8問の構造化データ（FAQ変更時はJSON-LDも更新）
- **BlogPosting** — 各記事HTMLに設置済み（generate-articles.pyで自動生成）
- 今後: Product構造化データの追加を検討（generate-articles.pyにTODOコメント記載済み）

### AI参照されるために意識すべきこと
- 独自の一次情報（嗅ぎ比べ、販売実績）を記事に含める
- 事実を明確に書く（「¥850で約20プッシュ」のような具体的数値）
- 構造化データを正確に保つ（FAQやProductの内容変更時はJSON-LDも更新）

---

## 15. プライバシーポリシー・法務

- `privacy.html` — 個人情報保護法準拠（9項目網羅）
- `tokushoho.html` — 特定商取引法に基づく表記
- **更新が必要なタイミング**: Meta Pixel導入時、新しい第三者サービス追加時、配送ポリシー変更時
- 事業者: 合同会社ヤシノミ、代表: 四宮慶人、info@collegrance.com

---

## 16. COLLEGRANCE 事業全体像

### ビジネスの統合方程式
```
総利益 = 直接販売利益 + LINE経由利益 - 固定費

直接販売利益 = [Amazon注文 × ¥554 - 広告費]
             + [TikTok注文 × ¥360]（広告費ほぼゼロ、認知+販売一気通貫）
             + [メルカリ注文 × ¥315]
             + [ナイトライト × ¥3,180]

LINE経由利益 = (全チャネル注文) × くじ参加率 × LTV(¥1,670) × 45%
             ※広告費ゼロ・モール手数料ゼロ → 利益率2〜3倍
```

### 利益最大化の3つのマスター変数
```
利益 ∝ レビュー数 × くじ参加率 × オーガニックリーチ

① レビュー数 → 全チャネルのCVRに効く（最も広く効く）
② くじ参加率 → 注文を資産(LINE友だち)に変える（利益率を最も改善）
③ オーガニックリーチ → 広告依存脱却（長期的に最重要）

3つが掛け算。1つでもゼロなら利益は伸びない。全て伸ばすと指数関数的成長。
```

### 成長のフライホイール
```
各チャネルで購入 → くじカード → LINE登録 → シナリオ配信
  → フルボトル購入 → 空き瓶 → ナイトライト → TikTok動画 → 認知↑
  → クロスセル → 各チャネル注文↑
  → レビュー投稿 → 全チャネルCVR↑ → 注文↑（ループ）

注文(t+1) = 注文(t) × (1 + レビュー成長) + オーガニック純増 + LINEリピート
→ 広告費を増やさなくても成長する構造
```

### 販売チャネル
| チャネル | 商品 | 役割 | 発送 |
|---|---|---|---|
| Amazon | 小分け+ケース | 広告で集客+マネタイズ（広告費月75万、1位） | FBA |
| TikTok Shop | 小分け+ケース+ナイトライト | 認知(imp)+販売の一気通貫（広告費ほぼゼロ） | ネコポス(ネクストエンジン) |
| メルカリShop | 小分け+ケース+ナイトライト | 販売チャネル | ネコポス(ネクストエンジン) |
| 自社EC(Stripe) | フルボトル+ナイトライト | 高利益率の本命（受注発注、在庫リスクゼロ） | ヤマト運輸 |

### LINE登録の導線（香りくじ施策）
```
全商品にバリアブル印刷カード同梱（ラクスル発注、¥2/枚）
  → QRスキャン → LINE登録 → ユニークコード入力
  → SP-APIで注文突合（不正防止）
  → じゃんけん演出 → 結果表示 + クーポン自動配信

賞品: 全員¥300 OFF / 1/100フルボトル¥10,000 OFF / 5/100 ¥1,000 OFF
「あなたは90人目。あと10人でチャンスリセット！」→ リピート購入動機
目標: 登録率5.3% → 20%、獲得単価¥120/人
```

### 競合
```
MELL fragrance（主要競合）:
  メルカリ: 17,374件累計 / フォロワー3,643 / 日販40〜50件
  TikTok Shop: ~10,000件（5ヶ月）/ 月2,000件
  COLLEGRANCEの強み: Amazon1位、製造販売業許可、LINE CRM、AI診断、ナイトライト
  目標: 各モールでMELLの50%シェア獲得
```

### 運営体制
- 代表: 四宮慶人
- パート: みのべさん（TikTok毎日1本投稿+オペレーション）月16万
- 11月〜: 守殿さん復帰（育休明け）→ 体制強化
- オペレーション固まるまでの発送: 四宮対応

### SNS戦略
| チャネル | 担当 | 状態 | 役割 | 現状数値 |
|---|---|---|---|---|
| TikTok(@collegrance) | みのべさん | 稼働中（毎日1本） | 認知+TikTok Shop | 平均再生2,000回 |
| Threads | keito（中の人） | 準備中 | 問題提起型投稿→認知 | - |
| Instagram | keito | 準備中 | 世界観構築→AI診断 | - |

### ナイトライト事業
- 空き瓶の出所: ①小分け製造時の空き瓶（自社ラボ）+ ②フルボトル購入者の空き瓶（将来回収）
- 3Dプリンタ × 空き瓶 → ナイトライト製作
- 販売: ¥3,480（原価¥300、利益率91%）
- 返送加工: ¥2,480（フルボトル購入者は¥1,000引き → フルボトル購入動機に繋がる循環）
- 製作動画 → TikTokコンテンツ（サステナブル路線）→ 認知拡大
- 月間キャパ: 100個（自社ボトル50 + 返送加工50）

### 実績データ（2025年10月〜2026年3月）
```
Amazon:
  総注文: 21,156件 / 総売上: ¥22,827,324
  広告費合計: ¥4,550,686 / TACOS: 21.9%（目標15%）
  月平均利益: ¥900,099（広告費控除後）
  10月ROAS 1.70 → 3月ROAS 3.58（改善トレンド）
  平均単価: ¥1,079 / ケース付き率30%

アンケート（1,258人回答）:
  フルボトル検討中: 728人（57.9%）→ アップセル対象
  他にも試したい: 1,087人（86.4%）→ クロスセル対象
  満足度★4以上: 88.9%
  男性70% / 50代25% > 40代20% > 30代19% > 20代18%
  きっかけ: YouTube 29% / Amazon 26% / SNS 22%

LINE: 1,300人（登録率5.3%）
Stripe(フルボトル): 5件 / ¥59,800（リニューアル後）
TikTok Shop: 25件（4月ローンチ）
```

### 今期目標（2026年4月〜2027年1月）
```
10ヶ月累計売上: ¥57,200,000（目標5,000万超え）
営業利益: ¥14,623,380（利益率25.6%）
月平均利益: ¥1,462,338

12月ピーク: ¥9,248,000（ギフト需要）
1月反動: ¥5,400,000

将来: 問屋を介さず海外から直接仕入れ → 原価率さらに改善
```

### ユニットエコノミクス
```
Amazon小分け: 粗利¥470/個（ケース付き¥750、加重平均¥554）
TikTok小分け: 粗利¥360/個（手数料7%、ネコポス¥200）
メルカリ小分け: 粗利¥315/個（手数料10%、ネコポス¥200）
フルボトル: 粗利率25%（仕入原価×1.25×1.10、受注発注、在庫リスクゼロ）
ナイトライト(自社ボトル): ¥3,480 - ¥300 = 粗利¥3,180（91%）
ナイトライト(返送加工): ¥2,480 - ¥300 = 粗利¥2,180（88%）
LTV/LINE友だち: ¥1,670（フルボトル¥1,390 + クロスセル¥280）

原価構造: 香水原価(¥48〜548) + 副資材¥45 + マンチャージ¥34 + FBA¥202
ケース原価: ¥20（販売で+¥280の追加利益）
```

### 資料
- `COLLEGRANCE_事業全体像_v2.pptx` — 事業計画書PPT最新版（20スライド）
- `COLLEGRANCE_事業全体像_v1.pptx` — 前バージョン
- `create_pptx.py` — PPT生成スクリプト（内容変更→`python3 create_pptx.py`で再生成）
- `data_summary.json` — 全数値データのJSON
- `create_pptx.py` — PPT生成スクリプト（内容変更時に再実行可能）
