import sys

with open("assets/js/articles.js", "r", encoding="utf-8") as f:
    content = f.read()

new_article = """    {
        id: 'nonfiction_gentle_night_review',
        date: '2026-03-04',
        category: 'REVIEW',
        title: 'NONFICTION「GENTLE NIGHT」レビュー：穏やかな夜に寄り添うスエードとシダーウッドの香り',
        excerpt: '甘く柔らかなスエードと落ち着いたシダーウッドが絶妙に絡み合う、NONFICTIONのシグネチャー「GENTLE NIGHT」の魅力に迫ります。',
        image: 'https://www.genspark.ai/api/files/s/aZvyv5dv',
        link: 'article-nonfiction-gentle-night.html'
    },
"""

# Insert right after `const journalArticles = [`
updated_content = content.replace('const journalArticles = [\n', 'const journalArticles = [\n' + new_article)

with open("assets/js/articles.js", "w", encoding="utf-8") as f:
    f.write(updated_content)

print("Updated articles.js")
