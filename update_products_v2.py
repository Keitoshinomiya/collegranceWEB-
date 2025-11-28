
import re

# Mapping based on provided table
# Top/Middle/Base Notes from table
products = [
    {
        "brand": "BYREDO",
        "kana": "バイレード",
        "name": "Blanche",
        "type": "EDP",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FRG5XX2Q",
        "color": "#5AB9BE",
        "notes_top": "Aldehydes, Rose",
        "notes_middle": "Peony, Lily of the Valley",
        "notes_base": "Musk, Sandalwood, Amber"
    },
    {
        "brand": "Calvin Klein",
        "kana": "カルバン・クライン",
        "name": "ck one",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKMB6HR",
        "color": "#EBE65F",
        "notes_top": "Bergamot, Pineapple",
        "notes_middle": "Jasmine, Violet",
        "notes_base": "Musk, Amber"
    },
    {
        "brand": "DIOR",
        "kana": "ディオール",
        "name": "Hypnotic Poison",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKNF4QC",
        "color": "#FAF5BE",
        "notes_top": "Coconut, Plum, Apricot",
        "notes_middle": "Rosewood, Jasmine",
        "notes_base": "Vanilla, Almond, Musk"
    },
    {
        "brand": "DIOR",
        "kana": "ディオール",
        "name": "Sauvage",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKQW44P",
        "color": "#EBE65F",
        "notes_top": "Bergamot, Pepper",
        "notes_middle": "Lavender, Patchouli",
        "notes_base": "Ambroxan, Cedar"
    },
    {
        "brand": "DIPTYQUE",
        "kana": "ディプティック",
        "name": "Orpheon",
        "type": "EDP",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKMB6HG",
        "color": "#FAF5BE",
        "notes_top": "Juniper Berry",
        "notes_middle": "Jasmine",
        "notes_base": "Cedar, Tonka Bean"
    },
    {
        "brand": "Dolce & Gabbana",
        "kana": "ドルチェ＆ガッバーナ",
        "name": "Light Blue",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKNWDG8",
        "color": "#EBE65F",
        "notes_top": "Lemon, Apple",
        "notes_middle": "Jasmine, White Rose",
        "notes_base": "Cedar, Musk"
    },
    {
        "brand": "HERMÈS",
        "kana": "エルメス",
        "name": "Un Jardin sur le Nil",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKQGK6Z",
        "color": "#EBE65F",
        "notes_top": "Green Mango, Citrus",
        "notes_middle": "Lotus, Calamus",
        "notes_base": "Sycamore, Incense"
    },
    {
        "brand": "ISSEY MIYAKE",
        "kana": "イッセイ ミヤケ",
        "name": "L'Eau d'Issey",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKRJKJ7",
        "color": "#5AB9BE",
        "notes_top": "Lotus, Rose",
        "notes_middle": "Lily, White Flowers",
        "notes_base": "Precious Woods"
    },
    {
        "brand": "Jo Malone London",
        "kana": "ジョー マローン ロンドン",
        "name": "English Pear & Freesia",
        "type": "Cologne",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKNWSN5",
        "color": "#FFC3B9",
        "notes_top": "Pear",
        "notes_middle": "Freesia",
        "notes_base": "Patchouli, Amber"
    },
    {
        "brand": "LE LABO",
        "kana": "ル ラボ",
        "name": "Another 13",
        "type": "EDP",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKQLTQN",
        "color": "#5AB9BE",
        "notes_top": "Pear, Citrus",
        "notes_middle": "Ambrette, Jasmine",
        "notes_base": "Ambroxan, Musk"
    },
    {
        "brand": "LOEWE",
        "kana": "ロエベ",
        "name": "001 Woman",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKPQPZ7",
        "color": "#FFC3B9",
        "notes_top": "Bergamot, Pink Pepper",
        "notes_middle": "Sandalwood, Jasmine",
        "notes_base": "Vanilla, Amber"
    },
    {
        "brand": "LOEWE",
        "kana": "ロエベ",
        "name": "001 Man",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKQ8QV8",
        "color": "#EBE65F",
        "notes_top": "Cardamom, Bergamot",
        "notes_middle": "Cypress, Sandalwood",
        "notes_base": "Violet, Patchouli"
    },
    {
        "brand": "Maison Margiela",
        "kana": "メゾン マルジェラ",
        "name": "Lazy Sunday Morning",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKSJVDC",
        "color": "#5AB9BE",
        "notes_top": "Aldehydes, Pear",
        "notes_middle": "Iris, Rose, Orange Blossom",
        "notes_base": "White Musk, Patchouli"
    },
    {
        "brand": "TIFFANY & CO.",
        "kana": "ティファニー",
        "name": "Rose Gold",
        "type": "EDP",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKRCH5G",
        "color": "#FFC3B9",
        "notes_top": "Blackcurrant",
        "notes_middle": "Blue Rose",
        "notes_base": "Ambrette Seed"
    },
    {
        "brand": "YVES SAINT LAURENT",
        "kana": "イヴ・サンローラン",
        "name": "LIBRE",
        "type": "EDP",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKSG813",
        "color": "#FFC3B9",
        "notes_top": "Lavender, Tangerine",
        "notes_middle": "Orange Blossom",
        "notes_base": "Vanilla, Tonka Bean"
    },
    {
        "brand": "Maison Margiela",
        "kana": "メゾン マルジェラ",
        "name": "Jazz Club",
        "type": "EDT",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKQBBXN",
        "color": "#FAF5BE",
        "notes_top": "Pink Pepper, Lemon",
        "notes_middle": "Rum, Vetiver",
        "notes_base": "Tobacco, Vanilla"
    },
    {
        "brand": "DIPTYQUE",
        "kana": "ディプティック",
        "name": "Fleur de Peau",
        "type": "EDP",
        "size": "1.5ml",
        "url": "https://www.amazon.co.jp/dp/B0FSKQWRJM",
        "color": "#5AB9BE",
        "notes_top": "Bergamot, Pink Pepper",
        "notes_middle": "Iris, Rose",
        "notes_base": "Musk, Ambrette"
    }
]

