#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""COLLEGRANCE 事業全体像 PowerPoint 生成スクリプト"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ── 定数 ──
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)
COLOR_BLACK = RGBColor(0x1a, 0x1a, 0x1a)
COLOR_GREEN = RGBColor(0x3a, 0x7d, 0x44)
COLOR_GRAY = RGBColor(0x66, 0x66, 0x66)
COLOR_SUB = RGBColor(0x99, 0x99, 0x99)
COLOR_BODY = RGBColor(0x33, 0x33, 0x33)
COLOR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
COLOR_LIGHT_BG = RGBColor(0xF5, 0xF5, 0xF5)
COLOR_GREEN_LIGHT = RGBColor(0xE8, 0xF5, 0xE9)
FONT_NAME = "Meiryo"

prs = Presentation()
prs.slide_width = SLIDE_WIDTH
prs.slide_height = SLIDE_HEIGHT
blank_layout = prs.slide_layouts[6]  # blank


# ── ユーティリティ ──
def add_textbox(slide, left, top, width, height, text, font_size=14,
                bold=False, color=COLOR_BODY, alignment=PP_ALIGN.LEFT,
                font_name=FONT_NAME, line_spacing=1.2):
    """テキストボックスを追加"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.alignment = alignment
    p.space_after = Pt(0)
    if line_spacing:
        p.line_spacing = Pt(font_size * line_spacing)
    return txBox


def add_multiline_textbox(slide, left, top, width, height, lines,
                          font_size=14, color=COLOR_BODY, bold=False,
                          line_spacing=1.3):
    """複数行テキストボックス。linesは(text, font_size, bold, color)のタプルリスト"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(lines):
        if isinstance(item, str):
            t, fs, b, c = item, font_size, bold, color
        else:
            t = item[0]
            fs = item[1] if len(item) > 1 else font_size
            b = item[2] if len(item) > 2 else bold
            c = item[3] if len(item) > 3 else color
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = t
        p.font.size = Pt(fs)
        p.font.bold = b
        p.font.color.rgb = c
        p.font.name = FONT_NAME
        p.space_after = Pt(2)
        p.line_spacing = Pt(fs * line_spacing)
    return txBox


def add_footer(slide):
    """フッターにCOLLEGRANCEテキストロゴ"""
    add_textbox(slide, Inches(0.5), Inches(6.9), Inches(3), Inches(0.4),
                "COLLEGRANCE", font_size=10, color=COLOR_SUB,
                bold=True)


def add_rounded_rect(slide, left, top, width, height, text,
                     fill_color=COLOR_LIGHT_BG, font_size=11,
                     font_color=COLOR_BLACK, bold=False, text_align=PP_ALIGN.CENTER):
    """角丸四角形を追加"""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
    shape.line.width = Pt(1)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = text_align
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    # テキストを改行で分割して追加
    text_lines = text.split("\n")
    for i, line in enumerate(text_lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
            p.alignment = text_align
        p.text = line
        p.font.size = Pt(font_size)
        p.font.color.rgb = font_color
        p.font.name = FONT_NAME
        p.font.bold = bold
    return shape


def add_arrow_text(slide, left, top, width, height, font_size=18):
    """矢印テキスト"""
    add_textbox(slide, left, top, width, height, ">",
                font_size=font_size, bold=True, color=COLOR_GREEN,
                alignment=PP_ALIGN.CENTER)


def add_down_arrow_text(slide, left, top, font_size=18):
    """下向き矢印"""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.DOWN_ARROW, left, top, Inches(0.3), Inches(0.3))
    shape.fill.solid()
    shape.fill.fore_color.rgb = COLOR_GREEN
    shape.line.fill.background()
    return shape


def add_section_title(slide, text, top=Inches(0.3)):
    """スライドタイトル"""
    add_textbox(slide, Inches(0.8), top, Inches(11), Inches(0.6),
                text, font_size=22, bold=True, color=COLOR_BLACK)
    # タイトル下線
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0.8), top + Inches(0.55),
        Inches(1.5), Pt(3))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_GREEN
    line.line.fill.background()


