#!/usr/bin/env python3
"""
Generate high-quality luxury product card images for perfume products.
Uses Pillow to create elegant, minimalist product cards.
"""

import json
import os
import math
import random
from PIL import Image, ImageDraw, ImageFont

# Configuration
WIDTH, HEIGHT = 800, 1000
OUTPUT_DIR = "/Users/keito/GitHub/collegranceWEB-/assets/images/fullbottle/"
PRODUCTS_FILE = "/Users/keito/GitHub/collegranceWEB-/products.json"

# Font paths
FONT_DIR = "/System/Library/Fonts/Supplemental/"
DIDOT_FONT = os.path.join(FONT_DIR, "Didot.ttc")
FUTURA_FONT = os.path.join(FONT_DIR, "Futura.ttc")
BODONI_FONT = os.path.join(FONT_DIR, "Bodoni 72.ttc")
BASKERVILLE_FONT = os.path.join(FONT_DIR, "Baskerville.ttc")
AVENIR_FONT = "/System/Library/Fonts/Avenir Next.ttc"
HELVETICA_FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
JAPANESE_FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"

# Color palettes per brand type (background_top, background_bottom, accent, text_primary, text_secondary)
BRAND_PALETTES = {
    "default":       ((252, 250, 248), (245, 242, 238), (180, 160, 140), (45, 40, 35), (120, 110, 100)),
    "dior":          ((250, 248, 252), (242, 238, 248), (160, 140, 180), (35, 30, 50), (110, 100, 130)),
    "tom_ford":      ((248, 248, 248), (235, 235, 235), (60, 55, 50), (25, 22, 20), (90, 85, 80)),
    "chanel":        ((255, 252, 250), (248, 244, 240), (30, 28, 25), (20, 18, 15), (100, 95, 90)),
    "hermes":        ((255, 250, 245), (250, 242, 232), (210, 120, 50), (50, 40, 30), (140, 110, 80)),
    "diptyque":      ((252, 252, 250), (245, 245, 240), (40, 60, 40), (30, 45, 30), (100, 120, 100)),
    "jo_malone":     ((255, 253, 248), (250, 248, 240), (180, 160, 120), (50, 45, 35), (130, 120, 100)),
    "ysl":           ((250, 248, 252), (242, 238, 248), (50, 30, 80), (40, 25, 60), (120, 100, 140)),
    "chloe":         ((255, 250, 248), (252, 244, 240), (200, 160, 140), (60, 45, 40), (150, 130, 120)),
    "bvlgari":       ((250, 252, 255), (240, 244, 252), (140, 160, 190), (35, 40, 55), (100, 115, 140)),
    "versace":       ((255, 252, 240), (250, 245, 228), (200, 175, 80), (50, 45, 25), (140, 130, 80)),
    "burberry":      ((252, 250, 245), (248, 242, 232), (180, 140, 90), (50, 40, 25), (140, 120, 80)),
    "armani":        ((250, 252, 255), (240, 245, 252), (60, 90, 130), (30, 40, 60), (90, 110, 140)),
    "dolce":         ((255, 250, 248), (252, 242, 238), (190, 50, 50), (50, 25, 25), (140, 90, 90)),
    "calvin_klein":  ((252, 252, 252), (242, 242, 242), (120, 120, 120), (40, 40, 40), (110, 110, 110)),
    "issey":         ((250, 252, 255), (238, 245, 255), (100, 150, 200), (30, 45, 65), (90, 120, 160)),
    "lanvin":        ((252, 248, 255), (245, 238, 252), (150, 100, 180), (45, 30, 60), (120, 90, 150)),
    "mfk":           ((255, 250, 245), (252, 242, 232), (190, 140, 80), (55, 40, 20), (150, 120, 70)),
}

