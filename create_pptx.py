#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""COLLEGRANCE 事業全体像 PowerPoint 生成スクリプト（12スライド版）"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ── 定数 ──
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)
COLOR_BLACK = RGBColor(0x1A, 0x1A, 0x1A)
COLOR_GREEN = RGBColor(0x3A, 0x7D, 0x44)
COLOR_RED = RGBColor(0xE6, 0x39, 0x46)
COLOR_GRAY = RGBColor(0x66, 0x66, 0x66)
COLOR_SUB = RGBColor(0x99, 0x99, 0x99)
COLOR_BODY = RGBColor(0x33, 0x33, 0x33)
COLOR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
COLOR_LIGHT_BG = RGBColor(0xF5, 0xF5, 0xF5)
COLOR_GREEN_LIGHT = RGBColor(0xE8, 0xF5, 0xE9)
COLOR_GREEN_DARK = RGBColor(0x2E, 0x6B, 0x38)
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


def add_multiline_textbox(slide, left, top, width, height, lines, font_size=14,
                          color=COLOR_BODY, alignment=PP_ALIGN.LEFT,
                          font_name=FONT_NAME, line_spacing=1.3):
    """複数行テキストボックス。linesは [(text, font_size, bold, color), ...] のリスト"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        if isinstance(item, str):
            p.text = item
            p.font.size = Pt(font_size)
            p.font.bold = False
            p.font.color.rgb = color
        else:
            t, fs, bld, clr = item
            p.text = t
            p.font.size = Pt(fs)
            p.font.bold = bld
            p.font.color.rgb = clr
        p.font.name = font_name
        p.alignment = alignment
        p.space_after = Pt(2)
        p.line_spacing = Pt((item[1] if not isinstance(item, str) else font_size) * line_spacing)
    return txBox


def add_rect(slide, left, top, width, height, fill_color, text="",
             font_size=11, font_color=COLOR_WHITE, bold=False, alignment=PP_ALIGN.CENTER):
    """四角形を追加"""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    # 角丸
    shape.adjustments[0] = 0.05
    tf = shape.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = alignment
    if text:
        tf.paragraphs[0].text = text
        tf.paragraphs[0].font.size = Pt(font_size)
        tf.paragraphs[0].font.color.rgb = font_color
        tf.paragraphs[0].font.bold = bold
        tf.paragraphs[0].font.name = FONT_NAME
    # 上下中央
    tf.paragraphs[0].space_before = Pt(0)
    tf.paragraphs[0].space_after = Pt(0)
    shape.text_frame.word_wrap = True
    return shape


def add_arrow(slide, left, top, width, height, color=COLOR_GREEN):
    """右向き矢印"""
    shape = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def add_down_arrow(slide, left, top, width, height, color=COLOR_GREEN):
    """下向き矢印"""
    shape = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def add_footer(slide):
    """フッター"""
    add_textbox(slide, Inches(0.5), Inches(7.0), Inches(12), Inches(0.4),
                "COLLEGRANCE  |  合同会社ヤシノミ  |  Confidential",
                font_size=9, color=COLOR_SUB, alignment=PP_ALIGN.LEFT)


def add_slide_number(slide, num, total=12):
    """スライド番号"""
    add_textbox(slide, Inches(12.0), Inches(7.0), Inches(1), Inches(0.4),
                f"{num} / {total}", font_size=9, color=COLOR_SUB, alignment=PP_ALIGN.RIGHT)


def add_section_title(slide, title, subtitle=""):
    """スライドのセクションタイトル（上部）"""
    # 緑のアクセントライン
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.4), Inches(0.15), Inches(0.5))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_GREEN
    line.line.fill.background()
    add_textbox(slide, Inches(0.8), Inches(0.3), Inches(10), Inches(0.6),
                title, font_size=26, bold=True, color=COLOR_BLACK)
    if subtitle:
        add_textbox(slide, Inches(0.8), Inches(0.85), Inches(10), Inches(0.4),
                    subtitle, font_size=13, color=COLOR_GRAY)


def add_table(slide, left, top, width, height, rows, cols, data, col_widths=None):
    """テーブルを追加。dataは[[(text, bold, color), ...], ...]"""
    table_shape = slide.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table
    if col_widths:
        for i, w in enumerate(col_widths):
            table.columns[i].width = w
    for r in range(rows):
        for c in range(cols):
            cell = table.cell(r, c)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            d = data[r][c]
            if isinstance(d, tuple):
                text, bld, clr = d
            else:
                text, bld, clr = d, False, COLOR_BODY
            p.text = text
            p.font.size = Pt(11)
            p.font.bold = bld
            p.font.color.rgb = clr
            p.font.name = FONT_NAME
            p.alignment = PP_ALIGN.LEFT
            p.space_before = Pt(4)
            p.space_after = Pt(4)
            # ヘッダ行の背景
            if r == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BLACK
                p.font.color.rgb = COLOR_WHITE
                p.font.bold = True
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_WHITE if r % 2 == 1 else COLOR_LIGHT_BG
    return table_shape


# ══════════════════════════════════════════════════════════════
# スライド1: 表紙
# ══════════════════════════════════════════════════════════════
def slide_01_cover():
    slide = prs.slides.add_slide(blank_layout)
    # 背景を白に
    bg = slide.background
    bg.fill.solid()
    bg.fill.fore_color.rgb = COLOR_WHITE

    # 緑のアクセントバー（上部）
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_WIDTH, Inches(0.08))
    bar.fill.solid()
    bar.fill.fore_color.rgb = COLOR_GREEN
    bar.line.fill.background()

    # メインタイトル
    add_textbox(slide, Inches(1), Inches(2.0), Inches(11), Inches(1.0),
                "COLLEGRANCE", font_size=56, bold=True, color=COLOR_BLACK,
                alignment=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(1), Inches(2.9), Inches(11), Inches(0.5),
                "コレグランス", font_size=20, color=COLOR_GRAY,
                alignment=PP_ALIGN.CENTER)

    # 事業全体像
    add_textbox(slide, Inches(1), Inches(3.8), Inches(11), Inches(0.6),
                "事業全体像  2026年4月", font_size=28, bold=True, color=COLOR_GREEN,
                alignment=PP_ALIGN.CENTER)

    # 区切り線
    sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                 Inches(5.5), Inches(4.6), Inches(2.3), Inches(0.02))
    sep.fill.solid()
    sep.fill.fore_color.rgb = COLOR_GREEN
    sep.line.fill.background()

    # 会社名
    add_textbox(slide, Inches(1), Inches(5.0), Inches(11), Inches(0.4),
                "合同会社ヤシノミ", font_size=16, color=COLOR_BODY,
                alignment=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(1), Inches(5.5), Inches(11), Inches(0.4),
                "化粧品製造業・化粧品製造販売業 許可取得済み", font_size=12, color=COLOR_GRAY,
                alignment=PP_ALIGN.CENTER)

    add_footer(slide)


# ══════════════════════════════════════════════════════════════
# スライド2: 事業概要
# ══════════════════════════════════════════════════════════════
def slide_02_overview():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "事業概要")

    # キャッチコピー
    add_textbox(slide, Inches(1.0), Inches(1.3), Inches(11), Inches(0.6),
                "「香りはえらべる。もっと自由に。」",
                font_size=30, bold=True, color=COLOR_GREEN, alignment=PP_ALIGN.CENTER)

    # 説明
    lines = [
        ("高級ブランド香水の小分け（1.5ml）お試し販売 + フルボトル直販", 16, True, COLOR_BLACK),
        ("", 10, False, COLOR_BODY),
        ("130種類以上のブランド香水を取り扱い", 14, False, COLOR_BODY),
        ("Maison Margiela / BYREDO / DIPTYQUE / DIOR / HERMÈS / LE LABO 他", 12, False, COLOR_GRAY),
    ]
    add_multiline_textbox(slide, Inches(1.5), Inches(2.3), Inches(10), Inches(1.8), lines,
                          alignment=PP_ALIGN.CENTER)

    # 販売チャネル4つ（カード形式）
    channels = [
        ("Amazon", "小分け+ケース\n広告で集客", COLOR_BLACK),
        ("TikTok Shop", "小分け+ケース\nコンテンツ販売", COLOR_BLACK),
        ("メルカリShop", "小分け+ケース\n販売チャネル", COLOR_BLACK),
        ("自社EC (Stripe)", "フルボトル\n高利益の本命", COLOR_GREEN),
    ]
    card_w = Inches(2.5)
    gap = Inches(0.4)
    start_x = Inches(1.2)
    for i, (name, desc, bg) in enumerate(channels):
        x = start_x + i * (card_w + gap)
        y = Inches(4.2)
        shape = add_rect(slide, x, y, card_w, Inches(1.8), bg, font_size=12)
        tf = shape.text_frame
        tf.paragraphs[0].text = name
        tf.paragraphs[0].font.size = Pt(18)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = COLOR_WHITE
        tf.paragraphs[0].font.name = FONT_NAME
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        p2 = tf.add_paragraph()
        p2.text = ""
        p2.font.size = Pt(6)
        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.size = Pt(11)
        p3.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
        p3.font.name = FONT_NAME
        p3.alignment = PP_ALIGN.CENTER
        p3.line_spacing = Pt(16)

    add_footer(slide)
    add_slide_number(slide, 2)


# ══════════════════════════════════════════════════════════════
# スライド3: ビジネスモデル全体図
# ══════════════════════════════════════════════════════════════
def slide_03_business_model():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "ビジネスモデル全体図", "SNS認知 → Amazon購入 → LINE登録 → CRM育成 → フルボトル/クロスセル")

    # ── Row 1: メインフロー ──
    row1_y = Inches(1.6)
    box_h = Inches(1.3)
    box_w = Inches(2.2)
    arrow_w = Inches(0.5)
    arrow_h = Inches(0.3)

    # Box 1: SNS認知
    b1 = add_rect(slide, Inches(0.5), row1_y, box_w, box_h, COLOR_BLACK)
    tf = b1.text_frame
    tf.paragraphs[0].text = "SNS認知"
    tf.paragraphs[0].font.size = Pt(16)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_WHITE
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    for label in ["TikTok / Threads", "Instagram / SEO(60記事)"]:
        p = tf.add_paragraph()
        p.text = label
        p.font.size = Pt(10)
        p.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
        p.font.name = FONT_NAME
        p.alignment = PP_ALIGN.CENTER

    add_arrow(slide, Inches(2.8), row1_y + Inches(0.5), arrow_w, arrow_h)

    # Box 2: Amazon小分け購入
    b2 = add_rect(slide, Inches(3.4), row1_y, Inches(2.5), box_h, COLOR_GREEN)
    tf = b2.text_frame
    tf.paragraphs[0].text = "Amazon小分け購入"
    tf.paragraphs[0].font.size = Pt(16)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_WHITE
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    for label in ["広告費 100万/月", "月間 ~3,000-5,000件"]:
        p = tf.add_paragraph()
        p.text = label
        p.font.size = Pt(10)
        p.font.color.rgb = RGBColor(0xDD, 0xFF, 0xDD)
        p.font.name = FONT_NAME
        p.alignment = PP_ALIGN.CENTER

    add_arrow(slide, Inches(6.0), row1_y + Inches(0.5), arrow_w, arrow_h)

    # Box 3: LINE登録
    b3 = add_rect(slide, Inches(6.6), row1_y, Inches(2.5), box_h, COLOR_GREEN_DARK)
    tf = b3.text_frame
    tf.paragraphs[0].text = "LINE登録"
    tf.paragraphs[0].font.size = Pt(16)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_WHITE
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    for label in ["ケースプレゼント施策", "登録率 5.3% / 1,300人"]:
        p = tf.add_paragraph()
        p.text = label
        p.font.size = Pt(10)
        p.font.color.rgb = RGBColor(0xDD, 0xFF, 0xDD)
        p.font.name = FONT_NAME
        p.alignment = PP_ALIGN.CENTER

    add_arrow(slide, Inches(9.2), row1_y + Inches(0.5), arrow_w, arrow_h)

    # Box 4: CRM育成
    b4 = add_rect(slide, Inches(9.8), row1_y, Inches(2.8), box_h, COLOR_BLACK)
    tf = b4.text_frame
    tf.paragraphs[0].text = "CRM育成"
    tf.paragraphs[0].font.size = Pt(16)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_WHITE
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    for label in ["LINE Harness（自社開発）", "シナリオ配信+AI診断"]:
        p = tf.add_paragraph()
        p.text = label
        p.font.size = Pt(10)
        p.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
        p.font.name = FONT_NAME
        p.alignment = PP_ALIGN.CENTER

    # ── Row 2: 分岐 ──
    # 下矢印（CRMの下）
    add_down_arrow(slide, Inches(10.3), Inches(3.1), Inches(0.3), Inches(0.5))
    add_down_arrow(slide, Inches(11.3), Inches(3.1), Inches(0.3), Inches(0.5))

    row2_y = Inches(3.8)
    # フルボトル購入
    b5 = add_rect(slide, Inches(9.1), row2_y, Inches(2.0), Inches(1.0), COLOR_RED)
    tf = b5.text_frame
    tf.paragraphs[0].text = "フルボトル購入"
    tf.paragraphs[0].font.size = Pt(14)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_WHITE
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.add_paragraph()
    p.text = "自社EC(Stripe) / 高利益"
    p.font.size = Pt(9)
    p.font.color.rgb = RGBColor(0xFF, 0xCC, 0xCC)
    p.font.name = FONT_NAME
    p.alignment = PP_ALIGN.CENTER

    # クロスセル
    b6 = add_rect(slide, Inches(11.3), row2_y, Inches(1.6), Inches(1.0), COLOR_BLACK)
    tf = b6.text_frame
    tf.paragraphs[0].text = "クロスセル"
    tf.paragraphs[0].font.size = Pt(14)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_WHITE
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.add_paragraph()
    p.text = "別の小分け(Amazon)"
    p.font.size = Pt(9)
    p.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
    p.font.name = FONT_NAME
    p.alignment = PP_ALIGN.CENTER

    # ── Row 3: サステナブルループ ──
    row3_y = Inches(5.0)
    add_textbox(slide, Inches(0.5), row3_y, Inches(12), Inches(0.4),
                "サステナブルループ（新規事業）", font_size=14, bold=True, color=COLOR_GREEN)

    loop_y = Inches(5.5)

    # 空き瓶の出所（2つ）
    # ①小分け製造時の空き瓶
    b_src1 = add_rect(slide, Inches(0.4), loop_y, Inches(2.2), Inches(0.7), COLOR_GREEN_LIGHT,
                 text="① 小分け製造時の空き瓶\n（自社ラボで発生）", font_size=9, font_color=COLOR_BLACK)
    # ②フルボトル購入者の空き瓶
    b_src2 = add_rect(slide, Inches(0.4), loop_y + Inches(0.85), Inches(2.2), Inches(0.7), COLOR_GREEN_LIGHT,
                 text="② お客様のフルボトル空き瓶\n（将来の回収事業）", font_size=9, font_color=COLOR_BLACK)

    # 矢印 → 3Dプリンタ
    add_arrow(slide, Inches(2.7), loop_y + Inches(0.55), Inches(0.4), Inches(0.25), COLOR_GREEN)

    # 3Dプリンタ製作
    add_rect(slide, Inches(3.2), loop_y + Inches(0.2), Inches(2.2), Inches(0.9), COLOR_GREEN,
             text="3Dプリンタ\nナイトライト製作", font_size=11, font_color=COLOR_WHITE)

    # 矢印 → 販売+動画
    add_arrow(slide, Inches(5.5), loop_y + Inches(0.45), Inches(0.4), Inches(0.25), COLOR_GREEN)

    # 販売 & TikTok動画
    add_rect(slide, Inches(6.0), loop_y, Inches(2.2), Inches(0.7), COLOR_BLACK,
             text="TikTok Shop / 自社EC\nメルカリShopで販売", font_size=9, font_color=COLOR_WHITE)
    add_rect(slide, Inches(6.0), loop_y + Inches(0.85), Inches(2.2), Inches(0.7), COLOR_BLACK,
             text="製作動画をTikTok投稿\nサステナブル×おしゃれ", font_size=9, font_color=COLOR_WHITE)

    # 矢印 → 認知拡大 → ループ
    add_arrow(slide, Inches(8.3), loop_y + Inches(0.55), Inches(0.4), Inches(0.25), COLOR_GREEN)

    add_rect(slide, Inches(8.8), loop_y + Inches(0.2), Inches(2.0), Inches(0.9), COLOR_GREEN_LIGHT,
             text="新規認知\n→ 小分け購入\n→ ループ", font_size=10, font_color=COLOR_GREEN_DARK)

    # フルボトル→空き瓶の接続矢印（Row2のフルボトルからRow3へ）
    add_down_arrow(slide, Inches(9.8), Inches(4.9), Inches(0.3), Inches(0.3))

    add_footer(slide)
    add_slide_number(slide, 3)


# ══════════════════════════════════════════════════════════════
# スライド4: Amazon販売実績
# ══════════════════════════════════════════════════════════════
def slide_04_amazon_sales():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "Amazon販売実績", "2025年10月〜2026年4月（推定値含む）")

    # 月別データ
    months = [
        ("10月", 1587, 1731301),
        ("11月", 2701, 2946791),
        ("12月", 5138, 5605558),
        ("1月", 3570, 3894870),
        ("2月", 4553, 4967323),
        ("3月", 4496, 4905136),
        ("4月*", 1719, 1875429),
    ]
    max_orders = 5138
    bar_max_h = Inches(3.2)
    bar_w = Inches(1.2)
    gap = Inches(0.35)
    start_x = Inches(0.8)
    base_y = Inches(5.8)

    for i, (month, orders, revenue) in enumerate(months):
        x = start_x + i * (bar_w + gap)
        ratio = orders / max_orders
        bar_h = bar_max_h * ratio
        bar_y = base_y - bar_h

        # 棒グラフ
        is_peak = (month == "12月")
        fill = COLOR_GREEN if not is_peak else COLOR_RED
        add_rect(slide, x, bar_y, bar_w, bar_h, fill)

        # 件数（棒の上）
        add_textbox(slide, x, bar_y - Inches(0.55), bar_w, Inches(0.3),
                    f"{orders:,}件", font_size=14, bold=True,
                    color=COLOR_RED if is_peak else COLOR_BLACK,
                    alignment=PP_ALIGN.CENTER)
        # 金額
        add_textbox(slide, x, bar_y - Inches(0.3), bar_w, Inches(0.25),
                    f"¥{revenue:,}", font_size=9, color=COLOR_GRAY,
                    alignment=PP_ALIGN.CENTER)

        # 月名（棒の下）
        add_textbox(slide, x, base_y + Inches(0.05), bar_w, Inches(0.3),
                    month, font_size=13, bold=True, color=COLOR_BLACK,
                    alignment=PP_ALIGN.CENTER)

    # サマリー（右側）
    sx = Inches(9.2)
    lines = [
        ("累計", 14, True, COLOR_GRAY),
        ("23,764 件", 36, True, COLOR_RED),
        ("", 8, False, COLOR_BODY),
        ("累計売上（推定）", 14, True, COLOR_GRAY),
        ("¥25,926,524", 30, True, COLOR_BLACK),
        ("", 8, False, COLOR_BODY),
        ("平均単価", 12, False, COLOR_GRAY),
        ("¥1,091", 22, True, COLOR_BLACK),
        ("", 8, False, COLOR_BODY),
        ("広告費", 12, False, COLOR_GRAY),
        ("月間 約100万円", 18, True, COLOR_GREEN),
    ]
    add_multiline_textbox(slide, sx, Inches(1.5), Inches(3.5), Inches(5), lines,
                          alignment=PP_ALIGN.LEFT)

    # 注釈
    add_textbox(slide, Inches(0.5), Inches(6.3), Inches(8), Inches(0.3),
                "※ 10月実測値をベースにアンケート回答率から推定。4月は4/15まで",
                font_size=9, color=COLOR_SUB)

    add_footer(slide)
    add_slide_number(slide, 4)


# ══════════════════════════════════════════════════════════════
# スライド5: アンケートファネル分析
# ══════════════════════════════════════════════════════════════
def slide_05_funnel():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "アンケートファネル分析", "Amazon購入者 → LINE登録 → クロスセル/アップセル対象")

    # ファネル（台形）を図形で描画
    funnel_data = [
        ("Amazon購入者（推定）", "23,764人", "100%", Inches(10.0), COLOR_BLACK),
        ("LINE登録（アンケート回答）", "1,258人", "登録率 5.3%", Inches(8.0), COLOR_GREEN),
        ("「他にも試したい」", "1,087人", "86.4%", Inches(6.5), COLOR_GREEN_DARK),
        ("「フルボトル検討中」", "728人", "57.9%", Inches(5.0), COLOR_RED),
    ]

    center_x = Inches(4.5)
    y_start = Inches(1.5)
    step_h = Inches(1.2)

    for i, (label, count, rate, fw, color) in enumerate(funnel_data):
        y = y_start + i * step_h
        x = center_x - fw / 2
        shape = add_rect(slide, x, y, fw, Inches(0.9), color)
        tf = shape.text_frame
        tf.paragraphs[0].text = f"{label}    {count}    ({rate})"
        tf.paragraphs[0].font.size = Pt(14)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = COLOR_WHITE
        tf.paragraphs[0].font.name = FONT_NAME
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER

        # 下矢印
        if i < len(funnel_data) - 1:
            add_down_arrow(slide, center_x - Inches(0.15), y + Inches(0.9),
                           Inches(0.3), Inches(0.25), COLOR_GRAY)

    # 右側の解説
    rx = Inches(10.0)
    # クロスセル
    add_rect(slide, rx, Inches(3.9), Inches(2.8), Inches(1.0), COLOR_GREEN_DARK,
             text="クロスセル対象\n1,087人", font_size=13, font_color=COLOR_WHITE, bold=True)
    # アップセル
    add_rect(slide, rx, Inches(5.1), Inches(2.8), Inches(1.0), COLOR_RED,
             text="アップセル対象\n728人", font_size=13, font_color=COLOR_WHITE, bold=True)

    # ハイライト
    lines = [
        ("★ 728人がフルボトル購入を検討中", 16, True, COLOR_RED),
        ("→ LINE配信で購入に誘導する仕組みを構築中", 13, False, COLOR_BODY),
    ]
    add_multiline_textbox(slide, Inches(1.0), Inches(6.2), Inches(10), Inches(0.7), lines,
                          alignment=PP_ALIGN.LEFT)

    add_footer(slide)
    add_slide_number(slide, 5)


# ══════════════════════════════════════════════════════════════
# スライド6: 顧客属性
# ══════════════════════════════════════════════════════════════
def slide_06_customer():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "顧客属性（アンケートデータ）", "回答者: 1,258人")

    # ── 左カラム: 性別・年齢 ──
    lx = Inches(0.8)

    # 性別
    add_textbox(slide, lx, Inches(1.5), Inches(3), Inches(0.3),
                "性別", font_size=14, bold=True, color=COLOR_GREEN)
    gender_data = [("男性 70%", 0.70, COLOR_BLACK), ("女性 29%", 0.29, COLOR_GREEN), ("その他 1%", 0.01, COLOR_GRAY)]
    bar_base_x = lx
    bar_y = Inches(1.9)
    total_w = Inches(5.0)
    cum_x = bar_base_x
    for label, ratio, color in gender_data:
        w = int(total_w * ratio)
        add_rect(slide, cum_x, bar_y, w, Inches(0.45), color, text=label,
                 font_size=10, font_color=COLOR_WHITE, bold=True)
        cum_x += w

    # 年齢
    add_textbox(slide, lx, Inches(2.6), Inches(3), Inches(0.3),
                "年齢分布", font_size=14, bold=True, color=COLOR_GREEN)
    ages = [("50代", 25), ("40代", 20), ("30代", 19), ("20代", 18), ("60代〜", 12), ("10代", 6)]
    age_bar_y = Inches(3.0)
    age_bar_max_w = Inches(4.0)
    for i, (age, pct) in enumerate(ages):
        y = age_bar_y + i * Inches(0.38)
        add_textbox(slide, lx, y, Inches(0.8), Inches(0.3), age,
                    font_size=10, bold=True, color=COLOR_BODY, alignment=PP_ALIGN.RIGHT)
        w = int(age_bar_max_w * pct / 25)  # 25%が最大
        add_rect(slide, lx + Inches(0.9), y + Inches(0.03), w, Inches(0.3),
                 COLOR_GREEN, text=f"{pct}%", font_size=9, font_color=COLOR_WHITE)

    # ── 中央カラム: 満足度 ──
    mx = Inches(6.5)
    add_textbox(slide, mx, Inches(1.5), Inches(3), Inches(0.3),
                "満足度", font_size=14, bold=True, color=COLOR_GREEN)

    add_textbox(slide, mx, Inches(1.9), Inches(3), Inches(0.5),
                "★4以上: 88.9%", font_size=28, bold=True, color=COLOR_RED)

    stars = [("★5", 59.4, COLOR_RED), ("★4", 29.5, COLOR_GREEN), ("★3", 9.5, COLOR_GRAY),
             ("★2", 1.1, COLOR_GRAY), ("★1", 0.5, COLOR_GRAY)]
    star_y = Inches(2.7)
    for i, (label, pct, color) in enumerate(stars):
        y = star_y + i * Inches(0.35)
        add_textbox(slide, mx, y, Inches(0.5), Inches(0.3), label,
                    font_size=10, bold=True, color=COLOR_BODY)
        w = int(Inches(3.5) * pct / 60)
        add_rect(slide, mx + Inches(0.6), y + Inches(0.03), w, Inches(0.25),
                 color, text=f"{pct}%", font_size=8, font_color=COLOR_WHITE)

    # ── 右カラム: 香水を知ったきっかけ ──
    add_textbox(slide, mx, Inches(4.8), Inches(5), Inches(0.3),
                "香水を知ったきっかけ", font_size=14, bold=True, color=COLOR_GREEN)
    sources = [("YouTube", 29), ("Amazon・楽天", 26), ("SNS(IG/TikTok)", 22),
               ("友人・知人", 12), ("雑誌", 6), ("その他", 5)]
    src_y = Inches(5.2)
    for i, (src, pct) in enumerate(sources):
        y = src_y + i * Inches(0.32)
        add_textbox(slide, mx, y, Inches(1.8), Inches(0.3), src,
                    font_size=10, color=COLOR_BODY, alignment=PP_ALIGN.RIGHT)
        w = int(Inches(3.0) * pct / 30)
        add_rect(slide, mx + Inches(2.0), y + Inches(0.03), w, Inches(0.25),
                 COLOR_BLACK, text=f"{pct}%", font_size=8, font_color=COLOR_WHITE)

    # ── 左下: 人気商品 ──
    add_textbox(slide, lx, Inches(5.3), Inches(5), Inches(0.3),
                "人気商品TOP3", font_size=14, bold=True, color=COLOR_GREEN)
    prods = [
        ("1位", "商品030", "42.1%"),
        ("2位", "商品018", "20.6%"),
        ("3位", "商品039", "7.8%"),
    ]
    for i, (rank, name, pct) in enumerate(prods):
        y = Inches(5.7) + i * Inches(0.35)
        add_textbox(slide, lx, y, Inches(0.6), Inches(0.3), rank,
                    font_size=12, bold=True, color=COLOR_RED)
        add_textbox(slide, lx + Inches(0.6), y, Inches(1.5), Inches(0.3), name,
                    font_size=12, color=COLOR_BODY)
        add_textbox(slide, lx + Inches(2.2), y, Inches(1.0), Inches(0.3), pct,
                    font_size=12, bold=True, color=COLOR_BLACK)

    add_footer(slide)
    add_slide_number(slide, 6)


# ══════════════════════════════════════════════════════════════
# スライド7: 販売チャネル一覧
# ══════════════════════════════════════════════════════════════
def slide_07_channels():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "販売チャネル一覧")

    data = [
        [("チャネル", True, COLOR_WHITE), ("商品", True, COLOR_WHITE),
         ("役割", True, COLOR_WHITE), ("状態", True, COLOR_WHITE)],
        [("Amazon", True, COLOR_BODY), ("小分け+ケース", False, COLOR_BODY),
         ("集客+販売（広告費100万/月）", False, COLOR_BODY), ("稼働中", True, COLOR_GREEN)],
        [("TikTok Shop", True, COLOR_BODY), ("小分け+ケース", False, COLOR_BODY),
         ("コンテンツ → 販売", False, COLOR_BODY), ("稼働中", True, COLOR_GREEN)],
        [("メルカリShop", True, COLOR_BODY), ("小分け+ケース", False, COLOR_BODY),
         ("販売チャネル", False, COLOR_BODY), ("稼働中", True, COLOR_GREEN)],
        [("自社EC (Stripe)", True, COLOR_RED), ("フルボトル", False, COLOR_BODY),
         ("高利益の本命", True, COLOR_RED), ("稼働中（リニューアル完了）", True, COLOR_GREEN)],
        [("自社EC (予定)", True, COLOR_BODY), ("ナイトライト", False, COLOR_BODY),
         ("サステナブル商品", False, COLOR_BODY), ("準備中", False, COLOR_GRAY)],
    ]

    add_table(slide, Inches(0.8), Inches(1.5), Inches(11.5), Inches(3.5),
              6, 4, data,
              col_widths=[Inches(2.5), Inches(2.5), Inches(4.0), Inches(2.5)])

    # チャネル別の役割図
    add_textbox(slide, Inches(0.8), Inches(5.3), Inches(11), Inches(0.3),
                "チャネル戦略の考え方", font_size=14, bold=True, color=COLOR_GREEN)

    boxes = [
        ("Amazon\n集客エンジン", COLOR_BLACK, "広告費投入\n→ 認知+購入"),
        ("TikTok / メルカリ\nサブチャネル", COLOR_GRAY, "追加の販路\nコンテンツ活用"),
        ("自社EC\nマネタイズ", COLOR_RED, "フルボトル\n高利益率"),
    ]
    for i, (title, color, desc) in enumerate(boxes):
        x = Inches(0.8) + i * Inches(4.0)
        shape = add_rect(slide, x, Inches(5.7), Inches(3.5), Inches(1.0), color)
        tf = shape.text_frame
        tf.paragraphs[0].text = title
        tf.paragraphs[0].font.size = Pt(13)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = COLOR_WHITE
        tf.paragraphs[0].font.name = FONT_NAME
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        tf.paragraphs[0].line_spacing = Pt(18)
        if i < 2:
            add_arrow(slide, Inches(0.8) + (i + 1) * Inches(4.0) - Inches(0.5),
                      Inches(5.95), Inches(0.4), Inches(0.25))

    add_footer(slide)
    add_slide_number(slide, 7)


# ══════════════════════════════════════════════════════════════
# スライド8: LINE CRM設計
# ══════════════════════════════════════════════════════════════
def slide_08_line_crm():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "LINE CRM設計", "LINE Harness（自社開発CRM/MA）")

    # シナリオフロー
    scenario = [
        ("Day 0", "ウェルカム + 購入商品タグ付け", COLOR_GREEN),
        ("Day 3", "「香りはいかがですか？」", COLOR_GREEN_DARK),
        ("Day 7", "フルボトルLP配信\ncollegrance.com/?from=sample&product={ID}", COLOR_RED),
        ("Day 14", "AI香水診断誘導\ncollegrance.com/", COLOR_BLACK),
    ]

    add_textbox(slide, Inches(0.8), Inches(1.4), Inches(5), Inches(0.3),
                "シナリオ配信", font_size=16, bold=True, color=COLOR_GREEN)

    for i, (day, desc, color) in enumerate(scenario):
        y = Inches(1.9) + i * Inches(1.1)
        # Day badge
        add_rect(slide, Inches(0.8), y, Inches(1.0), Inches(0.5), color,
                 text=day, font_size=12, font_color=COLOR_WHITE, bold=True)
        # Description
        add_textbox(slide, Inches(2.0), y, Inches(4.5), Inches(0.8),
                    desc, font_size=12, color=COLOR_BODY)
        # 接続線
        if i < len(scenario) - 1:
            add_down_arrow(slide, Inches(1.15), y + Inches(0.55),
                           Inches(0.2), Inches(0.3), COLOR_GRAY)

    # 右側: アンケート→レコメンド
    rx = Inches(7.0)
    add_textbox(slide, rx, Inches(1.4), Inches(5), Inches(0.3),
                "アンケート → レコメンド", font_size=16, bold=True, color=COLOR_GREEN)

    reco_flow = [
        ("アンケート", "「次に試したい香りは？」", COLOR_BLACK),
        ("タグ付け", "回答に基づき興味タグ付与", COLOR_GREEN_DARK),
        ("レコメンド配信", "小分けおすすめLP\n?from=recommend&product={ID}", COLOR_GREEN),
    ]
    for i, (title, desc, color) in enumerate(reco_flow):
        y = Inches(1.9) + i * Inches(1.3)
        add_rect(slide, rx, y, Inches(2.0), Inches(0.5), color,
                 text=title, font_size=11, font_color=COLOR_WHITE, bold=True)
        add_textbox(slide, rx + Inches(2.2), y, Inches(3.5), Inches(0.8),
                    desc, font_size=11, color=COLOR_BODY)
        if i < len(reco_flow) - 1:
            add_down_arrow(slide, rx + Inches(0.85), y + Inches(0.55),
                           Inches(0.2), Inches(0.3), COLOR_GRAY)

    # ポイント
    add_rect(slide, Inches(0.8), Inches(5.8), Inches(11.5), Inches(0.8), COLOR_GREEN_LIGHT,
             text="ポイント: 商品IDに応じてURLを動的生成し、パーソナライズ配信を実現",
             font_size=14, font_color=COLOR_BLACK, bold=True)

    add_footer(slide)
    add_slide_number(slide, 8)


# ══════════════════════════════════════════════════════════════
# スライド9: 自社サイト + SNS戦略
# ══════════════════════════════════════════════════════════════
def slide_09_site_sns():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "自社サイト + SNS戦略")

    # 左: 自社サイト
    add_textbox(slide, Inches(0.8), Inches(1.4), Inches(5), Inches(0.3),
                "collegrance.com（リニューアル完了）", font_size=16, bold=True, color=COLOR_GREEN)

    site_features = [
        "AI香水診断（Claude AI）",
        "フルボトルEC（130種類、Stripe決済）",
        "ブログ60本（SEO、100本目標）",
        "商品LP（LINE配信のリンク先）",
        "GA4 eコマーストラッキング",
    ]
    for i, feat in enumerate(site_features):
        y = Inches(1.9) + i * Inches(0.4)
        add_rect(slide, Inches(0.8), y, Inches(0.15), Inches(0.25), COLOR_GREEN)
        add_textbox(slide, Inches(1.1), y, Inches(5), Inches(0.3),
                    feat, font_size=13, color=COLOR_BODY)

    # 右: SNS
    add_textbox(slide, Inches(7.0), Inches(1.4), Inches(5), Inches(0.3),
                "SNS戦略", font_size=16, bold=True, color=COLOR_GREEN)

    sns_data = [
        [("チャネル", True, COLOR_WHITE), ("担当", True, COLOR_WHITE),
         ("状態", True, COLOR_WHITE)],
        [("TikTok", True, COLOR_BODY), ("みのべさん", False, COLOR_BODY),
         ("稼働中（毎日1本）", True, COLOR_GREEN)],
        [("Threads", True, COLOR_BODY), ("keito（中の人）", False, COLOR_BODY),
         ("準備中", False, COLOR_GRAY)],
        [("Instagram", True, COLOR_BODY), ("keito", False, COLOR_BODY),
         ("準備中", False, COLOR_GRAY)],
    ]
    add_table(slide, Inches(7.0), Inches(1.9), Inches(5.5), Inches(2.0),
              4, 3, sns_data,
              col_widths=[Inches(1.5), Inches(2.0), Inches(2.0)])

    # 下: ナイトライト
    add_textbox(slide, Inches(0.8), Inches(4.5), Inches(11), Inches(0.3),
                "新施策: ナイトライト事業", font_size=16, bold=True, color=COLOR_GREEN)

    nl_flow = [
        ("フルボトル\n空き瓶", COLOR_BLACK),
        ("3Dプリンタ\nで加工", COLOR_GREEN_DARK),
        ("ナイトライト\n完成", COLOR_GREEN),
        ("TikTok動画\nで拡散", COLOR_RED),
        ("販売\n(各チャネル)", COLOR_BLACK),
    ]
    for i, (text, color) in enumerate(nl_flow):
        x = Inches(0.8) + i * Inches(2.4)
        add_rect(slide, x, Inches(5.0), Inches(1.8), Inches(1.0), color,
                 text=text, font_size=11, font_color=COLOR_WHITE, bold=True)
        if i < len(nl_flow) - 1:
            add_arrow(slide, x + Inches(1.85), Inches(5.35), Inches(0.45), Inches(0.25))

    add_textbox(slide, Inches(0.8), Inches(6.2), Inches(11), Inches(0.3),
                "香水の「試す → 使う → 残る → 再生 → 広がる」全ライフサイクルをビジネス化",
                font_size=12, bold=True, color=COLOR_GREEN)

    add_footer(slide)
    add_slide_number(slide, 9)


# ══════════════════════════════════════════════════════════════
# スライド10: 現在の戦略
# ══════════════════════════════════════════════════════════════
def slide_10_strategy():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "現在の戦略（これからやること）",
                      "アンケートで判明した2つの巨大セグメント")

    # ── セグメント1: クロスセル ──
    add_rect(slide, Inches(0.5), Inches(1.5), Inches(6.0), Inches(0.6), COLOR_GREEN_DARK,
             text="① 「他にも試したい」 1,087人（86.4%）",
             font_size=18, font_color=COLOR_WHITE, bold=True)

    lines1 = [
        ("LINEシナリオで別の小分けをレコメンド（クロスセル）", 14, False, COLOR_BODY),
        ("→ 小分けおすすめLP（?from=recommend）", 13, False, COLOR_GREEN),
        ("→ Amazonで追加購入を促進", 13, False, COLOR_GREEN),
    ]
    add_multiline_textbox(slide, Inches(0.8), Inches(2.3), Inches(5.5), Inches(1.2), lines1)

    # ── セグメント2: アップセル ──
    add_rect(slide, Inches(0.5), Inches(3.6), Inches(6.0), Inches(0.6), COLOR_RED,
             text="② 「フルボトル検討中」 728人（57.9%）",
             font_size=18, font_color=COLOR_WHITE, bold=True)

    lines2 = [
        ("LINEシナリオでフルボトルLPを配信（アップセル）", 14, False, COLOR_BODY),
        ("→ フルボトルLP（?from=sample）", 13, False, COLOR_RED),
        ("→ 自社EC(Stripe)で高利益率の販売", 13, False, COLOR_RED),
    ]
    add_multiline_textbox(slide, Inches(0.8), Inches(4.4), Inches(5.5), Inches(1.2), lines2)

    # 右側: 実行中の施策
    rx = Inches(7.0)
    add_textbox(slide, rx, Inches(1.5), Inches(5), Inches(0.3),
                "現在リニューアル中", font_size=16, bold=True, color=COLOR_GREEN)

    items = [
        ("自社サイト collegrance.com", "AI診断+フルボトルEC+商品LP"),
        ("LINE Harness", "シナリオ配信+タグベースセグメント"),
        ("商品LP動的生成", "?from=sample / ?from=recommend"),
        ("GA4計測統合", "全チャネルの行動追跡→購入"),
    ]
    for i, (title, desc) in enumerate(items):
        y = Inches(2.0) + i * Inches(0.8)
        add_rect(slide, rx, y, Inches(0.15), Inches(0.5), COLOR_GREEN)
        add_textbox(slide, rx + Inches(0.3), y, Inches(5), Inches(0.3),
                    title, font_size=13, bold=True, color=COLOR_BLACK)
        add_textbox(slide, rx + Inches(0.3), y + Inches(0.3), Inches(5), Inches(0.3),
                    desc, font_size=11, color=COLOR_GRAY)

    # 下部ハイライト
    add_rect(slide, Inches(0.5), Inches(5.8), Inches(12.0), Inches(0.9), COLOR_GREEN_LIGHT,
             font_size=10, font_color=COLOR_BLACK)
    shape = slide.shapes[-1]
    tf = shape.text_frame
    tf.paragraphs[0].text = "この2セグメントに対応するため、自社サイト + LINE Harnessをリニューアル中"
    tf.paragraphs[0].font.size = Pt(16)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_BLACK
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p2 = tf.add_paragraph()
    p2.text = "「小分けで試す → 気に入ったらフルボトル」の転換率を最大化する"
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_GREEN_DARK
    p2.font.name = FONT_NAME
    p2.alignment = PP_ALIGN.CENTER

    add_footer(slide)
    add_slide_number(slide, 10)


# ══════════════════════════════════════════════════════════════
# スライド11: データ計測体制
# ══════════════════════════════════════════════════════════════
def slide_11_measurement():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "データ計測体制", "GA4で全チャネル統合計測")

    # 左: 計測フロー
    add_textbox(slide, Inches(0.8), Inches(1.4), Inches(5), Inches(0.3),
                "計測フロー", font_size=16, bold=True, color=COLOR_GREEN)

    sources = ["SNS (TikTok/Threads/IG)", "LINE", "Google検索", "Amazon"]
    for i, src in enumerate(sources):
        y = Inches(1.9) + i * Inches(0.5)
        add_rect(slide, Inches(0.8), y, Inches(2.5), Inches(0.4), COLOR_BLACK,
                 text=src, font_size=10, font_color=COLOR_WHITE, bold=True)

    add_arrow(slide, Inches(3.5), Inches(2.5), Inches(0.6), Inches(0.3))

    add_rect(slide, Inches(4.3), Inches(1.9), Inches(2.0), Inches(1.8), COLOR_GREEN,
             text="GA4\n行動追跡", font_size=14, font_color=COLOR_WHITE, bold=True)

    add_arrow(slide, Inches(6.5), Inches(2.5), Inches(0.6), Inches(0.3))

    add_rect(slide, Inches(7.3), Inches(1.9), Inches(2.0), Inches(1.8), COLOR_RED,
             text="購入\nコンバージョン", font_size=14, font_color=COLOR_WHITE, bold=True)

    # 右: 自動レポート
    rx = Inches(0.8)
    add_textbox(slide, rx, Inches(4.2), Inches(5), Inches(0.3),
                "自動レポート（Slack配信）", font_size=16, bold=True, color=COLOR_GREEN)

    reports = [
        ("日次", "流入元別セッション、診断/購入数"),
        ("週次", "ファネル分析、前週比"),
        ("月次", "チャネル別ROI"),
    ]
    for i, (freq, desc) in enumerate(reports):
        y = Inches(4.7) + i * Inches(0.45)
        add_rect(slide, rx, y, Inches(0.8), Inches(0.35), COLOR_GREEN,
                 text=freq, font_size=10, font_color=COLOR_WHITE, bold=True)
        add_textbox(slide, rx + Inches(1.0), y, Inches(4), Inches(0.35),
                    desc, font_size=12, color=COLOR_BODY)

    # 右下: サイト実績
    rx2 = Inches(7.0)
    add_textbox(slide, rx2, Inches(4.2), Inches(5), Inches(0.3),
                "直近サイト実績（モバイル、30日）", font_size=16, bold=True, color=COLOR_GREEN)

    metrics = [
        ("セッション", "585"),
        ("ユーザー", "441"),
        ("LINE経由", "70%"),
        ("Google検索", "16%"),
    ]
    for i, (label, val) in enumerate(metrics):
        x = rx2 + (i % 2) * Inches(2.8)
        y = Inches(4.7) + (i // 2) * Inches(0.9)
        add_textbox(slide, x, y, Inches(2.5), Inches(0.3),
                    label, font_size=11, color=COLOR_GRAY)
        add_textbox(slide, x, y + Inches(0.3), Inches(2.5), Inches(0.4),
                    val, font_size=26, bold=True, color=COLOR_BLACK)

    add_footer(slide)
    add_slide_number(slide, 11)


# ══════════════════════════════════════════════════════════════
# スライド12: ロードマップ
# ══════════════════════════════════════════════════════════════
def slide_12_roadmap():
    slide = prs.slides.add_slide(blank_layout)
    add_section_title(slide, "ロードマップ")

    phases = [
        ("2026年4月（現在）", COLOR_GREEN, [
            "✅ Amazon月間3,000〜5,000件",
            "✅ LINE友だち1,300人",
            "✅ 自社サイトリニューアル完了",
            "✅ AI香水診断・フルボトルEC稼働",
            "✅ ブログ60本",
            "✅ LINE CRMシナリオ設計",
        ]),
        ("2026年5〜6月", COLOR_BLACK, [
            "□ Threads/Instagram開始",
            "□ LINEシナリオ本格配信（クロスセル/アップセル）",
            "□ ブログ100本到達",
            "□ ナイトライト製作・販売開始",
        ]),
        ("2026年下半期", COLOR_GRAY, [
            "□ LINE友だち3,000人",
            "□ フルボトル月間売上目標達成",
            "□ SNS流入の本格化",
            "□ ナイトライト量産",
        ]),
    ]

    col_w = Inches(3.8)
    gap = Inches(0.2)
    start_x = Inches(0.5)

    for i, (title, color, items) in enumerate(phases):
        x = start_x + i * (col_w + gap)
        # フェーズヘッダ
        add_rect(slide, x, Inches(1.5), col_w, Inches(0.6), color,
                 text=title, font_size=16, font_color=COLOR_WHITE, bold=True)

        # タイムライン接続
        if i < len(phases) - 1:
            add_arrow(slide, x + col_w, Inches(1.6), gap, Inches(0.3), color)

        # 項目
        for j, item in enumerate(items):
            y = Inches(2.3) + j * Inches(0.5)
            is_done = item.startswith("✅")
            item_color = COLOR_GREEN if is_done else COLOR_BODY
            add_textbox(slide, x + Inches(0.2), y, col_w - Inches(0.4), Inches(0.4),
                        item, font_size=13, color=item_color, bold=is_done)

    # 下部ビジョン
    add_rect(slide, Inches(0.5), Inches(5.8), Inches(12.0), Inches(0.9), COLOR_GREEN_LIGHT,
             font_size=10, font_color=COLOR_BLACK)
    shape = slide.shapes[-1]
    tf = shape.text_frame
    tf.paragraphs[0].text = "ビジョン: 「試す → 気に入る → 買う → 再生する → 広がる」"
    tf.paragraphs[0].font.size = Pt(18)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = COLOR_GREEN_DARK
    tf.paragraphs[0].font.name = FONT_NAME
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p2 = tf.add_paragraph()
    p2.text = "香水の全ライフサイクルをビジネスに変える"
    p2.font.size = Pt(14)
    p2.font.color.rgb = COLOR_BODY
    p2.font.name = FONT_NAME
    p2.alignment = PP_ALIGN.CENTER

    add_footer(slide)
    add_slide_number(slide, 12)


# ══════════════════════════════════════════════════════════════
# メイン実行
# ══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    slide_01_cover()
    slide_02_overview()
    slide_03_business_model()
    slide_04_amazon_sales()
    slide_05_funnel()
    slide_06_customer()
    slide_07_channels()
    slide_08_line_crm()
    slide_09_site_sns()
    slide_10_strategy()
    slide_11_measurement()
    slide_12_roadmap()

    out_path = os.path.join(os.path.dirname(__file__), "COLLEGRANCE_事業全体像.pptx")
    prs.save(out_path)
    print(f"保存完了: {out_path}")
    print(f"スライド数: {len(prs.slides)}")