def add_table(slide, left, top, width, rows_data, col_widths=None):
    """テーブル追加"""
    rows = len(rows_data)
    cols = len(rows_data[0])
    table_shape = slide.shapes.add_table(rows, cols, left, top, width, Inches(0.4 * rows))
    table = table_shape.table

    if col_widths:
        for i, w in enumerate(col_widths):
            table.columns[i].width = w

    for r_idx, row_data in enumerate(rows_data):
        for c_idx, cell_text in enumerate(row_data):
            cell = table.cell(r_idx, c_idx)
            cell.text = cell_text
            for paragraph in cell.text_frame.paragraphs:
                paragraph.font.size = Pt(11)
                paragraph.font.name = FONT_NAME
                if r_idx == 0:
                    paragraph.font.bold = True
                    paragraph.font.color.rgb = COLOR_WHITE
                else:
                    paragraph.font.color.rgb = COLOR_BODY
                paragraph.alignment = PP_ALIGN.LEFT

            # ヘッダー行の背景色
            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BLACK
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_WHITE if r_idx % 2 == 1 else COLOR_LIGHT_BG

    return table_shape


# ════════════════════════════════════════════════════════
# スライド1: 表紙
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)

# 中央にロゴ的テキスト
add_textbox(slide, Inches(0), Inches(2.0), SLIDE_WIDTH, Inches(1),
            "COLLEGRANCE", font_size=48, bold=True, color=COLOR_BLACK,
            alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(3.0), SLIDE_WIDTH, Inches(0.5),
            "コレグランス", font_size=18, color=COLOR_GRAY,
            alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(4.0), SLIDE_WIDTH, Inches(0.5),
            "事業全体像  2026年4月", font_size=16, color=COLOR_GRAY,
            alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(5.5), SLIDE_WIDTH, Inches(0.5),
            "合同会社ヤシノミ", font_size=14, color=COLOR_SUB,
            alignment=PP_ALIGN.CENTER)

# 装飾ライン
line = slide.shapes.add_shape(
    MSO_SHAPE.RECTANGLE, Inches(5.5), Inches(3.7), Inches(2.3), Pt(2))
line.fill.solid()
line.fill.fore_color.rgb = COLOR_GREEN
line.line.fill.background()

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド2: 事業概要
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "事業概要")

# ミッション
mission_box = add_rounded_rect(
    slide, Inches(0.8), Inches(1.2), Inches(11.5), Inches(0.8),
    "ミッション:  「香りはえらべる。もっと自由に。」",
    fill_color=COLOR_GREEN_LIGHT, font_size=16, bold=True, font_color=COLOR_GREEN)

# 事業内容
lines = [
    ("事業内容", 16, True, COLOR_BLACK),
    ("", 8, False, COLOR_BODY),
    ("  高級ブランド香水の小分け（1.5ml）お試し販売", 13, False, COLOR_BODY),
    ("  フルボトル直販（自社EC / collegrance.com）", 13, False, COLOR_BODY),
    ("  化粧品製造業・化粧品製造販売業 許可取得済み", 13, False, COLOR_BODY),
]
add_multiline_textbox(slide, Inches(0.8), Inches(2.3), Inches(11), Inches(2.5), lines)

# 取扱ブランド
lines2 = [
    ("取扱:  130種類以上のブランド香水", 14, True, COLOR_BLACK),
    ("", 8, False, COLOR_BODY),
    ("Maison Margiela / BYREDO / DIPTYQUE / DIOR / HERMES", 12, False, COLOR_GRAY),
    ("LE LABO / Jo Malone / NONFICTION / LOEWE / YSL  他多数", 12, False, COLOR_GRAY),
]
add_multiline_textbox(slide, Inches(0.8), Inches(4.5), Inches(11), Inches(2), lines2)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド3: ビジネスモデル全体図
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "ビジネスモデル全体図")