def get_palette(brand):
    brand_lower = brand.lower()
    if "dior" in brand_lower: return BRAND_PALETTES["dior"]
    if "tom ford" in brand_lower: return BRAND_PALETTES["tom_ford"]
    if "diptyque" in brand_lower: return BRAND_PALETTES["diptyque"]
    if "jo malone" in brand_lower: return BRAND_PALETTES["jo_malone"]
    if "ysl" in brand_lower: return BRAND_PALETTES["ysl"]
    if "chlo" in brand_lower: return BRAND_PALETTES["chloe"]
    if "bvlgari" in brand_lower or "bulgari" in brand_lower: return BRAND_PALETTES["bvlgari"]
    if "versace" in brand_lower: return BRAND_PALETTES["versace"]
    if "burberry" in brand_lower: return BRAND_PALETTES["burberry"]
    if "armani" in brand_lower: return BRAND_PALETTES["armani"]
    if "dolce" in brand_lower: return BRAND_PALETTES["dolce"]
    if "calvin" in brand_lower: return BRAND_PALETTES["calvin_klein"]
    if "issey" in brand_lower: return BRAND_PALETTES["issey"]
    if "lanvin" in brand_lower: return BRAND_PALETTES["lanvin"]
    if "kurkdjian" in brand_lower or "mfk" in brand_lower: return BRAND_PALETTES["mfk"]
    if "hermes" in brand_lower or "hermès" in brand_lower: return BRAND_PALETTES["hermes"]
    if "margiela" in brand_lower: return BRAND_PALETTES["default"]
    if "loewe" in brand_lower: return BRAND_PALETTES["default"]
    return BRAND_PALETTES["default"]


def load_font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except:
        try:
            return ImageFont.truetype(path, size)
        except:
            return ImageFont.load_default()


