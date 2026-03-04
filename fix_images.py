import sys

with open("article-nonfiction-gentle-night.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace the broken image URLs and inline styles with local paths and standard class
html = html.replace(
    '<img src="https://www.genspark.ai/api/files/s/aZvyv5dv" alt="GENTLE NIGHT 香水とキャンドル" style="width: 100%; height: auto; object-fit: contain; max-height: 800px; margin: 40px 0; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">',
    '<img src="assets/images/gentle_night_1.jpg" alt="GENTLE NIGHT 香水とキャンドル" class="article-image">'
)

html = html.replace(
    '<img src="https://www.genspark.ai/api/files/s/41gvy6Lc" alt="GENTLE NIGHT ボトルアップ" style="width: 100%; height: auto; object-fit: contain; max-height: 800px; margin: 40px 0; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">',
    '<img src="assets/images/gentle_night_2.jpg" alt="GENTLE NIGHT ボトルアップ" class="article-image">'
)

# Also update the OGP and Structured Data links if needed, though they usually expect absolute URLs. 
# For now, let's just make the article-body work.

with open("article-nonfiction-gentle-night.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Updated article html")

# Update articles.js to use the local image as well
with open("assets/js/articles.js", "r", encoding="utf-8") as f:
    js_content = f.read()

js_content = js_content.replace(
    "image: 'https://www.genspark.ai/api/files/s/aZvyv5dv',",
    "image: 'assets/images/gentle_night_1.jpg',"
)

with open("assets/js/articles.js", "w", encoding="utf-8") as f:
    f.write(js_content)
    
print("Updated articles.js")