# メインフロー（横並び）
steps = [
    ("認知\n(SNS/広告)", COLOR_LIGHT_BG),
    ("初回購入\n(小分け)", RGBColor(0xE3, 0xF2, 0xFD)),
    ("LINE登録\n(QRコード)", COLOR_GREEN_LIGHT),
    ("育成\n(CRM配信)", RGBColor(0xFD, 0xF0, 0xE3)),
    ("フルボトル\nクロスセル", RGBColor(0xF3, 0xE5, 0xF5)),
]

box_w = Inches(1.8)
box_h = Inches(1.0)
start_x = Inches(0.8)
y = Inches(1.8)
gap = Inches(0.5)

for i, (text, color) in enumerate(steps):
    x = start_x + i * (box_w + gap)
    add_rounded_rect(slide, x, y, box_w, box_h, text,
                     fill_color=color, font_size=12, bold=True)
    if i < len(steps) - 1:
        # 矢印
        arrow_x = x + box_w
        add_textbox(slide, arrow_x, y + Inches(0.2), gap, Inches(0.5),
                    ">>", font_size=16, bold=True, color=COLOR_GREEN,
                    alignment=PP_ALIGN.CENTER)

# 下段: サステナブルループ
loop_y = Inches(3.5)
add_down_arrow_text(slide, Inches(9.5), Inches(2.9))

loop_items = [
    ("空き瓶 → ナイトライト製作", RGBColor(0xFC, 0xE4, 0xEC)),
    ("SNSコンテンツ化 → 認知", RGBColor(0xE8, 0xF5, 0xE9)),
]

for i, (text, color) in enumerate(loop_items):
    bx = Inches(7.5)
    by = loop_y + i * (Inches(0.8) + Inches(0.3))
    add_rounded_rect(slide, bx, by, Inches(4.5), Inches(0.7), text,
                     fill_color=color, font_size=11, bold=True)
    if i == 0:
        add_down_arrow_text(slide, Inches(9.5), by + Inches(0.7))

# ループ矢印テキスト
add_textbox(slide, Inches(7.5), Inches(5.3), Inches(4.5), Inches(0.4),
            "↻ サステナブル・ループ（認知に還流）",
            font_size=11, color=COLOR_GREEN, bold=True,
            alignment=PP_ALIGN.CENTER)

# 補足テキスト
add_textbox(slide, Inches(0.8), Inches(3.5), Inches(6), Inches(2.5),
            "ポイント:\n"
            "- 小分け → LINE登録 → フルボトルのステップアップモデル\n"
            "- 広告費をAmazonに集中投下し、LINE CRMで回収\n"
            "- 空き瓶をナイトライトに再利用 → SNSコンテンツ化",
            font_size=12, color=COLOR_GRAY)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド4: 販売チャネル一覧
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "販売チャネル一覧")

table_data = [
    ["チャネル", "商品", "役割", "月間売上規模"],
    ["Amazon", "小分け + ケース", "集客 + マネタイズ", "広告費 約100万/月"],
    ["TikTok Shop", "小分け + ケース", "コンテンツ → 販売", "立ち上げ中"],
    ["メルカリShop", "小分け + ケース", "販売チャネル", "-"],
    ["自社EC (Stripe)", "フルボトル", "高利益率の本命", "成長中"],
    ["自社EC (予定)", "ナイトライト", "サステナブル商品", "準備中"],
]

col_widths = [Inches(2.5), Inches(2.5), Inches(3), Inches(3)]
add_table(slide, Inches(0.8), Inches(1.3), Inches(11.5), table_data, col_widths)

# 補足
add_textbox(slide, Inches(0.8), Inches(5.0), Inches(11), Inches(1.5),
            "戦略: Amazonで広告費を投下して集客 → LINE CRMで育成 → 自社ECで高利益率のフルボトルを販売\n"
            "TikTok Shopはコンテンツ（動画）をベースにした新しい販売チャネルとして立ち上げ中",
            font_size=12, color=COLOR_GRAY)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド5: 集客 → LINE登録の導線
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "集客 → LINE登録の導線")

