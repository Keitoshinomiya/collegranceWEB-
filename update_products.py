
import re

products = [
    {
        "brand": "Maison Margiela",
        "name": "Lazy Sunday Morning",
        "type": "EDT",
        "notes": "Pear / Iris / White Musk",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "HERMÈS",
        "name": "Un Jardin sur le Nil",
        "type": "EDT",
        "notes": "Green Mango / Lotus / Sycamore",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "Maison Margiela",
        "name": "Jazz Club",
        "type": "EDT",
        "notes": "Pink Pepper / Rum / Tobacco",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "DIPTYQUE",
        "name": "Orpheon",
        "type": "EDP",
        "notes": "Juniper Berry / Cedar / Tonka",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "Jo Malone London",
        "name": "English Pear & Freesia",
        "type": "Cologne",
        "notes": "Pear / Freesia / Patchouli",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "LE LABO",
        "name": "Another 13",
        "type": "EDP",
        "notes": "Ambroxan / Jasmine / Moss",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "BYREDO",
        "name": "Blanche",
        "type": "EDP",
        "notes": "White Rose / Violet / Sandalwood",
        "url": "https://www.amazon.co.jp/dp/B0FRG5XX2Q"
    },
    {
        "brand": "Calvin Klein",
        "name": "ck one",
        "type": "EDT",
        "notes": "Bergamot / Green Tea / Musk",
        "url": "https://www.amazon.co.jp/dp/B0FSKMB6HR"
    },
    {
        "brand": "DIOR",
        "name": "Hypnotic Poison",
        "type": "EDT",
        "notes": "Almond / Jasmine / Vanilla",
        "url": "https://www.amazon.co.jp/dp/B0FSKNF4QC"
    },
    {
        "brand": "DIOR",
        "name": "Sauvage",
        "type": "EDT",
        "notes": "Bergamot / Pepper / Ambroxan",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "ISSEY MIYAKE",
        "name": "L'Eau d'Issey",
        "type": "EDT",
        "notes": "Lotus / Rose / Precious Woods",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "LOEWE",
        "name": "001 Woman",
        "type": "EDP",
        "notes": "Bergamot / Sandalwood / Jasmine",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "TIFFANY & CO.",
        "name": "Rose Gold",
        "type": "EDP",
        "notes": "Blackcurrant / Blue Rose / Iris",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "YSL",
        "name": "LIBRE",
        "type": "EDP",
        "notes": "Lavender / Orange Blossom / Vanilla",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "DIPTYQUE",
        "name": "Fleur de Peau",
        "type": "EDP",
        "notes": "Aldehydes / Iris / Musk",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "SHIRO",
        "name": "Savon",
        "type": "EDP",
        "notes": "Lemon / Rose / Musk",
        "url": "http://www.amazon.co.jp/collegrance"
    },
    {
        "brand": "TOM FORD",
        "name": "Oud Wood",
        "type": "EDP",
        "notes": "Rare Oud / Sandalwood / Pepper",
        "url": "http://www.amazon.co.jp/collegrance"
    }
]

def generate_product_html(products):
    html = '<div class="product-grid-collection">\n'
    for p in products:
        html += f'''    <div class="product-card-simple">
        <span class="product-type-badge">{p["type"]}</span>
        <img src="assets/images/placeholder.svg" alt="{p["brand"]} {p["name"]}">
        <div class="product-info-simple">
            <span class="brand">{p["brand"]}</span>
            <span class="name">{p["name"]}</span>
            <span class="notes" style="display:block; font-size:0.7rem; color:#999; margin-top:5px;">{p["notes"]}</span>
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

# Find the product grid section
# It currently has class="product-grid-simple"
pattern = r'<div class="product-grid-simple">.*?</div>\s+<div class="lineup-footer">'
replacement = generate_product_html(products) + '\n            <div class="lineup-footer">'

# Use DOTALL to match across newlines
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('/home/user/webapp/index.html', 'w') as f:
    f.write(new_content)

print("Updated index.html with 17 products and placeholder images.")
