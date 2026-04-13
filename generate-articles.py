from __future__ import annotations

"""
COLLEGRANCE ブログ記事量産スクリプト

使い方（2ステップ）:
  Step 1: Claude Code に「記事を10本書いて drafts.json に保存して」と指示
  Step 2: python3 generate-articles.py

処理:
  1. drafts.json から記事データ読み込み
  2. Gemini API でアイキャッチ画像生成
  3. HTMLテンプレートに流し込み → article-{slug}.html 保存
  4. articles.js に追記
  5. Slack通知
"""

import argparse
import base64
import json
import os
import re
import sys
import traceback
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import requests

# ── .env 読み込み ──────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

env_path = os.path.join(SCRIPT_DIR, '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

# ── 定数 ──────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN', '')
SLACK_CHANNEL = 'C091LDC8MKN'

DRAFTS_PATH = os.path.join(SCRIPT_DIR, 'drafts.json')
KEYWORDS_PATH = os.path.join(SCRIPT_DIR, 'keywords.json')
ARTICLES_JS_PATH = os.path.join(SCRIPT_DIR, 'assets', 'js', 'articles.js')
IMAGES_DIR = os.path.join(SCRIPT_DIR, 'assets', 'images', 'journal')

JST = timezone(timedelta(hours=9))

# ── ユーティリティ ─────────────────────────────────────────

def load_keywords() -> List[Dict[str, Any]]:
    with open(KEYWORDS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_keywords(keywords: List[Dict[str, Any]]) -> None:
    with open(KEYWORDS_PATH, 'w', encoding='utf-8') as f:
        json.dump(keywords, f, ensure_ascii=False, indent=2)
    print(f"  keywords.json 更新完了")


def get_unused_keywords(keywords: List[Dict[str, Any]], count: int) -> List[Dict[str, Any]]:
    unused = [kw for kw in keywords if not kw.get('used', False)]
    return unused[:count]


# ── drafts.json 読み込み ──────────────────────────────────

def load_drafts() -> List[Dict[str, Any]]:
    """Claude Code が生成した drafts.json を読み込む"""
    if not os.path.exists(DRAFTS_PATH):
        print(f"[ERROR] {DRAFTS_PATH} が見つかりません")
        print("  先に Claude Code で記事を生成して drafts.json に保存してください")
        sys.exit(1)
    with open(DRAFTS_PATH, 'r', encoding='utf-8') as f:
        drafts = json.load(f)
    # 未処理のものだけ返す
    return [d for d in drafts if not d.get('processed', False)]


def mark_draft_processed(slug: str) -> None:
    """drafts.json 内の該当記事を processed: true にする"""
    with open(DRAFTS_PATH, 'r', encoding='utf-8') as f:
        drafts = json.load(f)
    for d in drafts:
        if d.get('slug') == slug:
            d['processed'] = True
            break
    with open(DRAFTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(drafts, f, ensure_ascii=False, indent=2)


# ── Gemini API（画像生成） ─────────────────────────────────

def generate_image_with_gemini(prompt: str, slug: str) -> Optional[str]:
    """Gemini APIでアイキャッチ画像を生成し、保存パスを返す"""

    full_prompt = (
        f"Generate an aesthetic, editorial-style blog header image for a luxury perfume article. "
        f"Horizontal aspect ratio (16:9), elegant and sophisticated mood, soft lighting, muted color palette. "
        f"No text or watermarks in the image. "
        f"{prompt}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": full_prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()

        # レスポンスからbase64画像を抽出
        candidates = data.get('candidates', [])
        if not candidates:
            print("  [ERROR] Gemini: candidatesが空です")
            return None

        parts = candidates[0].get('content', {}).get('parts', [])
        for part in parts:
            if 'inlineData' in part:
                inline = part['inlineData']
                mime_type = inline.get('mimeType', 'image/jpeg')
                b64_data = inline.get('data', '')

                if not b64_data:
                    continue

                # 拡張子決定
                ext = 'jpg'
                if 'png' in mime_type:
                    ext = 'png'
                elif 'webp' in mime_type:
                    ext = 'webp'

                filename = f"{slug}.{ext}"
                filepath = os.path.join(IMAGES_DIR, filename)

                os.makedirs(IMAGES_DIR, exist_ok=True)
                with open(filepath, 'wb') as f:
                    f.write(base64.b64decode(b64_data))

                print(f"  画像保存: {filepath}")
                return f"assets/images/journal/{filename}"

        print("  [ERROR] Gemini: 画像データが見つかりません")
        return None

    except Exception as e:
        print(f"  [ERROR] Gemini API呼び出し失敗: {e}")
        traceback.print_exc()
        return None


# ── HTMLテンプレート生成 ───────────────────────────────────

def build_article_html(article: Dict[str, Any], image_path: str, category: str) -> str:
    """記事データからHTMLを生成する"""

    now = datetime.now(JST)
    date_str = now.strftime('%Y-%m-%d')
    date_iso = now.strftime('%Y-%m-%dT%H:%M:%S+09:00')

    title = article['title']
    slug = article['slug']
    description = article['description']
    keywords = article['keywords']
    body_html = article['body_html']

    og_image_url = f"https://collegrance.com/{image_path}" if image_path else "https://collegrance.com/assets/images/logo.png"
    canonical_url = f"https://collegrance.com/article-{slug}.html"

    html = f'''<!DOCTYPE html>
<html lang="ja">
<head>
    <!-- Google Analytics (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-6DM95225F6"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){{dataLayer.push(arguments);}}
      gtag('js', new Date());
      gtag('config', 'G-6DM95225F6');
    </script>
    <script src="/assets/js/tracking.js" defer></script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - COLLEGRANCE</title>
    <meta name="description" content="{description}">
    <meta name="keywords" content="{keywords}">

    <!-- Canonical -->
    <link rel="canonical" href="{canonical_url}">

    <!-- Performance: Resource Hints -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://www.googletagmanager.com">

    <!-- Web App Manifest -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#ffffff">

    <!-- OGP -->
    <meta property="og:title" content="{title} - COLLEGRANCE">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:image" content="{og_image_url}">
    <meta property="og:description" content="{description}">
    <meta property="og:site_name" content="COLLEGRANCE">
    <meta name="twitter:card" content="summary_large_image">

    <!-- Structured Data: BlogPosting -->
    <script type="application/ld+json">
    {{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "{canonical_url}"
    }},
    "headline": "{title}",
    "image": [
        "{og_image_url}"
    ],
    "datePublished": "{date_iso}",
    "dateModified": "{date_iso}",
    "author": {{
        "@type": "Organization",
        "name": "COLLEGRANCE 編集部",
        "url": "https://collegrance.com/"
    }},
    "publisher": {{
        "@type": "Organization",
        "name": "COLLEGRANCE",
        "logo": {{
            "@type": "ImageObject",
            "url": "https://collegrance.com/assets/images/logo.png"
        }}
    }},
    "description": "{description}"
}}
    </script>

    <!-- Fonts & CSS -->
    <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+Antique:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css">
    <link rel="icon" href="assets/images/logo.png" type="image/png">
      <link rel="stylesheet" href="assets/css/header.css">
  <style>
    :root{{--text:#1a1a1a;--sub:#666;--light:#999;--bg:#fff;--border:#e8e8e8;--header-h:64px}}
  </style>
    <link rel="stylesheet" href="assets/css/footer.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a href="index.html" class="header-logo"><img src="assets/images/logo.png" alt="COLLEGRANCE"></a>
      <ul class="header-nav">
        <li>
          <a href="shop.html">Shop</a>
          <div class="mega-drop">
            <div class="mega-drop-grid cols-2">
              <div class="mega-drop-col">
                <h4>カテゴリ</h4>
                <a href="shop.html">すべての商品<span class="mega-sub">130種類以上のブランド香水</span></a>
                <a href="shop.html#popular">人気ランキング<span class="mega-sub">売れ筋TOP商品</span></a>
                <a href="shop.html#sample">小分けで試す<span class="mega-sub">1.5ml お試しサイズ</span></a>
                <a href="shop.html#fullbottle">フルボトル<span class="mega-sub">正規フルサイズ</span></a>
              </div>
              <div class="mega-drop-col">
                <h4>香り系統から探す</h4>
                <a href="shop.html">フローラル</a>
                <a href="shop.html">シトラス・フレッシュ</a>
                <a href="shop.html">ウッディ・スパイシー</a>
                <a href="shop.html">スイート・グルマン</a>
                <a href="shop.html">オリエンタル</a>
              </div>
            </div>
            <div class="mega-feat">
              <a href="shop.html" class="mega-feat-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.09 6.26L20 10.27l-4.91 3.82L16.18 21 12 17.27 7.82 21l1.09-6.91L4 10.27l5.91-2.01L12 2z"/></svg>
                AIコンシェルジュに相談する
              </a>
            </div>
          </div>
        </li>
        <li>
          <a href="brand-story.html">About</a>
          <div class="mega-drop">
            <div class="mega-drop-grid">
              <a href="brand-story.html">ブランドストーリー<span class="mega-sub">COLLEGRANCEの想い</span></a>
              <a href="shop.html">AI香り診断<span class="mega-sub">あなたにぴったりの一本を</span></a>
              <a href="index.html#quality">品質へのこだわり<span class="mega-sub">化粧品製造販売業許可取得済み</span></a>
              <a href="https://line.me/R/ti/p/@711rocrx" target="_blank" rel="noopener">LINEコンシェルジュ<span class="mega-sub">個別のご相談はこちら</span></a>
            </div>
          </div>
        </li>
        <li>
          <a href="journal.html" class="active">Journal</a>
          <div class="mega-drop">
            <div class="mega-drop-grid">
              <a href="journal.html">新着記事<span class="mega-sub">最新の香り情報</span></a>
              <a href="journal.html#review">レビュー<span class="mega-sub">スタッフの本音レビュー</span></a>
              <a href="journal.html#basics">香水の基礎知識<span class="mega-sub">EDT・EDPの違いなど</span></a>
              <a href="journal.html#trend">トレンド<span class="mega-sub">今注目の香り</span></a>
            </div>
          </div>
        </li>
        <li>
          <a href="contact.html">Support</a>
          <div class="mega-drop">
            <div class="mega-drop-grid">
              <a href="contact.html">お問い合わせ<span class="mega-sub">メールフォーム</span></a>
              <a href="tokushoho.html#shipping">配送・返品<span class="mega-sub">送料・返品ポリシー</span></a>
              <a href="contact.html#faq">FAQ<span class="mega-sub">よくあるご質問</span></a>
              <a href="tokushoho.html">特定商取引法に基づく表記</a>
            </div>
          </div>
        </li>
      </ul>
      <div class="header-right">
        <button class="hamburger" id="hamburger" onclick="toggleMobileNav()">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav" id="mobile-nav">
    <div class="mobile-nav-section">
      <div class="mobile-nav-title">Shop</div>
      <ul class="mobile-nav-links">
        <li><a href="shop.html">すべての商品</a></li>
        <li><a href="shop.html#brand">ブランド別</a></li>
        <li><a href="shop.html#scent">香り系統別</a></li>
        <li><a href="shop.html#price">価格帯別</a></li>
      </ul>
    </div>
    <div class="mobile-nav-section">
      <div class="mobile-nav-title">About</div>
      <ul class="mobile-nav-links">
        <li><a href="brand-story.html">ブランドストーリー</a></li>
        <li><a href="shop.html">香り診断</a></li>
        <li><a href="https://line.me/R/ti/p/@711rocrx" target="_blank" rel="noopener">LINEコンシェルジュ</a></li>
      </ul>
    </div>
    <div class="mobile-nav-section">
      <div class="mobile-nav-title">Journal</div>
      <ul class="mobile-nav-links">
        <li><a href="journal.html">新着記事</a></li>
        <li><a href="journal.html#review">レビュー</a></li>
        <li><a href="journal.html#basics">香水の基礎知識</a></li>
      </ul>
    </div>
    <div class="mobile-nav-section">
      <div class="mobile-nav-title">Support</div>
      <ul class="mobile-nav-links">
        <li><a href="contact.html">お問い合わせ</a></li>
        <li><a href="tokushoho.html#shipping">配送・返品</a></li>
        <li><a href="tokushoho.html">特商法</a></li>
      </ul>
    </div>
  </nav>

    <article class="article-container">
    <header class="article-header">
        <span class="article-category">{category}</span>
        <h1 class="article-title">{title}</h1>
        <div class="article-meta"><time>{date_str}</time></div>
    </header>

    <div class="article-body">
        <img src="{image_path}" alt="{title}" class="article-image">

        {body_html}
    </div>
</article>

  <footer class="catalog-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand-col">
          <h3>COLLEGRANCE</h3>
          <p>香りはえらべる。もっと自由に。</p>
        </div>
        <div class="footer-info-col">
          <h4>運営会社</h4>
          <p>合同会社ヤシノミ<br>化粧品製造販売業許可取得済み</p>
        </div>
      </div>
      <nav class="footer-links">
        <a href="/tokushoho.html">特定商取引法に基づく表記</a>
        <a href="/privacy.html">プライバシーポリシー</a>
        <a href="mailto:info@collegrance.com">お問い合わせ</a>
        <a href="http://www.amazon.co.jp/collegrance" target="_blank" rel="noopener">Amazonストア</a>
        <a href="/index.html">トップページ</a>
      </nav>
      <div class="footer-copy">&copy; 2024 COLLEGRANCE. All rights reserved.</div>
    </div>
  </footer>
    <script src="assets/js/articles.js"></script>
        <!-- Floating Action Buttons Container -->
    <div class="fab-container">
        <!-- Amazon FAB -->
        <a href="http://www.amazon.co.jp/collegrance" target="_blank" rel="noopener" class="fab-item amazon-fab" onclick="gtag('event', 'click_amazon', {{'event_category': 'conversion', 'event_label': 'floating_fab'}});">
            <div class="fab-icon">A</div>
            <span class="fab-text">Amazonストア</span>
        </a>

        <!-- LINE FAB -->
        <a href="https://lin.ee/BTytLdX" target="_blank" rel="noopener" class="fab-item line-fab" onclick="gtag('event', 'click_line', {{'event_category': 'conversion', 'event_label': 'floating_fab'}});">
            <div class="fab-icon" style="font-size: 10px; font-weight:bold; display:flex; align-items:center; justify-content:center;">LINE</div>
            <span class="fab-text">LINEで相談する</span>
        </a>
    </div>
    <script src="assets/js/script.js"></script>
<script>
function toggleMobileNav(){{
  var nav = document.getElementById('mobile-nav');
  var btn = document.getElementById('hamburger');
  var isOpen = nav.classList.contains('open');
  if(isOpen){{
    nav.classList.remove('open');
    btn.classList.remove('open');
    document.body.style.overflow = '';
  }} else {{
    nav.classList.add('open');
    btn.classList.add('open');
    document.body.style.overflow = 'hidden';
  }}
}}
</script>
</body>
</html>'''

    return html


# ── articles.js への追記 ──────────────────────────────────

def add_to_articles_js(article: Dict[str, Any], image_path: str, category: str) -> None:
    """articles.js の journalArticles 配列先頭に記事エントリを追加"""

    now = datetime.now(JST)
    date_str = now.strftime('%Y-%m-%d')
    slug = article['slug']

    # ID生成: slugのハイフンをアンダースコアに変換
    article_id = slug.replace('-', '_')

    new_entry = f'''    {{
        id: '{article_id}',
        date: '{date_str}',
        category: '{category}',
        title: '{article["title"].replace("'", "\\'")}',
        excerpt: '{article["excerpt"].replace("'", "\\'")}',
        image: '{image_path}',
        link: 'article-{slug}.html'
    }}'''

    with open(ARTICLES_JS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # journalArticles = [ の直後に挿入
    insert_marker = 'const journalArticles = ['
    if insert_marker not in content:
        print("  [WARN] articles.js に journalArticles 配列が見つかりません")
        return

    # 配列の開始括弧の直後に改行+新エントリ+カンマを挿入
    content = content.replace(
        insert_marker,
        insert_marker + '\n' + new_entry + ',',
        1
    )

    with open(ARTICLES_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  articles.js に追記完了: {article_id}")


# ── Slack通知 ─────────────────────────────────────────────

def send_slack_notification(results: List[Dict[str, Any]]) -> None:
    """生成結果をSlackに通知"""
    if not SLACK_BOT_TOKEN:
        print("[WARN] SLACK_BOT_TOKEN が未設定のため、Slack通知をスキップ")
        return

    success = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]

    lines = [
        f":newspaper: *COLLEGRANCE ブログ記事生成完了*",
        f"成功: {len(success)}本 / 失敗: {len(failed)}本",
        "",
    ]

    if success:
        lines.append("*生成された記事:*")
        for r in success:
            lines.append(f"  - <https://collegrance.com/article-{r['slug']}.html|{r['title']}>")
        lines.append("")

    if failed:
        lines.append("*失敗:*")
        for r in failed:
            lines.append(f"  - {r['keyword']}: {r.get('error', '不明なエラー')}")
        lines.append("")

    lines.append(":eyes: 確認お願いします")

    text = '\n'.join(lines)

    try:
        resp = requests.post(
            'https://slack.com/api/chat.postMessage',
            headers={
                'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
                'Content-Type': 'application/json',
            },
            json={
                'channel': SLACK_CHANNEL,
                'text': text,
                'mrkdwn': True,
            },
            timeout=10,
        )
        data = resp.json()
        if data.get('ok'):
            print("Slack通知送信完了")
        else:
            print(f"[WARN] Slack通知失敗: {data.get('error', 'unknown')}")
    except Exception as e:
        print(f"[WARN] Slack通知例外: {e}")


# ── メイン処理 ────────────────────────────────────────────

def process_one_draft(draft: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
    """1記事を処理する（drafts.jsonの1エントリ）。成功/失敗の結果dictを返す"""

    slug = draft['slug']
    title = draft['title']
    category = draft.get('category', 'KNOWLEDGE')

    print(f"\n{'='*60}")
    print(f"記事: {title} [{category}]")
    print(f"{'='*60}")

    result = {
        'keyword': draft.get('keyword', ''),
        'category': category,
        'success': False,
        'slug': slug,
        'title': title,
    }  # type: Dict[str, Any]

    if dry_run:
        print(f"  [DRY-RUN] スキップ: {title}")
        result['success'] = True
        return result

    # 必須フィールドの検証
    required = ['title', 'slug', 'excerpt', 'description', 'keywords', 'body_html', 'image_prompt']
    for field in required:
        if field not in draft:
            print(f"  [ERROR] drafts.json に {field} がありません")
            result['error'] = f'{field} が未設定'
            return result

    print(f"  スラグ: {slug}")

    # 1. Gemini APIで画像生成
    print("  Gemini で画像生成中...")
    image_path = generate_image_with_gemini(draft.get('image_prompt', ''), slug)
    if image_path is None:
        print("  [WARN] 画像生成失敗 — デフォルト画像を使用")
        image_path = 'assets/images/logo.png'

    # 2. HTML生成 → ファイル保存
    print("  HTML生成中...")
    html = build_article_html(draft, image_path, category)
    output_path = os.path.join(SCRIPT_DIR, f'article-{slug}.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  HTML保存: {output_path}")

    # 3. articles.js に追記
    add_to_articles_js(draft, image_path, category)

    # 4. drafts.json で processed マーク
    mark_draft_processed(slug)

    result['success'] = True
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description='COLLEGRANCE ブログ記事量産スクリプト')
    parser.add_argument('--count', type=int, default=0, help='処理する記事数（0=全件）')
    parser.add_argument('--dry-run', action='store_true', help='画像生成・ファイル作成をスキップ')
    args = parser.parse_args()

    dry_run = args.dry_run

    print(f"COLLEGRANCE ブログ記事生成")
    print(f"  ドライラン: {dry_run}")
    print(f"  日時: {datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S JST')}")

    # API キー確認
    if not dry_run:
        if not GEMINI_API_KEY:
            print("[ERROR] GEMINI_API_KEY が未設定です")
            sys.exit(1)

    # drafts.json 読み込み
    drafts = load_drafts()
    if args.count > 0:
        drafts = drafts[:args.count]

    if not drafts:
        print("[INFO] 未処理の記事がありません。")
        print("  Claude Code で記事を生成して drafts.json に保存してください。")
        sys.exit(0)

    print(f"  対象記事: {len(drafts)}本")
    for d in drafts:
        print(f"    - {d['title']} [{d.get('category', '?')}]")

    # 記事処理ループ
    results = []  # type: List[Dict[str, Any]]
    for i, draft in enumerate(drafts):
        print(f"\n--- [{i+1}/{len(drafts)}] ---")
        result = process_one_draft(draft, dry_run=dry_run)
        results.append(result)

        # keywords.json の該当KWを used: true に
        if result['success'] and not dry_run and draft.get('keyword'):
            try:
                keywords = load_keywords()
                for kw in keywords:
                    if kw['keyword'] == draft['keyword']:
                        kw['used'] = True
                        break
                save_keywords(keywords)
            except Exception:
                pass

    # 最終レポート
    success_count = sum(1 for r in results if r['success'])
    fail_count = sum(1 for r in results if not r['success'])

    print(f"\n{'='*60}")
    print(f"完了レポート")
    print(f"{'='*60}")
    print(f"  成功: {success_count} / {len(drafts)}")
    print(f"  失敗: {fail_count} / {len(drafts)}")

    if success_count > 0:
        print(f"\n  生成記事一覧:")
        for r in results:
            if r['success']:
                status = "[DRY-RUN]" if dry_run else "[OK]"
                print(f"    {status} {r['title']} (article-{r['slug']}.html)")

    if fail_count > 0:
        print(f"\n  失敗一覧:")
        for r in results:
            if not r['success']:
                print(f"    [NG] {r.get('keyword', r['slug'])}: {r.get('error', '不明')}")

    # Slack通知（dry-run以外）
    if not dry_run and results:
        print("\nSlack通知送信中...")
        send_slack_notification(results)

    print("\n完了!")


if __name__ == '__main__':
    main()