flow_items = [
    ("Amazon購入\n（広告費 100万/月）", RGBColor(0xFF, 0xA7, 0x26)),
    ("パッケージ内QRコード\n「アンケート回答で\nオリジナルケースプレゼント」", COLOR_LIGHT_BG),
    ("LINE公式アカウント登録\n登録率: 約5%\n友だち: 1,300人", COLOR_GREEN_LIGHT),
    ("LINE Harness\n（自社開発CRM）で\nシナリオ配信", RGBColor(0xE3, 0xF2, 0xFD)),
]

box_w = Inches(5)
box_h = Inches(0.9)
x = Inches(4)
start_y = Inches(1.3)
gap_y = Inches(0.4)

for i, (text, color) in enumerate(flow_items):
    y = start_y + i * (box_h + gap_y)
    add_rounded_rect(slide, x, y, box_w, box_h, text,
                     fill_color=color, font_size=12, bold=True)
    if i < len(flow_items) - 1:
        add_down_arrow_text(slide, x + box_w / 2 - Inches(0.15), y + box_h)

# 左側の説明
add_textbox(slide, Inches(0.8), Inches(1.3), Inches(3), Inches(4),
            "導線設計のポイント:\n\n"
            "1. 広告費はAmazonに集中\n\n"
            "2. 物理的なQRコードで\n"
            "   LINE登録を促進\n\n"
            "3. 「ケースプレゼント」で\n"
            "   登録インセンティブ付与\n\n"
            "4. 自社開発CRMで\n"
            "   パーソナライズ配信",
            font_size=11, color=COLOR_GRAY)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド6: LINE CRM → マネタイズの導線
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "LINE CRM → マネタイズの導線")

# シナリオ配信
lines = [
    ("LINE Harness シナリオ配信", 16, True, COLOR_BLACK),
    ("", 6, False, COLOR_BODY),
    ("Day 0:   ウェルカム + 購入商品タグ付け", 12, False, COLOR_BODY),
    ("Day 3:   「香りはいかがですか?」フォローアップ", 12, False, COLOR_BODY),
    ("Day 7:   フルボトルLP配信 → 自社EC購入", 12, False, COLOR_BODY),
    ("Day 14: AI香水診断誘導 → 別の香りを提案", 12, False, COLOR_BODY),
    ("", 8, False, COLOR_BODY),
    ("アンケート: 「次に試したい香りは?」", 12, True, COLOR_GREEN),
    ("  → 小分けおすすめLP → Amazon購入（クロスセル）", 12, False, COLOR_BODY),
]
add_multiline_textbox(slide, Inches(0.8), Inches(1.2), Inches(6), Inches(4), lines)

# 右側: パーソナライズの仕組み
add_rounded_rect(
    slide, Inches(7.5), Inches(1.2), Inches(5), Inches(3.5),
    "パーソナライズ配信の仕組み\n\n"
    "商品IDに応じてURLを動的生成\n\n"
    "例: BYREDO Gypsy Water 購入者\n"
    "→ 類似の香り（ウッディ系）を提案\n"
    "→ 専用LPのURLを自動生成\n\n"
    "LINE Harness（自社開発）で\n"
    "タグ・セグメント管理",
    fill_color=RGBColor(0xF5, 0xF0, 0xFF), font_size=11,
    text_align=PP_ALIGN.LEFT)

# 下部: KPI
add_textbox(slide, Inches(0.8), Inches(5.5), Inches(11), Inches(1),
            "KPI:  LINE登録率 5% → フルボトル購入率の向上が目標  /  小分け→小分けのクロスセルも重要な収益源",
            font_size=12, color=COLOR_GRAY, bold=False)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド7: SNS戦略
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "SNS戦略（現在 + 今後）")

