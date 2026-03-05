import sys

with open("assets/js/articles.js", "r", encoding="utf-8") as f:
    content = f.read()

new_article = """    {
        id: 'perfume_vending_machine_trend',
        date: '2026-03-04',
        category: 'TREND',
        title: '話題の「香水自販機」って？ワンプッシュから手軽に試せる新しい香水の選び方',
        excerpt: 'SNSで話題沸騰中の「香水自動販売機」。ワンプッシュから手軽に試せるトレンドと、失敗しない香水の選び方をご紹介します。',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
        link: 'article-perfume-vending-machine.html'
    },
"""

# Insert right after `const journalArticles = [`
updated_content = content.replace('const journalArticles = [\n', 'const journalArticles = [\n' + new_article)

with open("assets/js/articles.js", "w", encoding="utf-8") as f:
    f.write(updated_content)

print("Updated articles.js with vending machine article")
