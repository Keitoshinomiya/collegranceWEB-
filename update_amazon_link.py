import sys

with open("article-nonfiction-gentle-night.html", "r", encoding="utf-8") as f:
    html = f.read()

amazon_button_html = """
            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="https://amzn.asia/d/0bRx9eAd" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #222; color: #fff; padding: 16px 48px; border-radius: 4px; text-decoration: none; font-weight: 500; font-size: 16px; letter-spacing: 1px; transition: opacity 0.3s;">
                    Amazonで詳細を見る
                </a>
            </div>
        </div>
    </article>"""

# Replace the end of the article-body
html = html.replace('</div>\n        </div>\n    </article>', '</div>\n' + amazon_button_html)

with open("article-nonfiction-gentle-night.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Added Amazon link button")
