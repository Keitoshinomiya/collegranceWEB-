#!/bin/bash
# 本番の要の画面が開くかを確かめる（2026-11-28 _redirects の差し込みミスで全ページが約8分開かなかった再発防止）
# 使い方: bash scripts/check-live.sh   … _redirects・netlify.toml を変える前と、push後の公開を待ってから実行する
# 1つでも NG なら終了コード1
B=${1:-https://collegrance.com}; ng=0
chk(){ # 名前 期待 実際
  if [[ "$3" == $2 ]]; then echo "OK  $1 ($3)"; else echo "NG  $1 期待:$2 実際:$3"; ng=1; fi; }
chk "トップ"   "200 text/html*" "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' "$B/")"
chk "カート"   "200 text/html*" "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' "$B/?cart=1")"
# 決済：中身なしで呼ぶと関数が4xxで断る＝関数まで届いている（3xxなら転送に食われている）
chk "決済"     "4[0-9][0-9]"     "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{}' "$B/.netlify/functions/create-checkout")"
chk "お試しの設定" "200"          "$(curl -s -o /dev/null -w '%{http_code}' "$B/data/samples.json")"
chk "特商法"   "200"             "$(curl -s -o /dev/null -w '%{http_code}' "$B/tokushoho.html")"
chk "画像の転送" "302 https://images.collegrance.com/*" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$B/assets/images/samples/019.jpg")"
exit $ng
