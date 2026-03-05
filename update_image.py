import sys

with open("article-nonfiction-gentle-night.html", "r", encoding="utf-8") as f:
    html = f.read()

# Make sure images aren't crushed by explicitly giving them style properties 
# to override any conflicting CSS, or removing class="article-image" 
# or wrapping them in a div that preserves aspect ratio
html = html.replace(
    '<img src="https://www.genspark.ai/api/files/s/aZvyv5dv" alt="GENTLE NIGHT 香水とキャンドル" class="article-image">',
    '<img src="https://www.genspark.ai/api/files/s/aZvyv5dv" alt="GENTLE NIGHT 香水とキャンドル" style="width: 100%; height: auto; object-fit: contain; max-height: 800px; margin: 40px 0; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">'
)

html = html.replace(
    '<img src="https://www.genspark.ai/api/files/s/41gvy6Lc" alt="GENTLE NIGHT ボトルアップ" class="article-image">',
    '<img src="https://www.genspark.ai/api/files/s/41gvy6Lc" alt="GENTLE NIGHT ボトルアップ" style="width: 100%; height: auto; object-fit: contain; max-height: 800px; margin: 40px 0; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">'
)

with open("article-nonfiction-gentle-night.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Fixed image styling")