def draw_gradient(draw, width, height, color_top, color_bottom):
    """Draw a smooth vertical gradient."""
    for y in range(height):
        ratio = y / height
        r = int(color_top[0] + (color_bottom[0] - color_top[0]) * ratio)
        g = int(color_top[1] + (color_bottom[1] - color_top[1]) * ratio)
        b = int(color_top[2] + (color_bottom[2] - color_top[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))


def draw_bottle_silhouette(draw, cx, cy, accent_color, product_type="perfume"):
    """Draw a minimalist, elegant bottle silhouette."""
    # Use alpha for a subtle, sophisticated look
    alpha = 35
    color = (*accent_color, alpha)

    if product_type == "body_cream" or product_type == "hand_cream":
        # Draw a jar/pot shape
        _draw_jar(draw, cx, cy, accent_color, alpha)
    elif product_type == "body_lotion":
        # Draw a tube/bottle shape
        _draw_lotion(draw, cx, cy, accent_color, alpha)
    else:
        # Draw perfume bottle
        _draw_perfume_bottle(draw, cx, cy, accent_color, alpha)


def _draw_perfume_bottle(draw, cx, cy, accent, alpha):
    """Draw a refined perfume bottle silhouette."""
    # Main bottle body - tall rectangle with slight taper
    body_w, body_h = 140, 220
    body_top = cy - 20
    body_bottom = body_top + body_h
    body_left = cx - body_w // 2
    body_right = cx + body_w // 2

    # Bottle body with rounded corners
    r = 12
    col = (*accent, alpha)
    draw.rounded_rectangle(
        [body_left, body_top, body_right, body_bottom],
        radius=r, fill=col
    )

    # Neck
    neck_w = 40
    neck_h = 50
    neck_top = body_top - neck_h
    draw.rounded_rectangle(
        [cx - neck_w//2, neck_top, cx + neck_w//2, body_top + 10],
        radius=6, fill=col
    )

    # Cap
    cap_w = 60
    cap_h = 45
    cap_top = neck_top - cap_h + 5
    draw.rounded_rectangle(
        [cx - cap_w//2, cap_top, cx + cap_w//2, neck_top + 5],
        radius=8, fill=(*accent, alpha + 15)
    )

    # Subtle highlight line on bottle
    highlight_col = (*accent, alpha // 2)
    draw.line(
        [(cx - body_w//4, body_top + 20), (cx - body_w//4, body_bottom - 20)],
        fill=highlight_col, width=2
    )

    # Base line
    draw.line(
        [(body_left + 10, body_bottom), (body_right - 10, body_bottom)],
        fill=(*accent, alpha + 10), width=2
    )


def _draw_jar(draw, cx, cy, accent, alpha):
    """Draw a cream jar silhouette."""
    col = (*accent, alpha)
    # Main jar body
    jar_w, jar_h = 180, 140
    jar_top = cy + 10
    draw.rounded_rectangle(
        [cx - jar_w//2, jar_top, cx + jar_w//2, jar_top + jar_h],
        radius=20, fill=col
    )
    # Lid
    lid_w, lid_h = 190, 40
    lid_top = jar_top - lid_h + 5
    draw.rounded_rectangle(
        [cx - lid_w//2, lid_top, cx + lid_w//2, jar_top + 10],
        radius=10, fill=(*accent, alpha + 15)
    )


def _draw_lotion(draw, cx, cy, accent, alpha):
    """Draw a lotion bottle silhouette."""
    col = (*accent, alpha)
    body_w, body_h = 120, 250
    body_top = cy - 40
    draw.rounded_rectangle(
        [cx - body_w//2, body_top, cx + body_w//2, body_top + body_h],
        radius=15, fill=col
    )
    # Pump top
    pump_w = 30
    pump_h = 60
    draw.rounded_rectangle(
        [cx - pump_w//2, body_top - pump_h, cx + pump_w//2, body_top + 10],
        radius=5, fill=(*accent, alpha + 10)
    )
    # Pump nozzle
    draw.line(
        [(cx, body_top - pump_h), (cx + 40, body_top - pump_h - 10)],
        fill=(*accent, alpha + 20), width=3
    )
    draw.ellipse(
        [cx + 35, body_top - pump_h - 18, cx + 50, body_top - pump_h - 5],
        fill=(*accent, alpha + 10)
    )


def get_product_type(name):
    name_lower = name.lower()
    if "body cream" in name_lower or "perfumed body" in name_lower:
        return "body_cream"
    if "hand cream" in name_lower:
        return "hand_cream"
    if "body lotion" in name_lower:
        return "body_lotion"
    return "perfume"


def draw_decorative_lines(draw, width, height, accent_color):
    """Draw subtle decorative elements."""
    alpha = 20
    col = (*accent_color, alpha)

    # Top thin line
    draw.line([(80, 60), (width - 80, 60)], fill=col, width=1)
    # Bottom thin line
    draw.line([(80, height - 60), (width - 80, height - 60)], fill=col, width=1)

    # Small decorative diamond at top center
    dcx, dcy = width // 2, 60
    ds = 4
    draw.polygon([(dcx, dcy - ds), (dcx + ds, dcy), (dcx, dcy + ds), (dcx - ds, dcy)], fill=col)

    # Small decorative diamond at bottom center
    dcy = height - 60
    draw.polygon([(dcx, dcy - ds), (dcx + ds, dcy), (dcx, dcy + ds), (dcx - ds, dcy)], fill=col)


def text_width(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def draw_centered_text(draw, y, text, font, fill, width):
    tw = text_width(draw, text, font)
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)
    bbox = draw.textbbox((x, y), text, font=font)
    return bbox[3]  # return bottom y


def wrap_text(draw, text, font, max_width):
    """Simple word-wrap."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if text_width(draw, test, font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def generate_product_image(product, filename):
    """Generate a single product card image."""
    brand = product["brand"]
    name = product["name"]
    name_ja = product.get("nameJa", "")
    size = product.get("size", "")
    notes = product.get("notes", "")
    tags = product.get("tags", [])

    palette = get_palette(brand)
    bg_top, bg_bottom, accent, text_primary, text_secondary = palette
    product_type = get_product_type(name)

    # Create RGBA image for transparency support in drawing
    img = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Draw gradient background
    draw_gradient(draw, WIDTH, HEIGHT, bg_top, bg_bottom)

    # Draw decorative lines
    draw_decorative_lines(draw, WIDTH, HEIGHT, accent)

    # Draw bottle silhouette in center area
    draw_bottle_silhouette(draw, WIDTH // 2, HEIGHT // 2 - 40, accent, product_type)

    # Load fonts
    brand_font = load_font(DIDOT_FONT, 28)
    name_font = load_font(DIDOT_FONT, 42)
    name_ja_font = load_font(JAPANESE_FONT, 22)
    detail_font = load_font(AVENIR_FONT, 18)
    notes_font = load_font(AVENIR_FONT, 16)
    tag_font = load_font(AVENIR_FONT, 14)

    # -- Layout text --
    # Brand name (top area)
    brand_display = brand.upper()
    y = 100
    y_bottom = draw_centered_text(draw, y, brand_display, brand_font, (*text_secondary, 200), WIDTH)

    # Small separator
    y = y_bottom + 16
    sep_w = 40
    draw.line([(WIDTH//2 - sep_w, y), (WIDTH//2 + sep_w, y)], fill=(*accent, 80), width=1)

    # Product name
    y += 24
    # Wrap if too long
    name_lines = wrap_text(draw, name, name_font, WIDTH - 160)
    for line in name_lines:
        y_bottom = draw_centered_text(draw, y, line, name_font, (*text_primary, 240), WIDTH)
        y = y_bottom + 6

    # Japanese name
    if name_ja:
        y += 8
        y_bottom = draw_centered_text(draw, y, name_ja, name_ja_font, (*text_secondary, 160), WIDTH)

    # -- Bottom area --
    # Size
    bottom_y = HEIGHT - 200
    if size:
        draw_centered_text(draw, bottom_y, size, detail_font, (*text_secondary, 180), WIDTH)
        bottom_y += 30

    # Notes
    if notes:
        notes_lines = wrap_text(draw, notes, notes_font, WIDTH - 160)
        for line in notes_lines:
            y_b = draw_centered_text(draw, bottom_y, line, notes_font, (*text_secondary, 140), WIDTH)
            bottom_y = y_b + 4

    # Tags as small labels
    if tags:
        bottom_y += 16
        tag_text = "  ·  ".join(t.upper() for t in tags)
        draw_centered_text(draw, bottom_y, tag_text, tag_font, (*accent, 120), WIDTH)

    # Convert to RGB for JPEG
    img_rgb = Image.new("RGB", (WIDTH, HEIGHT), (255, 255, 255))
    img_rgb.paste(img, mask=img.split()[3])

    # Save
    filepath = os.path.join(OUTPUT_DIR, filename)
    img_rgb.save(filepath, "JPEG", quality=88, optimize=True)
    return filepath


def main():
    # Load products
    with open(PRODUCTS_FILE) as f:
        products = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # These are the product IDs that need generated images
    # (the ones that were originally empty)
    target_ids = set(range(24, 61))

    # Map of product ID to its current img filename
    generated = 0
    for i, product in enumerate(products):
        pid = product["id"]
        if pid not in target_ids:
            continue

        # Use existing img path if set, otherwise create new one
        img_path = product.get("img", "")
        if img_path:
            filename = os.path.basename(img_path)
        else:
            filename = f"COLLEGRANCE{pid:03d}.jpg"
            img_path = f"assets/images/fullbottle/{filename}"
            products[i]["img"] = img_path

        print(f"Generating [{generated+1}/37] {product['brand']} - {product['name']} -> {filename}")

        try:
            generate_product_image(product, filename)
            generated += 1
        except Exception as e:
            print(f"  ERROR: {e}")

    # Save updated products.json
    with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Generated {generated} images.")
    print(f"Updated {PRODUCTS_FILE}")


if __name__ == "__main__":
    main()
