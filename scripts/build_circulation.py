#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COLLEGRANCE 内部回遊ビルドスクリプト
====================================
articles.js のメタデータとタグ分類 (assets/data/article_tags.json) をもとに、
以下を静的HTMLとして生成・注入する（何度実行しても安全なマーカー方式）。

  ① 全記事に「あわせて読みたい」関連記事4本 + ハブページチップ
  ② 全記事に統一CTAブロック（お試し/AI診断/LINE）
  ③ ハブページ guide-*.html（ブランド別・香調別・シーン別の記事一覧）
  ④ 記事にパンくず（表示 + BreadcrumbList/Article JSON-LD）
  ⑤ journal.html / index.html の記事グリッドを静的HTML化（SEO用。JSが同内容で上書き）
  ⑥ sitemap.xml にハブページを追加

使い方:  python3 scripts/build_circulation.py
"""
from __future__ import annotations
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "https://collegrance.com"
TODAY = date.today().isoformat()

# ============================================================
# 1. articles.js のパース
# ============================================================

def parse_articles():
    src = open(os.path.join(ROOT, "assets/js/articles.js"), encoding="utf-8").read()
    entries = []
    # 各エントリの { ... } ブロックを抽出
    for block in re.finditer(r"\{\s*id:\s*'([^']*)'.*?\}", src, re.S):
        text = block.group(0)
        def field(name):
            m = re.search(name + r":\s*'((?:[^'\\]|\\.)*)'", text)
            return m.group(1).replace("\\'", "'") if m else ""
        e = {
            "id": field("id"),
            "date": field("date"),
            "category": field("category"),
            "title": field("title"),
            "excerpt": field("excerpt"),
            "image": field("image"),
            "link": field("link"),
        }
        if e["link"]:
            entries.append(e)
    return entries

# ============================================================
# 2. タグ分類（ファイル名・タイトルのキーワードルール + 個別上書き）
# ============================================================

BRAND_RULES = {
    "byredo": "byredo",
    "margiela": "margiela", "replica": "margiela",
    "lazy-sunday-morning": "margiela", "bubble-bath": "margiela",
    "diptyque": "diptyque", "tam-dao": "diptyque", "orpheon": "diptyque",
    "fleur-de-peau": "diptyque",
    "jo-malone": "jo-malone",
    "le-labo": "le-labo",
    "dior": "dior", "sauvage": "dior", "hypnotic-poison": "dior",
    "hermes": "hermes", "un-jardin": "hermes",
    "ysl": "ysl", "libre": "ysl",
    "tom-ford": "tom-ford", "neroli-portofino": "tom-ford",
    "chloe": "chloe",
    "prada": "prada", "paradoxe": "prada",
    "loewe": "loewe",
    "jimmy-choo": "jimmy-choo",
    "dolce-gabbana": "dolce-gabbana", "light-blue": "dolce-gabbana",
    "ck-one": "calvin-klein",
    "tiffany": "tiffany",
    "nonfiction": "nonfiction", "gentle-night": "nonfiction",
    "house-of-oud": "the-house-of-oud",
    "clean-perfume-all-types": "clean",
}

NOTE_RULES = {
    "woody": "woody", "tam-dao": "woody", "sandalwood": "woody",
    "orpheon": "woody", "gypsy-water": "woody", "loewe-001": "woody",
    "gentle-night": "woody",
    "citrus": "citrus", "light-blue": "citrus", "neroli-portofino": "citrus",
    "un-jardin": "citrus", "blackberry-bay": "citrus",
    "floral": "floral", "peony": "floral", "chloe-edp": "floral",
    "paradoxe": "floral", "libre": "floral", "rosegold": "floral",
    "english-pear": "floral",
    "sweet": "sweet", "gourmand": "sweet", "hypnotic-poison": "sweet",
    "musk": "musk", "blanche": "musk", "another-13": "musk",
    "clean-perfume": "clean-soap", "bubble-bath": "clean-soap",
    "lazy-sunday-morning": "clean-soap", "blanche2": "clean-soap",
    "oriental": "oriental", "oud": "oriental", "spice": "oriental",
}

SCENE_RULES = {
    "mens": "mens", "sauvage": "mens",
    "womens": "womens", "women": "womens", "feminine": "womens",
    "attractive-womens": "womens", "chloe-edp": "womens", "libre": "womens",
    "paradoxe": "womens", "hypnotic-poison": "womens",
    "gift": "gift", "boyfriend": "gift", "girlfriend": "gift",
    "date": "date", "couple": "date", "pair": "date", "wedding": "date",
    "office": "office", "etiquette": "office",
    "summer": "season", "spring": "season", "autumn": "season",
    "rainy-season": "season", "seasonal": "season", "winter": "season",
    "20s": "age", "30s": "age", "40s": "age", "50s": "age",
    "beginner": "howto", "basics": "howto", "guide": "howto",
    "how-to": "howto", "notes-top-middle-base": "howto",
    "long-lasting": "howto", "storage": "howto", "expiry": "howto",
    "too-much": "howto", "layering": "howto", "atomizer": "howto",
    "eau-de-toilette-vs": "howto", "full-vs-trial": "howto",
    "subscription": "howto", "olfactory": "howto", "history": "howto",
    "signature-scent": "howto", "wardrobe": "howto",
    "body-temperature": "howto", "memory-proust": "howto",
    "skin-diagnosis": "howto", "bedtime": "howto",
    "ranking": "ranking", "popular": "ranking",
}

# タイトル（日本語）由来の補完ルール
TITLE_RULES = [
    ("メンズ", "scenes", "mens"), ("男性", "scenes", "mens"),
    ("レディース", "scenes", "womens"), ("女性", "scenes", "womens"),
    ("ギフト", "scenes", "gift"), ("プレゼント", "scenes", "gift"),
    ("デート", "scenes", "date"),
    ("オフィス", "scenes", "office"), ("ビジネス", "scenes", "office"),
    ("ウッディ", "notes", "woody"), ("ムスク", "notes", "musk"),
    ("シトラス", "notes", "citrus"), ("柑橘", "notes", "citrus"),
    ("フローラル", "notes", "floral"), ("せっけん", "notes", "clean-soap"),
    ("石鹸", "notes", "clean-soap"), ("甘い", "notes", "sweet"),
    ("ランキング", "scenes", "ranking"),
]


def build_tags(articles):
    """タグJSONを生成。既存ファイルがあれば手動編集を優先してマージ。"""
    tag_path = os.path.join(ROOT, "assets/data/article_tags.json")
    existing = {}
    if os.path.exists(tag_path):
        existing = json.load(open(tag_path, encoding="utf-8"))
    tags = {}
    for a in articles:
        fn = a["link"]
        if fn in existing and existing[fn].get("manual"):
            tags[fn] = existing[fn]
            continue
        brands, notes, scenes = set(), set(), set()
        # 単語トークンで照合（"womens" に "mens" が部分一致する事故を防ぐ）
        tokens = set(fn.replace(".html", "").split("-"))
        def hit(kw):
            return (kw in fn) if "-" in kw else (kw in tokens)
        for kw, tag in BRAND_RULES.items():
            if hit(kw):
                brands.add(tag)
        for kw, tag in NOTE_RULES.items():
            if hit(kw):
                notes.add(tag)
        for kw, tag in SCENE_RULES.items():
            if hit(kw):
                scenes.add(tag)
        for kw, kind, tag in TITLE_RULES:
            if kw in a["title"]:
                {"brands": brands, "notes": notes, "scenes": scenes}[kind].add(tag)
        # タイトル内の「女性ウケ」等でmens/womensが両方付いたら、ファイル名側を優先
        if "mens" in scenes and "womens" in scenes:
            if "mens" in tokens:
                scenes.discard("womens")
            elif "womens" in tokens or "women" in tokens:
                scenes.discard("mens")
        tags[fn] = {
            "brands": sorted(brands),
            "notes": sorted(notes),
            "scenes": sorted(scenes),
            "category": a["category"],
        }
    os.makedirs(os.path.dirname(tag_path), exist_ok=True)
    json.dump(tags, open(tag_path, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    return tags

# ============================================================
# 3. ハブページ定義
# ============================================================

HUBS = [
    # (slug, 種別, 対象タグ, H1, ページタイトル, 説明文)
    ("byredo", "brands", "byredo", "BYREDOの香水",
     "BYREDO(バイレード)の香水 記事一覧｜人気ランキング・レビュー・選び方",
     "BYREDO(バイレード)の香水に関する記事のまとめです。人気ランキング、メンズおすすめ、グプシーウォーターやブランシュのレビューなど、BYREDOの香りを1.5mlのお試しサイズで確かめる前の情報収集にどうぞ。"),
    ("margiela", "brands", "margiela", "Maison Margiela REPLICA",
     "メゾンマルジェラ レプリカの香水 記事一覧｜レイジーサンデーモーニング等",
     "Maison Margiela(メゾンマルジェラ)REPLICAシリーズの記事まとめ。レイジーサンデーモーニング、バブルバスなど人気の香りのレビューと、似ている香水の比較記事を集めました。"),
    ("diptyque", "brands", "diptyque", "DIPTYQUEの香水",
     "DIPTYQUE(ディプティック)の香水 記事一覧｜タムダオ・オルフェオン等",
     "DIPTYQUE(ディプティック)の香水に関する記事のまとめ。タムダオ、オルフェオン、フルールドーなど代表作のレビューや、ギフト向けおすすめ記事を集めました。"),
    ("jo-malone", "brands", "jo-malone", "Jo Maloneの香水",
     "Jo Malone(ジョーマローン)の香水 記事一覧｜組み合わせ・レビュー",
     "Jo Malone(ジョーマローン)の記事まとめ。イングリッシュペアー、ピオニー、ブラックベリーベイのレビューと、ジョーマローン流の重ねづけ(コンバイニング)ガイドを集めました。"),
    ("dior", "brands", "dior", "Diorの香水",
     "Dior(ディオール)の香水 記事一覧｜ソヴァージュ・ヒプノティックプワゾン",
     "Dior(ディオール)の香水に関する記事のまとめ。ソヴァージュのEDT/EDP/エリクシールの違い、ヒプノティックプワゾンのレビューなどを集めました。"),
    ("woody", "notes", "woody", "ウッディ系の香水",
     "ウッディ系香水の記事一覧｜メンズ・レディースおすすめ",
     "サンダルウッドやシダーが香るウッディ系香水の記事まとめ。落ち着いた大人の印象を作る香りを、レビューとランキングで比較できます。"),
    ("citrus", "notes", "citrus", "シトラス系の香水",
     "シトラス系香水の記事一覧｜爽やか・夏向けおすすめ",
     "レモンやベルガモットが弾けるシトラス系香水の記事まとめ。春夏の爽やかな香り選びに役立つレビューを集めました。"),
    ("floral", "notes", "floral", "フローラル系の香水",
     "フローラル系香水の記事一覧|ローズ・ピオニー等おすすめ",
     "ローズやピオニーが香るフローラル系香水の記事まとめ。女性らしい華やかな香り選びの参考にどうぞ。"),
    ("sweet", "notes", "sweet", "甘い香りの香水",
     "甘い香り・グルマン系香水の記事一覧",
     "バニラやグルマン系など、甘い香りの香水の記事まとめ。トレンドの甘さの選び方をレビューで比較できます。"),
    ("clean-soap", "notes", "clean-soap", "せっけん・クリーン系の香水",
     "せっけん系・クリーン系香水の記事一覧｜清潔感のある香り",
     "お風呂上がりのような清潔感が人気の、せっけん系・クリーン系香水の記事まとめ。レイジーサンデーモーニングをはじめ定番の比較記事を集めました。"),
    ("musk", "notes", "musk", "ムスク系の香水",
     "ムスク系香水の記事一覧｜ユニセックスで使える定番",
     "肌なじみの良さで人気のムスク系香水の記事まとめ。ユニセックスで使える定番の香りをレビューで比較できます。"),
    ("mens", "scenes", "mens", "メンズ香水",
     "メンズ香水の記事一覧｜年代別・シーン別おすすめ",
     "メンズ向け香水の記事まとめ。20代・30代・40代の年代別おすすめから、モテる香り、ブランド別ガイドまで集めました。"),
    ("womens", "scenes", "womens", "レディース香水",
     "レディース香水の記事一覧｜人気ブランド・おすすめ",
     "レディース向け香水の記事まとめ。人気ブランドのレビュー、年代別ランキング、シーン別の選び方を集めました。"),
    ("gift", "scenes", "gift", "ギフト向けの香水",
     "香水ギフトの記事一覧｜彼氏・彼女・プレゼント選び",
     "香水をプレゼントに選ぶための記事まとめ。彼氏向け・彼女向け・30代女性向けなど、相手別のギフドガイドを集めました。"),
    ("date", "scenes", "date", "デート・特別な日の香水",
     "デート・ペア香水の記事一覧｜ふたりで楽しむ香り",
     "デートや記念日、結婚式など特別な日の香水記事まとめ。カップルでシェアできるペアフレグランスの楽しみ方も紹介しています。"),
    ("age", "scenes", "age", "年代別の香水選び",
     "年代別香水の記事一覧｜20代・30代・40代おすすめ",
     "20代・30代・40代それぞれに似合う香水の記事まとめ。年齢に合った香り選びの参考にどうぞ。"),
    ("season", "scenes", "season", "季節の香水",
     "季節別香水の記事一覧｜春夏秋冬・梅雨の香り選び",
     "季節ごとの香水選びの記事まとめ。夏の爽やかな香り、梅雨時の付け方、季節のトレンドを集めました。"),
    ("howto", "scenes", "howto", "香水の基礎知識",
     "香水の基礎知識 記事一覧｜初心者向け・付け方・保管方法",
     "香水初心者のための基礎知識まとめ。ノートの読み方、付け方、長持ちさせるコツ、保管方法など、知っておくと香り選びが楽しくなる記事を集めました。"),
]


def hub_articles(hub, articles, tags):
    slug, kind, tag = hub[0], hub[1], hub[2]
    out = [a for a in articles
           if tag in tags.get(a["link"], {}).get(kind, [])
           and a["date"] <= TODAY]
    out.sort(key=lambda a: a["date"], reverse=True)
    return out

# ============================================================
# 4. HTML部品
# ============================================================

MARK_BODY_S = "<!-- CG-AUTO-CIRCULATION START -->"
MARK_BODY_E = "<!-- CG-AUTO-CIRCULATION END -->"
MARK_HEAD_S = "<!-- CG-AUTO-JSONLD START -->"
MARK_HEAD_E = "<!-- CG-AUTO-JSONLD END -->"
MARK_BC_S = "<!-- CG-AUTO-BREADCRUMB START -->"
MARK_BC_E = "<!-- CG-AUTO-BREADCRUMB END -->"
MARK_GRID_S = "<!-- CG-AUTO-STATIC-GRID START -->"
MARK_GRID_E = "<!-- CG-AUTO-STATIC-GRID END -->"
MARK_HUBNAV_S = "<!-- CG-AUTO-HUBNAV START -->"
MARK_HUBNAV_E = "<!-- CG-AUTO-HUBNAV END -->"

CIRCULATION_CSS = """<style>
.cg-circ{max-width:820px;margin:48px auto 56px;padding:0 20px;font-family:'Zen Kaku Gothic New','Noto Sans JP',sans-serif}
.cg-cta{border:1px solid #e5e0d8;background:#faf9f7;border-radius:6px;padding:28px 22px;text-align:center;margin-bottom:44px}
.cg-cta-lead{font-size:.82rem;letter-spacing:.1em;color:#1a1a1a;font-weight:600;margin-bottom:6px}
.cg-cta-sub{font-size:.68rem;color:#888;line-height:1.7;margin-bottom:18px}
.cg-cta-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.cg-cta-btns a{display:inline-block;padding:12px 20px;font-size:.7rem;letter-spacing:.08em;text-decoration:none;border-radius:3px;min-width:170px}
.cg-cta-shop{background:#1a1a1a;color:#fff}
.cg-cta-diag{background:#fff;color:#1a1a1a;border:1px solid #1a1a1a}
.cg-cta-line{background:#fff;color:#06C755;border:1px solid #06C755}
.cg-rel-h{font-size:.78rem;letter-spacing:.18em;color:#1a1a1a;font-weight:600;margin-bottom:16px;text-align:center}
.cg-rel-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:30px}
@media(max-width:767px){.cg-rel-grid{grid-template-columns:repeat(2,1fr);gap:10px}}
.cg-rel-card{display:block;text-decoration:none;color:inherit;border:1px solid #eee;border-radius:4px;overflow:hidden;background:#fff;transition:box-shadow .2s}
.cg-rel-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.08)}
.cg-rel-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.cg-rel-body{padding:10px 12px 12px}
.cg-rel-cat{font-size:.52rem;letter-spacing:.14em;color:#b09a6a;text-transform:uppercase}
.cg-rel-title{font-size:.66rem;line-height:1.55;color:#1a1a1a;margin-top:4px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cg-hub-chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.cg-hub-chips a{font-size:.64rem;letter-spacing:.06em;color:#555;text-decoration:none;border:1px solid #ddd;border-radius:99px;padding:7px 15px;background:#fff}
.cg-hub-chips a:hover{border-color:#1a1a1a;color:#1a1a1a}
.cg-bc{max-width:820px;margin:0 auto;padding:14px 20px 0;font-size:.6rem;letter-spacing:.06em;color:#999;font-family:'Zen Kaku Gothic New','Noto Sans JP',sans-serif}
.cg-bc a{color:#999;text-decoration:none}
.cg-bc a:hover{color:#1a1a1a}
.cg-bc span{margin:0 6px;color:#ccc}
</style>"""


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def cta_block(ctx=""):
    diag = "/?diagnosis=1" + ("&ctx=" + ctx if ctx else "")
    g = "typeof gtag!=='undefined'&&gtag"
    return f"""<div class="cg-cta">
  <div class="cg-cta-lead">気になった香りは、1.5mlから試せます</div>
  <div class="cg-cta-sub">フルボトルを買う前に、少量でじっくり。COLLEGRANCEは正規品を量り売りでお届けする香水のお試し専門店です。</div>
  <div class="cg-cta-btns">
    <a class="cg-cta-shop" href="/shop.html" onclick="{g}('event','click_shop_cta',{{'event_category':'circulation','event_label':location.pathname}});">お試しサイズを探す</a>
    <a class="cg-cta-diag" href="{diag}" onclick="{g}('event','click_diagnosis_cta',{{'event_category':'circulation','event_label':location.pathname}});">AI香水診断（無料・1分）</a>
    <a class="cg-cta-line" href="https://lin.ee/BTytLdX" target="_blank" rel="noopener" onclick="{g}('event','click_line',{{'event_category':'circulation','event_label':location.pathname}});">LINEで相談する</a>
  </div>
</div>"""


def related_cards(items):
    cards = ""
    for a in items:
        cards += f"""
    <a class="cg-rel-card" href="/{a['link']}" onclick="typeof gtag!=='undefined'&&gtag('event','click_related_article',{{'event_category':'circulation','event_label':'{a['link']}'}});">
      <img src="/{a['image']}" alt="{esc(a['title'])}" loading="lazy">
      <div class="cg-rel-body">
        <div class="cg-rel-cat">{a['category']}</div>
        <div class="cg-rel-title">{esc(a['title'])}</div>
      </div>
    </a>"""
    return cards


def hub_chips(hubs_for_article):
    chips = "".join(
        f'<a href="/guide-{h[0]}.html">{h[3]}の記事</a>'
        for h in hubs_for_article)
    chips += '<a href="/journal.html">記事一覧を見る</a>'
    return f'<div class="cg-hub-chips">{chips}</div>'


def circulation_block(article, related, hubs_for_article, ctx=""):
    return f"""{MARK_BODY_S}
{CIRCULATION_CSS}
<section class="cg-circ">
{cta_block(ctx)}
  <h2 class="cg-rel-h">あわせて読みたい</h2>
  <div class="cg-rel-grid">{related_cards(related)}
  </div>
{hub_chips(hubs_for_article)}
</section>
{MARK_BODY_E}"""


def jsonld_block(article):
    bc = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム",
             "item": BASE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": "Journal",
             "item": BASE_URL + "/journal.html"},
            {"@type": "ListItem", "position": 3, "name": article["title"],
             "item": BASE_URL + "/" + article["link"]},
        ],
    }
    art = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": article["title"],
        "description": article["excerpt"],
        "image": BASE_URL + "/" + article["image"],
        "datePublished": article["date"],
        "author": {"@type": "Organization", "name": "COLLEGRANCE"},
        "publisher": {"@type": "Organization", "name": "COLLEGRANCE",
                      "url": BASE_URL},
        "mainEntityOfPage": BASE_URL + "/" + article["link"],
    }
    return (MARK_HEAD_S
            + '<script type="application/ld+json">'
            + json.dumps(bc, ensure_ascii=False) + "</script>"
            + '<script type="application/ld+json">'
            + json.dumps(art, ensure_ascii=False) + "</script>"
            + MARK_HEAD_E)


def breadcrumb_visible(title):
    short = title.split("｜")[0].split("|")[0]
    if len(short) > 28:
        short = short[:28] + "…"
    return (f"{MARK_BC_S}<nav class=\"cg-bc\"><a href=\"/\">ホーム</a><span>›</span>"
            f"<a href=\"/journal.html\">Journal</a><span>›</span>{esc(short)}</nav>{MARK_BC_E}")

# ============================================================
# 5. マーカー注入ユーティリティ
# ============================================================

def replace_between(text, start, end, new_block):
    """マーカー間を置換。無ければ None を返す。"""
    i = text.find(start)
    if i < 0:
        return None
    j = text.find(end, i)
    if j < 0:
        return None
    return text[:i] + new_block + text[j + len(end):]


def inject(text, marker_s, marker_e, block, anchor, before=True):
    replaced = replace_between(text, marker_s, marker_e, block)
    if replaced is not None:
        return replaced
    idx = text.find(anchor)
    if idx < 0:
        return None
    if before:
        return text[:idx] + block + "\n" + text[idx:]
    idx += len(anchor)
    return text[:idx] + "\n" + block + text[idx:]

# ============================================================
# 6. 関連記事スコアリング
# ============================================================

def pick_related(article, articles, tags, n=4):
    me = tags.get(article["link"], {})
    scored = []
    for a in articles:
        if a["link"] == article["link"] or a["date"] > TODAY:
            continue
        t = tags.get(a["link"], {})
        s = 0
        s += 30 * len(set(me.get("brands", [])) & set(t.get("brands", [])))
        s += 8 * len(set(me.get("notes", [])) & set(t.get("notes", [])))
        s += 6 * len(set(me.get("scenes", [])) & set(t.get("scenes", [])))
        if me.get("category") == t.get("category"):
            s += 2
        # メンズ記事⇔レディース記事のミスマッチは大きく減点
        me_sc, t_sc = set(me.get("scenes", [])), set(t.get("scenes", []))
        if ("mens" in me_sc and "womens" in t_sc and "mens" not in t_sc) or \
           ("womens" in me_sc and "mens" in t_sc and "womens" not in t_sc):
            s -= 20
        scored.append((s, a["date"], a))
    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return [a for _, _, a in scored[:n]]

# ============================================================
# 7. ハブページ生成
# ============================================================

def hub_page_html(hub, items, all_hubs_with_items):
    slug, kind, tag, h1, page_title, desc = hub
    url = f"{BASE_URL}/guide-{slug}.html"
    cards = ""
    for a in items:
        cards += f"""
      <a class="cg-rel-card" href="/{a['link']}">
        <img src="/{a['image']}" alt="{esc(a['title'])}" loading="lazy">
        <div class="cg-rel-body">
          <div class="cg-rel-cat">{a['category']} / {a['date'].replace('-', '.')}</div>
          <div class="cg-rel-title">{esc(a['title'])}</div>
        </div>
      </a>"""
    other_chips = "".join(
        f'<a href="/guide-{h[0]}.html">{h[3]}</a>'
        for h in all_hubs_with_items if h[0] != slug)
    bc = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": "Journal", "item": BASE_URL + "/journal.html"},
            {"@type": "ListItem", "position": 3, "name": h1, "item": url},
        ]}
    coll = {
        "@context": "https://schema.org", "@type": "CollectionPage",
        "name": page_title, "description": desc, "url": url,
        "mainEntity": {"@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1,
             "url": BASE_URL + "/" + a["link"], "name": a["title"]}
            for i, a in enumerate(items)]}}
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <script src="/assets/js/tracking.js" defer></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(page_title)} - COLLEGRANCE</title>
    <meta name="description" content="{esc(desc)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{url}">
    <meta property="og:title" content="{esc(page_title)} - COLLEGRANCE">
    <meta property="og:description" content="{esc(desc)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500;700&family=Cormorant+Garamond:wght@400;500&display=swap" rel="stylesheet">
    <script type="application/ld+json">{json.dumps(bc, ensure_ascii=False)}</script>
    <script type="application/ld+json">{json.dumps(coll, ensure_ascii=False)}</script>
    <style>
      *{{margin:0;padding:0;box-sizing:border-box}}
      body{{font-family:'Zen Kaku Gothic New','Noto Sans JP',sans-serif;color:#1a1a1a;background:#fff}}
      .gh-bar{{border-bottom:1px solid #eee;padding:18px 20px;text-align:center}}
      .gh-bar a{{font-family:'Cormorant Garamond',serif;font-size:1.15rem;letter-spacing:.35em;color:#1a1a1a;text-decoration:none}}
      .gh-wrap{{max-width:1000px;margin:0 auto;padding:0 20px 60px}}
      .gh-head{{text-align:center;padding:36px 0 8px}}
      .gh-head h1{{font-size:1.15rem;letter-spacing:.2em;font-weight:600}}
      .gh-head .gh-count{{font-size:.62rem;color:#b09a6a;letter-spacing:.14em;margin-top:8px}}
      .gh-desc{{max-width:680px;margin:14px auto 34px;font-size:.72rem;line-height:2;color:#555}}
      .gh-grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:44px}}
      @media(max-width:767px){{.gh-grid{{grid-template-columns:repeat(2,1fr);gap:10px}}}}
      .gh-others{{text-align:center;margin-bottom:10px;font-size:.7rem;letter-spacing:.14em;color:#888}}
      footer{{border-top:1px solid #eee;padding:28px 20px;text-align:center;font-size:.6rem;color:#999;letter-spacing:.08em}}
      footer a{{color:#999;text-decoration:none;margin:0 10px}}
    </style>
    {CIRCULATION_CSS}
</head>
<body>
    <div class="gh-bar"><a href="/">COLLEGRANCE</a></div>
    <div class="gh-wrap">
      <nav class="cg-bc" style="padding-left:0;padding-right:0"><a href="/">ホーム</a><span>›</span><a href="/journal.html">Journal</a><span>›</span>{esc(h1)}</nav>
      <div class="gh-head">
        <h1>{esc(h1)}の記事一覧</h1>
        <div class="gh-count">{len(items)} ARTICLES</div>
      </div>
      <p class="gh-desc">{esc(desc)}</p>
      <div class="gh-grid">{cards}
      </div>
      <div class="cg-circ" style="margin-top:0">
{cta_block('guide-' + slug)}
        <div class="gh-others">OTHER GUIDES</div>
        <div class="cg-hub-chips">{other_chips}<a href="/journal.html">記事一覧を見る</a></div>
      </div>
    </div>
    <footer>
      <div style="margin-bottom:10px;font-family:'Cormorant Garamond',serif;font-size:.9rem;letter-spacing:.3em;color:#1a1a1a">COLLEGRANCE</div>
      <a href="/index.html">トップページ</a><a href="/shop.html">ショップ</a><a href="/journal.html">Journal</a><a href="/tokushoho.html">特定商取引法に基づく表記</a><a href="/privacy.html">プライバシーポリシー</a>
      <div style="margin-top:14px">&copy; 2024 COLLEGRANCE. All rights reserved.</div>
    </footer>
</body>
</html>
"""

# ============================================================
# 8. journal.html / index.html の静的グリッド
# ============================================================

def journal_static_cards(articles):
    pub = [a for a in articles if a["date"] <= TODAY]
    pub.sort(key=lambda a: a["date"], reverse=True)
    html = ""
    for a in pub:
        html += f"""
<a href="{a['link']}" class="journal-card">
  <img class="journal-card-img" src="{a['image']}" alt="{esc(a['title'])}" loading="lazy">
  <div class="journal-card-body">
    <div class="journal-card-meta"><span class="journal-card-cat">{a['category']}</span><span class="journal-card-date">{a['date'].replace('-', '.')}</span></div>
    <div class="journal-card-title">{esc(a['title'])}</div>
    <div class="journal-card-excerpt">{esc(a['excerpt'])}</div>
  </div>
</a>"""
    return html


def index_static_cards(articles):
    pub = [a for a in articles if a["date"] <= TODAY]
    pub.sort(key=lambda a: a["date"], reverse=True)
    html = ""
    for a in pub[:4]:
        html += (f'<a href="{a["link"]}" class="jp-card">'
                 f'<img src="{a["image"]}" alt="{esc(a["title"])}" class="jp-card-img" loading="lazy">'
                 f'<div class="jp-card-body"><div class="jp-cat">{a["category"]}</div>'
                 f'<div class="jp-title">{esc(a["title"])}</div></div></a>')
    return html


def hubnav_block(hubs_with_items):
    chips = "".join(
        f'<a href="/guide-{h[0]}.html">{h[3]}</a>' for h in hubs_with_items)
    return f"""{MARK_HUBNAV_S}
<div style="max-width:1000px;margin:0 auto 26px;padding:0 20px">
  <div style="font-size:.62rem;letter-spacing:.16em;color:#b09a6a;text-align:center;margin-bottom:12px">GUIDES — テーマから探す</div>
  <div class="cg-hub-chips">{chips}</div>
</div>
{CIRCULATION_CSS}
{MARK_HUBNAV_E}"""

# ============================================================
# 9. sitemap.xml
# ============================================================

def update_sitemap(hub_slugs):
    path = os.path.join(ROOT, "sitemap.xml")
    if not os.path.exists(path):
        return 0
    xml = open(path, encoding="utf-8").read()
    added = 0
    inserts = ""
    for slug in hub_slugs:
        loc = f"{BASE_URL}/guide-{slug}.html"
        if loc in xml:
            continue
        inserts += (f"  <url>\n    <loc>{loc}</loc>\n"
                    f"    <lastmod>{TODAY}</lastmod>\n"
                    f"    <changefreq>weekly</changefreq>\n  </url>\n")
        added += 1
    if inserts:
        xml = xml.replace("</urlset>", inserts + "</urlset>")
        open(path, "w", encoding="utf-8").write(xml)
    return added

# ============================================================
# main
# ============================================================

def main():
    articles = parse_articles()
    print(f"articles.js: {len(articles)}記事を読み込み")
    tags = build_tags(articles)

    hubs_with_items = []
    hub_items_map = {}
    for hub in HUBS:
        items = hub_articles(hub, articles, tags)
        if len(items) >= 3:
            hubs_with_items.append(hub)
            hub_items_map[hub[0]] = items
    print(f"ハブページ: {len(hubs_with_items)}件生成対象 "
          f"({', '.join(h[0] + ':' + str(len(hub_items_map[h[0]])) for h in hubs_with_items)})")

    # --- 記事ごとの注入 ---
    n_circ = n_head = n_bc = 0
    skipped = []
    for a in articles:
        path = os.path.join(ROOT, a["link"])
        if not os.path.exists(path):
            skipped.append(a["link"])
            continue
        html = open(path, encoding="utf-8").read()

        related = pick_related(a, articles, tags)
        my_hubs = [h for h in hubs_with_items
                   if any(x["link"] == a["link"] for x in hub_items_map[h[0]])][:4]
        ctx = a["link"].replace("article-", "").replace(".html", "")[:40]

        block = circulation_block(a, related, my_hubs, ctx)
        out = inject(html, MARK_BODY_S, MARK_BODY_E, block, "<footer", before=True)
        if out is None:
            skipped.append(a["link"] + " (no footer)")
            continue
        html = out
        n_circ += 1

        head = jsonld_block(a)
        out = inject(html, MARK_HEAD_S, MARK_HEAD_E, head, "</head>", before=True)
        if out is not None:
            html = out
            n_head += 1

        bc = breadcrumb_visible(a["title"])
        out = inject(html, MARK_BC_S, MARK_BC_E, bc,
                     '<article class="article-container">', before=True)
        if out is not None:
            html = out
            n_bc += 1

        open(path, "w", encoding="utf-8").write(html)

    print(f"記事注入: 回遊ブロック{n_circ} / JSON-LD {n_head} / パンくず{n_bc}")
    if skipped:
        print("スキップ:", skipped)

    # --- ハブページ ---
    for hub in hubs_with_items:
        items = hub_items_map[hub[0]]
        out_path = os.path.join(ROOT, f"guide-{hub[0]}.html")
        open(out_path, "w", encoding="utf-8").write(
            hub_page_html(hub, items, hubs_with_items))
    print(f"ハブページ生成: {len(hubs_with_items)}ファイル (guide-*.html)")

    # --- journal.html: ハブナビ + 静的グリッド ---
    jpath = os.path.join(ROOT, "journal.html")
    jhtml = open(jpath, encoding="utf-8").read()
    grid_block = MARK_GRID_S + journal_static_cards(articles) + "\n" + MARK_GRID_E
    out = replace_between(jhtml, MARK_GRID_S, MARK_GRID_E, grid_block)
    if out is None:
        out = jhtml.replace('<div id="journal-grid">',
                            '<div id="journal-grid">\n' + grid_block, 1)
    jhtml = out
    nav = hubnav_block(hubs_with_items)
    out = replace_between(jhtml, MARK_HUBNAV_S, MARK_HUBNAV_E, nav)
    if out is None:
        anchor = '<div class="journal-count" id="journal-count">'
        idx = jhtml.find(anchor)
        if idx >= 0:
            jhtml = jhtml[:idx] + nav + "\n" + jhtml[idx:]
    else:
        jhtml = out
    open(jpath, "w", encoding="utf-8").write(jhtml)
    print("journal.html: 静的グリッド + ハブナビ 注入完了")

    # --- index.html: 静的Journalカード ---
    ipath = os.path.join(ROOT, "index.html")
    ihtml = open(ipath, encoding="utf-8").read()
    iblock = MARK_GRID_S + index_static_cards(articles) + MARK_GRID_E
    out = replace_between(ihtml, MARK_GRID_S, MARK_GRID_E, iblock)
    if out is None:
        out = ihtml.replace(
            '<div class="jp-grid fade-up delay-2" id="jp-grid"></div>',
            '<div class="jp-grid fade-up delay-2" id="jp-grid">' + iblock + '</div>', 1)
        if out == ihtml:
            print("⚠ index.html: jp-grid が見つからず静的カード未注入")
    ihtml = out
    open(ipath, "w", encoding="utf-8").write(ihtml)
    print("index.html: Journal静的カード注入完了")

    # --- sitemap ---
    added = update_sitemap([h[0] for h in hubs_with_items])
    print(f"sitemap.xml: ハブページ{added}件追加")

    print("\n完了。git diff で確認後、コミット・プッシュしてください。")


if __name__ == "__main__":
    main()