# 稼働中
add_rounded_rect(
    slide, Inches(0.8), Inches(1.2), Inches(3.5), Inches(2.5),
    "【稼働中】\n\n"
    "TikTok\n(@collegrance)\n\n"
    "みのべさんが毎日1本投稿\n"
    "アルゴリズム研究中\n"
    "→ TikTok Shop誘導",
    fill_color=RGBColor(0xE8, 0xF5, 0xE9), font_size=11,
    text_align=PP_ALIGN.LEFT)

# 今後
add_rounded_rect(
    slide, Inches(4.8), Inches(1.2), Inches(3.5), Inches(2.5),
    "【今後】\n\n"
    "Threads\n代表(keito)が中の人として投稿\n→ ブランド認知 + サイト流入\n\n"
    "Instagram\n世界観構築 + ストーリーズ\n→ プロフリンクからAI診断へ",
    fill_color=RGBColor(0xE3, 0xF2, 0xFD), font_size=11,
    text_align=PP_ALIGN.LEFT)

# 新施策
add_rounded_rect(
    slide, Inches(8.8), Inches(1.2), Inches(3.5), Inches(2.5),
    "【新施策】\n\n"
    "ナイトライト製作動画\n（3Dプリンタ x 空き瓶）\n\n"
    "→ サステナブル路線の\n  コンテンツ\n→ TikTok Shop + \n  自社サイトで販売",
    fill_color=RGBColor(0xFC, 0xE4, 0xEC), font_size=11,
    text_align=PP_ALIGN.LEFT)

# 下部: SNS全体戦略
add_textbox(slide, Inches(0.8), Inches(4.2), Inches(11.5), Inches(2),
            "SNS全体戦略:  各プラットフォームの特性を活かした役割分担\n"
            "  TikTok = 動画で商品認知 + 販売  /  Threads = テキストでブランド認知  /  Instagram = ビジュアルで世界観構築\n"
            "  全てのSNSから collegrance.com（AI診断・ブログ・EC）への流入を狙う",
            font_size=12, color=COLOR_GRAY)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド8: 自社サイトの機能
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "自社サイト（collegrance.com）の機能")

features = [
    ("AI香水診断", "Claude AIが130種類から\n最適な3本を提案", RGBColor(0xF3, 0xE5, 0xF5)),
    ("フルボトルEC", "Stripe決済\n130種類以上の商品", RGBColor(0xE3, 0xF2, 0xFD)),
    ("ブログ(Journal)", "SEO記事 60本公開\n（100本目標）", COLOR_GREEN_LIGHT),
    ("小分けLP", "LINE配信のリンク先\n商品ID連動", COLOR_LIGHT_BG),
    ("フルボトルLP", "小分け購入者を\nフルボトルへ誘導", RGBColor(0xFD, 0xF0, 0xE3)),
    ("GA4トラッキング", "全チャネルの\n流入→行動→購入を計測", RGBColor(0xFC, 0xE4, 0xEC)),
]

cols = 3
rows_count = 2
box_w = Inches(3.5)
box_h = Inches(1.8)
start_x = Inches(0.8)
start_y = Inches(1.3)
gap_x = Inches(0.3)
gap_y = Inches(0.3)

for i, (title, desc, color) in enumerate(features):
    col = i % cols
    row = i // cols
    x = start_x + col * (box_w + gap_x)
    y = start_y + row * (box_h + gap_y)
    shape = add_rounded_rect(slide, x, y, box_w, box_h,
                             "", fill_color=color, font_size=12)
    tf = shape.text_frame
    tf.clear()
    # タイトル
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK
    p.font.name = FONT_NAME
    p.alignment = PP_ALIGN.CENTER
    # 空行
    p2 = tf.add_paragraph()
    p2.text = ""
    p2.font.size = Pt(6)
    # 説明
    for line in desc.split("\n"):
        p3 = tf.add_paragraph()
        p3.text = line
        p3.font.size = Pt(11)
        p3.font.color.rgb = COLOR_BODY
        p3.font.name = FONT_NAME
        p3.alignment = PP_ALIGN.CENTER

