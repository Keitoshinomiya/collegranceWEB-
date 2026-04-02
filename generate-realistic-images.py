#!/usr/bin/env python3
"""
リアルなボトル形状に基づいた高品質商品画像を生成
各ブランドの実際のボトルデザインを参考にしたオリジナルイラスト
"""

import json, os, math, random
from PIL import Image, ImageDraw, ImageFont

W, H = 800, 1000
DEST = "assets/images/fullbottle"

def get_font(size, bold=False, japanese=False):
    if japanese:
        for p in ["/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"]:
            try: return ImageFont.truetype(p, size)
            except: continue
    paths = [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    ]
    for p in paths:
        try: return ImageFont.truetype(p, size)
        except: continue
    return ImageFont.load_default()

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def blend(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    x0, y0, x1, y1 = xy
    r = min(radius, (x1-x0)//2, (y1-y0)//2)
    draw.rectangle([x0+r, y0, x1-r, y1], fill=fill)
    draw.rectangle([x0, y0+r, x1, y1-r], fill=fill)
    draw.pieslice([x0, y0, x0+2*r, y0+2*r], 180, 270, fill=fill)
    draw.pieslice([x1-2*r, y0, x1, y0+2*r], 270, 360, fill=fill)
    draw.pieslice([x0, y1-2*r, x0+2*r, y1], 90, 180, fill=fill)
    draw.pieslice([x1-2*r, y1-2*r, x1, y1], 0, 90, fill=fill)
    if outline:
        draw.arc([x0, y0, x0+2*r, y0+2*r], 180, 270, fill=outline, width=width)
        draw.arc([x1-2*r, y0, x1, y0+2*r], 270, 360, fill=outline, width=width)
        draw.arc([x0, y1-2*r, x0+2*r, y1], 90, 180, fill=outline, width=width)
        draw.arc([x1-2*r, y1-2*r, x1, y1], 0, 90, fill=outline, width=width)
        draw.line([x0+r, y0, x1-r, y0], fill=outline, width=width)
        draw.line([x0+r, y1, x1-r, y1], fill=outline, width=width)
        draw.line([x0, y0+r, x0, y1-r], fill=outline, width=width)
        draw.line([x1, y0+r, x1, y1-r], fill=outline, width=width)

def draw_ellipse_bottle(draw, cx, cy, w, h, color, highlight, outline_color):
    """楕円/丸いボトル"""
    for i in range(h):
        t = i / h
        c = blend(hex_to_rgb(highlight), hex_to_rgb(color), t * 0.6 + 0.2)
        # 楕円の幅を計算
        ey = (i - h/2) / (h/2)
        ew = int(w/2 * math.sqrt(max(0, 1 - ey*ey)))
        if ew > 0:
            draw.line([cx - ew, cy - h//2 + i, cx + ew, cy - h//2 + i], fill=c)
    draw.ellipse([cx-w//2, cy-h//2, cx+w//2, cy+h//2], outline=hex_to_rgb(outline_color), width=2)

def draw_rectangular_bottle(draw, cx, cy, w, h, color, highlight, outline_color, radius=8):
    """角丸長方形ボトル"""
    x0, y0 = cx - w//2, cy - h//2
    for i in range(h):
        t = i / h
        # 左右にハイライトグラデーション
        for j in range(w):
            jt = abs(j - w*0.35) / (w*0.5)
            jt = min(jt, 1.0)
            base = blend(hex_to_rgb(highlight), hex_to_rgb(color), t * 0.5 + 0.25)
            c = blend(hex_to_rgb(highlight), base, max(0, 1 - jt * 1.5) * 0.3)
            draw.point((x0 + j, y0 + i), fill=c)
    draw_rounded_rect(draw, [x0, y0, x0+w, y0+h], radius, fill=None, outline=hex_to_rgb(outline_color), width=2)

def draw_disc_bottle(draw, cx, cy, w, h, color, highlight, outline_color):
    """ディスク型ボトル（BVLGARI Omnia）"""
    for i in range(h):
        t = i / h
        ey = (i - h/2) / (h/2)
        ew = int(w/2 * math.sqrt(max(0, 1 - ey*ey)))
        if ew > 0:
            c = blend(hex_to_rgb(highlight), hex_to_rgb(color), t * 0.5 + 0.25)
            draw.line([cx - ew, cy - h//2 + i, cx + ew, cy - h//2 + i], fill=c)
    draw.ellipse([cx-w//2, cy-h//2, cx+w//2, cy+h//2], outline=hex_to_rgb(outline_color), width=2)

def draw_conical_bottle(draw, cx, cy, w, h, color, highlight, outline_color):
    """円錐/三角形ボトル（ISSEY MIYAKE）"""
    for i in range(h):
        t = i / h
        bw = int(w * t)
        if bw > 0:
            c = blend(hex_to_rgb(highlight), hex_to_rgb(color), t * 0.5 + 0.25)
            draw.line([cx - bw//2, cy - h//2 + i, cx + bw//2, cy - h//2 + i], fill=c)
    # 三角形の輪郭
    pts = [(cx, cy - h//2), (cx - w//2, cy + h//2), (cx + w//2, cy + h//2)]
    draw.line(pts + [pts[0]], fill=hex_to_rgb(outline_color), width=2)

def draw_faceted_bottle(draw, cx, cy, w, h, color, highlight, outline_color):
    """ファセットカット/八角形ボトル（VERSACE）"""
    inset = w // 6
    pts = [
        (cx - w//2 + inset, cy - h//2),
        (cx + w//2 - inset, cy - h//2),
        (cx + w//2, cy - h//2 + inset),
        (cx + w//2, cy + h//2 - inset),
        (cx + w//2 - inset, cy + h//2),
        (cx - w//2 + inset, cy + h//2),
        (cx - w//2, cy + h//2 - inset),
        (cx - w//2, cy - h//2 + inset),
    ]
    # 塗りつぶし
    c = blend(hex_to_rgb(color), hex_to_rgb(highlight), 0.3)
    draw.polygon(pts, fill=c, outline=hex_to_rgb(outline_color))
    # ファセットのライン
    fc = blend(hex_to_rgb(highlight), hex_to_rgb(outline_color), 0.5)
    draw.line([cx, cy - h//2, cx, cy + h//2], fill=fc, width=1)

# ====== ボトルデザインデータ ======
BOTTLES = {
    "Baccarat Rouge 540": {"shape":"rect","bottle":"#f5e6d0","cap":"#c8102e","highlight":"#fff8f0","outline":"#c8a878","cap_h":0.12},
    "Soleil Neige": {"shape":"rect","bottle":"#f0e8e0","cap":"#d4af37","highlight":"#fffdf5","outline":"#d4af37","cap_h":0.1},
    "Eau Rose": {"shape":"oval","bottle":"#f5f0e0","cap":"#1a1a1a","highlight":"#ffffff","outline":"#cccccc","cap_h":0.08},
    "Do Son": {"shape":"oval","bottle":"#f5f5e8","cap":"#1a1a1a","highlight":"#ffffff","outline":"#cccccc","cap_h":0.08},
    "Philosykos": {"shape":"oval","bottle":"#f0edd8","cap":"#1a1a1a","highlight":"#ffffff","outline":"#cccccc","cap_h":0.08},
    "Blackberry & Bay": {"shape":"rect","bottle":"#faf8f0","cap":"#c8b078","highlight":"#ffffff","outline":"#d0c8b0","cap_h":0.1},
    "Body Lotion - Lazy Sunday Morning": {"shape":"rect","bottle":"#ffffff","cap":"#ffffff","highlight":"#f8f8f8","outline":"#e0e0e0","cap_h":0.06,"tall":True},
    "Sauvage EDT": {"shape":"rect","bottle":"#1a2744","cap":"#2a3a5c","highlight":"#3a5a8c","outline":"#4a6a9c","cap_h":0.1},
    "001 Woman EDP": {"shape":"oval","bottle":"#f5e8e0","cap":"#d4a574","highlight":"#fff5f0","outline":"#d4a574","cap_h":0.1},
    "LIBRE EDP": {"shape":"rect","bottle":"#f0e0c0","cap":"#d4af37","highlight":"#fff8e0","outline":"#d4af37","cap_h":0.12},
    "Chloé EDP": {"shape":"rect","bottle":"#f8f0e8","cap":"#c0c0c0","highlight":"#ffffff","outline":"#d4a574","cap_h":0.08,"ribbon":True},
    "Love Story": {"shape":"rect","bottle":"#f0f0e8","cap":"#d4af37","highlight":"#ffffff","outline":"#d4af37","cap_h":0.12},
    "Omnia Amethyste": {"shape":"disc","bottle":"#c8a0d0","cap":"#9060a0","highlight":"#e0c8e8","outline":"#9060a0","cap_h":0.05},
    "Pour Homme": {"shape":"rect","bottle":"#e0e8f0","cap":"#c0c0c0","highlight":"#f0f5ff","outline":"#a0b0c0","cap_h":0.08,"tall":True},
    "Yellow Diamond": {"shape":"faceted","bottle":"#f8e878","cap":"#d4af37","highlight":"#fff8c0","outline":"#d4af37","cap_h":0.15},
    "Bright Crystal": {"shape":"faceted","bottle":"#f0c8d0","cap":"#e8a0b0","highlight":"#fff0f5","outline":"#d0a0b0","cap_h":0.15},
    "Dylan Blue Pour Femme": {"shape":"faceted","bottle":"#4060a0","cap":"#3050a0","highlight":"#6080c0","outline":"#5070b0","cap_h":0.15},
    "Weekend for Women": {"shape":"rect","bottle":"#f8f0e0","cap":"#d0c0a0","highlight":"#ffffff","outline":"#c8b898","cap_h":0.1},
    "Acqua di Gio": {"shape":"oval","bottle":"#d8e8f0","cap":"#b0c0d0","highlight":"#f0f8ff","outline":"#a0b8c8","cap_h":0.1},
    "The One for Men": {"shape":"rect","bottle":"#3a3028","cap":"#2a2018","highlight":"#5a5040","outline":"#4a4030","cap_h":0.1},
    "Light Blue Capri in Love": {"shape":"rect","bottle":"#a8d8f0","cap":"#88c8e8","highlight":"#d0f0ff","outline":"#80b8d0","cap_h":0.1},
    "Eternity": {"shape":"rect","bottle":"#f0f0f0","cap":"#c0c0c0","highlight":"#ffffff","outline":"#d0d0d0","cap_h":0.08,"tall":True},
    "ck Everyone": {"shape":"oval","bottle":"#e8e0d0","cap":"#c8b898","highlight":"#f8f4e8","outline":"#c0b090","cap_h":0.1},
    "L'Eau d'Issey Pivoine Intense": {"shape":"conical","bottle":"#e8c0d0","cap":"#c0c0c0","highlight":"#fff0f5","outline":"#d0a0b0","cap_h":0.05},
    "Éclat d'Arpège": {"shape":"oval","bottle":"#d0b8e8","cap":"#d0b8e8","highlight":"#e8d8f8","outline":"#b098d0","cap_h":0.08},
    "Perfumed Body Cream": {"shape":"disc","bottle":"#f8f0e8","cap":"#e8ddd0","highlight":"#ffffff","outline":"#d4a574","cap_h":0.05},
    "Hand Cream - Lazy Sunday Morning": {"shape":"rect","bottle":"#ffffff","cap":"#ffffff","highlight":"#f8f8f8","outline":"#e0e0e0","cap_h":0.06,"short":True},
    "Dolce Blue Jasmine": {"shape":"oval","bottle":"#a0c8e8","cap":"#4888b8","highlight":"#c8e0f8","outline":"#6098c0","cap_h":0.12},
    "Man Eau Fraîche": {"shape":"faceted","bottle":"#88c8d8","cap":"#70b8c8","highlight":"#b0e0e8","outline":"#70b0c0","cap_h":0.15},
    "Omnia Crystalline": {"shape":"disc","bottle":"#f0e8d0","cap":"#e8dcc0","highlight":"#fff8f0","outline":"#c8b898","cap_h":0.05},
    "Eternity for Men": {"shape":"rect","bottle":"#d0d8e0","cap":"#a0a8b0","highlight":"#e8f0f8","outline":"#b0b8c0","cap_h":0.08,"tall":True},
    "Wood & Wood": {"shape":"rect","bottle":"#c8a878","cap":"#a08050","highlight":"#e0c898","outline":"#a08050","cap_h":0.1},
    "Jeanne Lanvin": {"shape":"oval","bottle":"#d8a0c0","cap":"#6a3080","highlight":"#f0c8e0","outline":"#a070b0","cap_h":0.1},
    "Burberry Touch for Men": {"shape":"rect","bottle":"#e0d8c8","cap":"#c0b098","highlight":"#f0ece0","outline":"#b0a888","cap_h":0.1},
    "Acqua di Gioia": {"shape":"oval","bottle":"#c8e0d0","cap":"#90c8b0","highlight":"#e8f8f0","outline":"#88b8a0","cap_h":0.1},
    "Eros Flame": {"shape":"faceted","bottle":"#c83030","cap":"#d4af37","highlight":"#e85050","outline":"#a02020","cap_h":0.15},
}

def generate_image(brand, name, name_ja, size, output_path):
    design = BOTTLES.get(name, {"shape":"rect","bottle":"#f0f0f0","cap":"#888888","highlight":"#ffffff","outline":"#cccccc","cap_h":0.1})

    bg = hex_to_rgb(design.get("highlight", "#f8f8f8"))
    bg = blend(bg, (255,255,255), 0.7)
    img = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    # 微細テクスチャ
    random.seed(hash(name))
    for _ in range(500):
        x, y = random.randint(0,W-1), random.randint(0,H-1)
        r,g,b = img.getpixel((x,y))
        d = random.randint(-2,2)
        img.putpixel((x,y), (max(0,min(255,r+d)), max(0,min(255,g+d)), max(0,min(255,b+d))))
    draw = ImageDraw.Draw(img)

    cx = W // 2

    # ボトルサイズ
    is_tall = design.get("tall", False)
    is_short = design.get("short", False)
    bw = int(W * 0.28)
    bh = int(H * (0.42 if is_tall else 0.30 if is_short else 0.36))
    by = int(H * 0.44)

    shape = design["shape"]
    bottle_c = design["bottle"]
    highlight_c = design["highlight"]
    outline_c = design["outline"]
    cap_c = design["cap"]
    cap_h = int(bh * design["cap_h"] / 0.36 * 1.2)

    # ボトル影
    shadow_c = blend(bg, (0,0,0), 0.06)
    if shape == "disc":
        draw.ellipse([cx-bw//2+8, by-bh//2+8, cx+bw//2+8, by+bh//2+8], fill=shadow_c)
    elif shape == "oval":
        draw.ellipse([cx-bw//2+6, by-bh//2+6, cx+bw//2+6, by+bh//2+6], fill=shadow_c)
    else:
        draw.rectangle([cx-bw//2+6, by-bh//2+6, cx+bw//2+6, by+bh//2+6], fill=shadow_c)

    # ボトル描画
    if shape == "rect":
        draw_rectangular_bottle(draw, cx, by, bw, bh, bottle_c, highlight_c, outline_c, 6)
    elif shape == "oval":
        draw_ellipse_bottle(draw, cx, by, bw, bh, bottle_c, highlight_c, outline_c)
    elif shape == "disc":
        bw = int(W * 0.45)
        bh = int(H * 0.22)
        draw_disc_bottle(draw, cx, by, bw, bh, bottle_c, highlight_c, outline_c)
    elif shape == "conical":
        draw_conical_bottle(draw, cx, by, bw, bh, bottle_c, highlight_c, outline_c)
    elif shape == "faceted":
        draw_faceted_bottle(draw, cx, by, bw, bh, bottle_c, highlight_c, outline_c)

    # キャップ
    cap_w = int(bw * (0.35 if shape in ("oval","conical") else 0.45))
    cap_top = by - bh//2 - cap_h
    cap_color = hex_to_rgb(cap_c)
    draw_rounded_rect(draw, [cx-cap_w//2, cap_top, cx+cap_w//2, cap_top+cap_h], 4, fill=cap_color)

    # ネック
    neck_w = int(cap_w * 0.65)
    neck_h = int(cap_h * 0.4)
    draw.rectangle([cx-neck_w//2, cap_top+cap_h, cx+neck_w//2, by-bh//2+4], fill=cap_color)

    # リボン（Chloé）
    if design.get("ribbon"):
        ry = by - bh//2 + 10
        ribbon_c = hex_to_rgb("#d4a574")
        draw.line([cx-bw//3, ry, cx+bw//3, ry], fill=ribbon_c, width=2)
        draw.ellipse([cx+bw//4, ry-8, cx+bw//4+16, ry+8], outline=ribbon_c, width=1)

    # ブランド名（上部）
    font_brand = get_font(26)
    brand_text = brand.upper()
    bb = draw.textbbox((0,0), brand_text, font=font_brand)
    bw_text = bb[2] - bb[0]
    text_color = hex_to_rgb(outline_c)
    # 暗いボトルの場合はテキスト色を調整
    if sum(hex_to_rgb(bottle_c)) < 300:
        text_color = hex_to_rgb(outline_c)
    draw.text(((W-bw_text)//2, 65), brand_text, fill=text_color, font=font_brand)

    # 装飾ライン
    draw.line([(W-min(bw_text+40,W-80))//2, 100, (W+min(bw_text+40,W-80))//2, 100], fill=text_color, width=1)

    # 商品名（下部）
    font_name = get_font(32, bold=True)
    bb = draw.textbbox((0,0), name, font=font_name)
    nw = bb[2] - bb[0]
    name_y = H - 210
    draw.text(((W-nw)//2, name_y), name, fill=text_color, font=font_name)

    # 日本語名
    if name_ja:
        font_ja = get_font(18, japanese=True)
        bb = draw.textbbox((0,0), name_ja, font=font_ja)
        draw.text(((W-(bb[2]-bb[0]))//2, name_y + 45), name_ja, fill=text_color, font=font_ja)

    # 容量
    font_size = get_font(16)
    bb = draw.textbbox((0,0), size, font=font_size)
    draw.text(((W-(bb[2]-bb[0]))//2, H - 135), size, fill=text_color, font=font_size)

    # 下部ライン
    draw.line([(W//2-25), H-110, (W//2+25), H-110], fill=text_color, width=1)

    # COLLEGRANCEロゴ
    font_logo = get_font(11)
    bb = draw.textbbox((0,0), "COLLEGRANCE", font=font_logo)
    draw.text(((W-(bb[2]-bb[0]))//2, H-80), "COLLEGRANCE", fill=blend(text_color, bg, 0.5), font=font_logo)

    img.save(output_path, "JPEG", quality=92, optimize=True)
    return os.path.getsize(output_path)

def main():
    os.makedirs(DEST, exist_ok=True)
    with open("products.json", "r", encoding="utf-8") as f:
        products = json.load(f)

    generated = 0
    for p in products:
        if p.get("source") == "purchase_history":
            continue  # 実物写真は触らない

        brand = p["brand"]
        name = p["name"]
        name_ja = p.get("nameJa", "")
        size = p.get("size", "")

        fname = f"product_{p['id']:02d}.jpg"
        output = os.path.join(DEST, fname)

        fsize = generate_image(brand, name, name_ja, size, output)
        p["img"] = f"assets/images/fullbottle/{fname}"
        generated += 1
        print(f"✅ {fname} ({fsize//1024}KB) - {brand} / {name}")

    with open("products.json", "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n合計: {generated}枚の画像を生成")

if __name__ == "__main__":
    main()
