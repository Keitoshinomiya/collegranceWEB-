# COLLEGRANCE UTMリンク設計

各SNSプロフィール・配信チャネルに設定するURLリンク集。
GA4でチャネル別の流入・コンバージョンを計測するために使用。

## SNSプロフィール用

### Threads プロフィール
```
https://collegrance.com/?utm_source=threads&utm_medium=social&utm_campaign=profile
```

### Instagram プロフィール
```
https://collegrance.com/?utm_source=instagram&utm_medium=social&utm_campaign=profile
```

### Instagram ストーリーズ
```
https://collegrance.com/?utm_source=instagram&utm_medium=social&utm_campaign=stories
```

## メッセージ配信用

### LINE
```
https://collegrance.com/?utm_source=line&utm_medium=social&utm_campaign=message
```

## 記事・コンテンツ用

### ブログ記事内リンク
```
https://collegrance.com/?utm_source=blog&utm_medium=article&utm_campaign={slug}
```
`{slug}` は記事ごとのスラッグに置き換える（例: `how-to-choose-perfume`）

## パラメータ説明

| パラメータ | 説明 | 例 |
|---|---|---|
| `utm_source` | 流入元プラットフォーム | threads, instagram, line, blog |
| `utm_medium` | メディアタイプ | social, article |
| `utm_campaign` | キャンペーン/コンテキスト | profile, stories, message, {slug} |

## 運用ルール
- 新しいSNSや配信チャネルを追加する場合はこのファイルを更新する
- `tracking.js` のリファラー判定にも対応するチャネルを追加する
- GA4のカスタムディメンション `traffic_source` / `traffic_medium` / `traffic_campaign` で分析可能
