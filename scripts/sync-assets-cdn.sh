#!/bin/bash
# assets/images を Cloudflare Pages（collegrance-assets / images.collegrance.com）へ同期する。
#
# なぜ: Netlify の帯域（全サイト合計100GB/月・超過100GBごと$55）を collegrance.com の画像が食い潰していたため、
#       2026-11-09 から /assets/images/* は _redirects で images.collegrance.com へ転送している。
#       （動画 assets/videos は Cloudflare Pages が Range 非対応で iPhone の Safari で再生できないため Netlify に残す）
#       → Netlify に画像を足しただけでは表示されない。必ずこのスクリプトで Cloudflare 側にも載せること。
#       通常は .git/hooks/pre-push（scripts/git-hooks/pre-push）が main への push 前に自動で実行する。
#
# 使い方: bash scripts/sync-assets-cdn.sh [ref]   （ref 省略時は HEAD。git 管理下のファイルだけを載せる）
set -euo pipefail
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
REF="${1:-HEAD}"
PROJECT="collegrance-assets"
STAGE="$HOME/.cache/collegrance-assets-cdn"
SITE="$STAGE/site"
LIST="$STAGE/files.txt"

mkdir -p "$SITE"
cd "$REPO"

# 対象 = ref に含まれる git 管理下の画像（未コミットの作業中ファイルは載せない）
git ls-tree -r --name-only "$REF" -- assets/images | sort > "$LIST"
COUNT=$(wc -l < "$LIST" | tr -d ' ')
[ "$COUNT" -gt 0 ] || { echo "対象ファイルが0件。中止"; exit 1; }

# ref の中身をステージへ（作業ツリーではなくコミット内容を使う）
git archive --format=tar "$REF" -- assets/images | tar -x -C "$SITE"

# ref から消えたファイル（と対象外の assets/ 配下）をステージからも消す
( cd "$SITE" && find assets -type f | sort ) | comm -13 "$LIST" - | while IFS= read -r f; do rm -f "$SITE/$f"; done

# Netlify と同じキャッシュ方針（画像は1年）
cat > "$SITE/_headers" <<'EOF'
/assets/images/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
EOF
cat > "$SITE/index.html" <<'EOF'
<!doctype html><meta charset="utf-8"><title>COLLEGRANCE assets</title><a href="https://collegrance.com/">collegrance.com</a>
EOF

echo "Cloudflare Pages ($PROJECT) へ ${COUNT} ファイルを同期します（変更分だけ送信）"
npx --yes wrangler@3 pages deploy "$SITE" --project-name "$PROJECT" --branch main --commit-dirty=true
echo "同期完了: https://images.collegrance.com/"