# 補足
add_textbox(slide, Inches(0.8), Inches(5.8), Inches(11), Inches(0.5),
            "商品パーマリンク・llms.txt 等、AI検索エンジンに参照される構造も整備済み",
            font_size=11, color=COLOR_SUB)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド9: データ計測・レポート体制
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "データ計測・レポート体制")

# GA4統合
add_rounded_rect(
    slide, Inches(0.8), Inches(1.2), Inches(5.5), Inches(1.2),
    "GA4で全チャネル統合計測\n\n"
    "Threads / Instagram / TikTok / LINE / Google / Amazon\n"
    "→ サイト訪問 → 行動追跡",
    fill_color=RGBColor(0xE3, 0xF2, 0xFD), font_size=11,
    text_align=PP_ALIGN.LEFT)

# 自動レポート
add_rounded_rect(
    slide, Inches(6.8), Inches(1.2), Inches(5.5), Inches(1.2),
    "自動レポート（Slack配信）\n\n"
    "日次: 流入元別セッション、診断/購入数\n"
    "週次: 前週比、ファネル分析\n"
    "月次: チャネル別ROI、改善ポイント",
    fill_color=COLOR_GREEN_LIGHT, font_size=11,
    text_align=PP_ALIGN.LEFT)

# 直近30日実績
add_textbox(slide, Inches(0.8), Inches(2.8), Inches(5), Inches(0.5),
            "直近30日実績", font_size=16, bold=True, color=COLOR_BLACK)

metrics = [
    ["指標", "数値"],
    ["モバイルセッション", "585"],
    ["ユーザー", "441"],
    ["LINE流入", "70%"],
    ["Google検索", "16%"],
    ["Direct", "8%"],
]
add_table(slide, Inches(0.8), Inches(3.4), Inches(5), metrics,
          col_widths=[Inches(2.5), Inches(2.5)])

# 右側: 計測ポイント
lines = [
    ("計測で重視しているKPI", 14, True, COLOR_BLACK),
    ("", 6, False, COLOR_BODY),
    ("- LINE登録率（Amazon購入者 → LINE）", 12, False, COLOR_BODY),
    ("- フルボトル転換率（小分け → フルボトル）", 12, False, COLOR_BODY),
    ("- AI診断完了率（サイト訪問 → 診断完了）", 12, False, COLOR_BODY),
    ("- チャネル別CPA（広告費 / LINE登録数）", 12, False, COLOR_BODY),
    ("- LTV（初回購入 → 2回目以降の累計売上）", 12, False, COLOR_BODY),
]
add_multiline_textbox(slide, Inches(6.8), Inches(2.8), Inches(5.5), Inches(3.5), lines)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド10: 自動化レイヤー
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "自動化レイヤー")

auto_items = [
    ("コンテンツ", "Claude Code + Nano Banana\n→ ブログ記事自動生成", RGBColor(0xF3, 0xE5, 0xF5)),
    ("在庫管理", "weekly-update.py\n→ Gmail→価格更新→自動デプロイ", RGBColor(0xE3, 0xF2, 0xFD)),
    ("決済", "Stripe Webhook\n→ Slack注文通知", COLOR_GREEN_LIGHT),
    ("AI診断", "Claude Haiku API\n→ カタログ連動推薦", RGBColor(0xFD, 0xF0, 0xE3)),
    ("CRM", "LINE Harness\n→ シナリオ自動配信", RGBColor(0xFC, 0xE4, 0xEC)),
    ("レポート", "sns-report.py\n→ GA4→Slack 日次/週次/月次", COLOR_LIGHT_BG),
    ("AI最適化", "llms.txt\n→ AI検索エンジン参照構造", RGBColor(0xF5, 0xF0, 0xFF)),
]

cols = 4
box_w = Inches(2.7)
box_h = Inches(1.8)
start_x = Inches(0.6)
start_y = Inches(1.3)
gap_x = Inches(0.2)
gap_y = Inches(0.3)

