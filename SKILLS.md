# COLLEGRANCE サイト運用スキル一覧
Last Updated: 2026-04-02

---

## 1. 在庫更新（毎週）
**トリガー**: メイクアップから在庫Excelが届いた時
**手順**:
1. Excelファイルを `/Users/keito/Downloads/` に保存
2. 以下を実行:
   - カテゴリ「香水」かつ販売価格¥3,000以上でフィルタ
   - products.jsonの`inStock`を更新（リストにある=true、ない=false）
   - 新商品があればproducts.jsonに追加
   - 価格変更があれば`卸値×1.25×1.10`で再計算
   - **全商品に`concentration`（EDT/EDP等）を設定**（Excelのspec列から取得）
   - catalog_full.jsonを再生成
3. 新商品にはClaudeでnotes + description を生成
4. 新商品の画像を取得 → 品質チェック → Keitoに目視確認依頼
5. `netlify dev`でローカル確認
6. Git commit → Netlifyデプロイ

**注意**: 小分け商品（id 1-23）のinStockはAmazon在庫に依存するため、このExcelでは変更しない

---

## 2. 価格更新
**トリガー**: 仕入れ値変更時
**計算式**: `販売価格 = 卸値（税抜）× 1.25（マージン）× 1.10（消費税）` → 10円単位切り上げ
**対象ファイル**: products.json, catalog_full.json
**スクリプト**: `python update-prices.py`

---

## 3. 商品画像生成 & 品質管理
**トリガー**: 新商品追加時、または画像品質に問題がある時

### 3a. 画像取得
1. `python fetch-product-images.py` — 画像がない商品を自動検出
2. 画像ソース優先順: **公式サイト > 大手EC（Sephora等）> DuckDuckGo検索**
3. `rembg`で背景除去 → グラデーション背景(#F5F3F0〜#EBE8E4)に合成
4. 800x1000px、JPEG quality 92で保存
5. 保存先: `assets/images/fullbottle/`

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
| LOEWE | 同デザイン | 同デザイン | **箱の表記で判別**（画像に箱がある場合要注意） |
| DIOR Sauvage | 同デザイン | キャップ微妙に異なる | |
| Jo Malone | 全ライン共通 | — | |
| BYREDO | 全サイズ共通 | — | |

- **画像取得時に濃度（EDT/EDP）を検索クエリに必ず含める**
- **箱付き画像の場合、箱の表記が商品データの濃度と一致しているか確認**
- **容量違いでも瓶形状が異なることがある** — 仕入れる実物の容量に合った画像を使用

---

## 4. 商品データの必須フィールド
新商品をproducts.jsonに追加する際、以下が**全て埋まっている**ことを確認:

| フィールド | 取得元 | 備考 |
|---|---|---|
| brand | Excelのブランド名 | 英語表記に統一 |
| name / nameJa | Excelの商品名 | 英語名+日本語名 |
| size | Excelの容量 | |
| **concentration** | **Excelのspec列** | **必須。EDT/EDP/EDC/Cologne/Parfum/Body Care** |
| cost | Excelの単価 | |
| sellPrice | cost × 1.25 × 1.10 | 10円切上 |
| notes | Claudeで生成 | "Top, Heart, Base" 形式 |
| tags | Claudeで推定 | floral/woody/citrus/sweet/oriental |
| img | 画像取得スクリプト | 品質チェック+目視確認必須 |
| inStock | true | |
| type | "fullbottle" | 小分けもある場合は "sample_and_fullbottle" |

---

## 5. AI診断カタログ更新
**トリガー**: 在庫更新後
**手順**:
1. products.jsonの全inStock商品からcatalog_full.jsonを再生成
2. 新商品にはClaudeでフレグランスノート（Top/Heart/Base）と日本語説明文を生成
3. **全商品にspec（濃度）が入っていることを確認**
4. Netlify Functionが動的読み込みするので、JSONを更新すればOK

---

## 6. Amazon小分け価格同期
**トリガー**: Amazon販売価格を変更した時
**データソース**: Googleスプレッドシート `1gJhlnIB-01-oF8krjL3VzyhXZgKjLQALulirzx-Arzc` (gid=912844206)
**対象**: products.jsonの`samplePrice`（id 1-23）
**注意**: samplePriceはAmazonの販売価格であり、マージン計算は不要

---

## 7. Amazonレビュー更新
**トリガー**: 月1回程度
**方法**: Seller Central「ブランド」→「カスタマーレビュー」
**対象**: products.jsonの`amazonRating`、`amazonReviewCount`
**注意**: 全小分け商品は親ASIN B0G4RXB2F8のバリエーション。星評価は全商品共通。

---

## 8. TikTok動画差替
**場所**: shop.html内の`<!-- SOCIAL PROOF -->`セクション
**形式**: `<iframe src="https://www.tiktok.com/embed/v2/{VIDEO_ID}"`
**現在**: 7610032768461917458, 7611025632880790792, 7611870041704959252

---

## 9. デプロイ
1. `git add` (対象ファイルを指定)
2. `git commit -m "内容"`
3. `git push`
4. NetlifyがGitHub連携で自動デプロイ

**Netlify環境変数**:
- `ANTHROPIC_API_KEY` — AI診断
- `LINE_CHANNEL_ACCESS_TOKEN` — LINE配信
- `BROADCAST_ENABLED` — LINE配信の安全スイッチ

---

## 10. ブログ記事追加
**データソース**: `assets/js/articles.js`（window.journalArticles）
**手順**: 記事HTML作成 → articles.jsに追加 → 日付降順で自動表示
