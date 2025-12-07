import os
import datetime

# Configuration
BASE_URL = "https://collegrance.com/"
OUTPUT_FILE = "sitemap.xml"
SOURCE_DIR = "."

# Files to exclude (partials, old versions, or internal tools)
EXCLUDE_FILES = {
    "megamenu_fragment.html",
    "ranking_content.html",
    "clean_nav_menu.html",
    "new_nav_menu.html",
    "blog_preview_final.html",
    "preview.html",
    "journal_section.html",
    "404.html", # if exists
    "google.html", # verify files
}

# Priority map
PRIORITY_MAP = {
    "index.html": "1.0",
    "product-list.html": "0.9",
    "brand-story.html": "0.8",
    "journal.html": "0.8",
    "contact.html": "0.7",
    "tokushoho.html": "0.5"
}

DEFAULT_PRIORITY = "0.6"

# Frequency map
FREQ_MAP = {
    "index.html": "daily",
    "product-list.html": "weekly",
    "journal.html": "weekly",
}

DEFAULT_FREQ = "monthly"

def generate_sitemap():
    urls = []
    
    # Get all HTML files
    files = [f for f in os.listdir(SOURCE_DIR) if f.endswith(".html")]
    files.sort()

    current_date = datetime.date.today().strftime("%Y-%m-%d")

    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for filename in files:
        if filename in EXCLUDE_FILES:
            continue
            
        # Calculate priority
        priority = PRIORITY_MAP.get(filename, DEFAULT_PRIORITY)
        
        # Specific handling for articles
        if filename.startswith("article-"):
            priority = "0.7"
            
        # Calculate changefreq
        changefreq = FREQ_MAP.get(filename, DEFAULT_FREQ)
        
        # URL construction
        if filename == "index.html":
            loc = BASE_URL
        else:
            loc = BASE_URL + filename

        xml_content += '  <url>\n'
        xml_content += f'    <loc>{loc}</loc>\n'
        xml_content += f'    <lastmod>{current_date}</lastmod>\n'
        xml_content += f'    <changefreq>{changefreq}</changefreq>\n'
        xml_content += f'    <priority>{priority}</priority>\n'
        xml_content += '  </url>\n'

    xml_content += '</urlset>'

    with open(OUTPUT_FILE, "w") as f:
        f.write(xml_content)
    
    print(f"Generated {OUTPUT_FILE} with {len(files)} files scanned.")

if __name__ == "__main__":
    generate_sitemap()