for i, (title, desc, color) in enumerate(auto_items):
    col = i % cols
    row = i // cols
    x = start_x + col * (box_w + gap_x)
    y = start_y + row * (box_h + gap_y)
    shape = add_rounded_rect(slide, x, y, box_w, box_h,
                             "", fill_color=color, font_size=12)
    tf = shape.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK
    p.font.name = FONT_NAME
    p.alignment = PP_ALIGN.CENTER
    p2 = tf.add_paragraph()
    p2.text = ""
    p2.font.size = Pt(8)
    for line in desc.split("\n"):
        p3 = tf.add_paragraph()
        p3.text = line
        p3.font.size = Pt(11)
        p3.font.color.rgb = COLOR_BODY
        p3.font.name = FONT_NAME
        p3.alignment = PP_ALIGN.CENTER

# 補足
add_textbox(slide, Inches(0.6), Inches(5.6), Inches(12), Inches(1),
            "全ての自動化は Mac Mini（定期実行サーバー）+ Claude Code で構築。\n"
            "人手を最小限にしつつ、品質と鮮度を保つ運用体制。",
            font_size=12, color=COLOR_GRAY)

add_footer(slide)


# ════════════════════════════════════════════════════════
# スライド11: 今後のロードマップ
# ════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_section_title(slide, "今後のロードマップ")

# 3カラムのタイムライン
phases = [
    ("2026年4月（現在）", [
        "自社サイトリニューアル完了",
        "AI香水診断稼働",
        "ブログ60本公開",
        "LINE CRM シナリオ配信",
        "フルボトルEC（Stripe）",
        "GA4トラッキング+レポート",
    ], COLOR_GREEN_LIGHT, True),
    ("2026年5月", [
        "Threads / Instagram開始",
        "ブログ100本到達",
        "ナイトライト製作開始",
        "TikTok Shop ナイトライト出品",
    ], RGBColor(0xE3, 0xF2, 0xFD), False),
    ("2026年 Q3", [
        "SNS流入の本格化",
        "LINE友だち 3,000人目標",
        "フルボトル売上拡大",
        "ナイトライト量産体制",
    ], RGBColor(0xF3, 0xE5, 0xF5), False),
]

box_w = Inches(3.6)
box_h = Inches(4.5)
start_x = Inches(0.8)
gap_x = Inches(0.3)
y = Inches(1.3)

for i, (title, items, color, is_done) in enumerate(phases):
    x = start_x + i * (box_w + gap_x)
    shape = add_rounded_rect(slide, x, y, box_w, box_h,
                             "", fill_color=color, font_size=12)
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    # フェーズタイトル
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK
    p.font.name = FONT_NAME
    p.alignment = PP_ALIGN.LEFT
    p.space_after = Pt(8)
    # 空行
    p2 = tf.add_paragraph()
    p2.text = ""
    p2.font.size = Pt(6)
    # 各項目
    for item in items:
        p3 = tf.add_paragraph()
        mark = "  [Done]  " if is_done else "  [    ]  "
        p3.text = mark + item
        p3.font.size = Pt(12)
        p3.font.color.rgb = COLOR_GREEN if is_done else COLOR_BODY
        p3.font.name = FONT_NAME
        p3.alignment = PP_ALIGN.LEFT
        p3.space_after = Pt(4)
        p3.line_spacing = Pt(18)

    # 矢印
    if i < len(phases) - 1:
        arrow_x = x + box_w
        add_textbox(slide, arrow_x, y + box_h / 2 - Inches(0.2), gap_x, Inches(0.5),
                    ">>", font_size=18, bold=True, color=COLOR_GREEN,
                    alignment=PP_ALIGN.CENTER)

add_footer(slide)


# ── 保存 ──
output_path = "/Users/keito/GitHub/collegranceWEB-/COLLEGRANCE_事業全体像.pptx"
prs.save(output_path)
print(f"保存完了: {output_path}")
print(f"スライド数: {len(prs.slides)}")