def generate_html(products):
    # Filter Buttons HTML
    html = '''
    <div class="filter-container">
        <button class="filter-btn active" data-filter="all">ALL</button>
        <button class="filter-btn" data-filter="#FFC3B9"><span class="filter-color-dot" style="background:#FFC3B9"></span>Citrus & Green</button>
        <button class="filter-btn" data-filter="#FAF5BE"><span class="filter-color-dot" style="background:#FAF5BE"></span>Warm & Gourmand</button>
        <button class="filter-btn" data-filter="#5AB9BE"><span class="filter-color-dot" style="background:#5AB9BE"></span>Clean Musk & Aquatic</button>
        <button class="filter-btn" data-filter="#EBE65F"><span class="filter-color-dot" style="background:#EBE65F"></span>Floral & Fruity</button>
    </div>
    
    <div class="product-grid-collection">
'''
    
    for p in products:
        html += f'''    <div class="product-card-simple" data-color="{p["color"]}">
        <span class="product-type-badge" style="border-left: 3px solid {p["color"]}">{p["type"]}</span>
        <div class="product-image-container">
            <img src="assets/images/placeholder.svg" alt="{p["brand"]} {p["name"]}">
            <!-- Overlay for Notes -->
            <div class="notes-overlay">
                <div class="notes-title">FRAGRANCE NOTES</div>
                <div class="notes-list">
                    <div class="notes-row">
                        <span class="note-label">TOP</span>
                        <span class="note-value">{p["notes_top"]}</span>
                    </div>
                    <div class="notes-row">
                        <span class="note-label">MID</span>
                        <span class="note-value">{p["notes_middle"]}</span>
                    </div>
                    <div class="notes-row">
                        <span class="note-label">BASE</span>
                        <span class="note-value">{p["notes_base"]}</span>
                    </div>
                </div>
            </div>
        </div>
        <p class="mobile-tap-hint">Tap image for notes</p>
        <div class="product-info-simple">
            <span class="brand">{p["brand"]}</span>
            <span class="name">{p["name"]}</span>
        </div>
        <div class="product-actions">
            <a href="{p["url"]}" target="_blank" class="btn-product amazon-btn">Amazon</a>
            <a href="#" class="btn-product stripe-btn">Buy Full</a>
        </div>
    </div>
'''
    html += '</div>'
    return html

with open('/home/user/webapp/index.html', 'r') as f:
    content = f.read()

# Find the product grid section to replace
# We need to be careful with regex. The previous script replaced "product-grid-simple" with "product-grid-collection"
# So we look for product-grid-collection
pattern = r'<div class="product-grid-collection">.*?</div>'
# Also include the filter buttons if they were there (they weren't yet), but we insert them before grid.
# Actually, let's replace everything inside the container's "section-header" sibling
# The structure is: section-header -> (we want to insert filters here) -> product-grid-collection -> lineup-footer

# Let's target the whole block between section-header and lineup-footer
# But the section-header is distinct.
# Current HTML has <div class="product-grid-collection"> ... </div>
# We will replace that whole DIV with our new HTML which includes Filter Div + Grid Div

replacement = generate_html(products)

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('/home/user/webapp/index.html', 'w') as f:
    f.write(new_content)

print("Updated index.html with 17 detailed products, filters, and note overlays.")
