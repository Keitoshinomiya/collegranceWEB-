import re

with open('article-byredo-blanche.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace metadata
html = re.sub(
    r'<title>.*?</title>',
    '<title>NONFICTION「GENTLE NIGHT」レビュー：穏やかな夜に寄り添うスエードとシダーウッドの香り - COLLEGRANCE</title>',
    html
)
html = re.sub(
    r'<meta name="description" content=".*?">',
    '<meta name="description" content="甘く柔らかなスエードと落ち着いたシダーウッドが絶妙に絡み合う、NONFICTIONのシグネチャー「GENTLE NIGHT」の魅力に迫る。ベッドサイドに置きたいデザインやおすすめシーンもご紹介。">',
    html
)
html = re.sub(
    r'<meta name="keywords" content=".*?">',
    '<meta name="keywords" content="コレグランス,香水,NONFICTION,ノンフィクション,GENTLE NIGHT,ジェントルナイト,レビュー">',
    html
)
html = re.sub(
    r'<link rel="canonical" href=".*?">',
    '<link rel="canonical" href="https://collegrance.com/article-nonfiction-gentle-night.html">',
    html
)

# OGP Replacements
html = re.sub(
    r'<meta property="og:title" content=".*?">',
    '<meta property="og:title" content="NONFICTION「GENTLE NIGHT」レビュー：穏やかな夜に寄り添う香り">',
    html
)
html = re.sub(
    r'<meta property="og:url" content=".*?">',
    '<meta property="og:url" content="https://collegrance.com/article-nonfiction-gentle-night.html">',
    html
)
html = re.sub(
    r'<meta property="og:image" content=".*?">',
    '<meta property="og:image" content="https://www.genspark.ai/api/files/s/aZvyv5dv">',
    html
)
html = re.sub(
    r'<meta property="og:description" content=".*?">',
    '<meta property="og:description" content="甘く柔らかなスエードと落ち着いたシダーウッドが絶妙に絡み合う、NONFICTIONのシグネチャー「GENTLE NIGHT」の魅力に迫る。ベッドサイドに置きたいデザインやおすすめシーンもご紹介。">',
    html
)

# JSON-LD BlogPosting
html = re.sub(
    r'"@id": "https://collegrance.com/article-byredo-blanche.html"',
    '"@id": "https://collegrance.com/article-nonfiction-gentle-night.html"',
    html
)
html = re.sub(
    r'"headline": ".*?"',
    '"headline": "NONFICTION「GENTLE NIGHT」レビュー：穏やかな夜に寄り添う香り"',
    html
)
html = re.sub(
    r'"image": \[.*?\]',
    '"image": ["https://www.genspark.ai/api/files/s/aZvyv5dv", "https://www.genspark.ai/api/files/s/41gvy6Lc"]',
    html, flags=re.DOTALL
)

# Replace <article> content
article_content = """<article>
        <header class="article-header">
            <div class="container">
                <span class="article-meta">REVIEW | 2026.03.04</span>
                <h1 class="article-title">NONFICTION「GENTLE NIGHT」レビュー：<br>穏やかな夜に寄り添うスエードとシダーウッドの香り</h1>
                <div class="article-meta">Reading Time: 4 mins</div>
            </div>
        </header>

        <div class="article-body">
            <img src="https://www.genspark.ai/api/files/s/aZvyv5dv" alt="GENTLE NIGHT 香水とキャンドル" class="article-image">
            
            <p>こんにちは。今回は、洗練されたパッケージと独特の香りで人気を集めているライフスタイルビューティーブランド「NONFICTION（ノンフィクション）」から、シグネチャーとも言える香り「<strong>GENTLE NIGHT（ジェントルナイト）</strong>」をご紹介します。</p>

            <h2>GENTLE NIGHTが織りなす香りのストーリー</h2>
            <p>「GENTLE NIGHT」は、その名の通り「穏やかな夜」を連想させる、どこかミステリアスでありながら温かみのある香りです。</p>
            <p>甘く柔らかなスエードの香りと、落ち着きのあるシダーウッドが絶妙に絡み合い、ベースに潜むバニラとムスクがふんわりと肌に馴染みます。決して主張しすぎず、それでいて確かな存在感を放つ、非常にバランスの取れたジェンダーレスな香りとなっています。</p>

            <img src="https://www.genspark.ai/api/files/s/41gvy6Lc" alt="GENTLE NIGHT ボトルアップ" class="article-image">

            <h2>空間を彩る、アートのようなデザイン</h2>
            <p>NONFICTIONの魅力は、香りそのものだけでなく、日常の空間を格上げしてくれるデザイン性の高さにもあります。クラシカルでありながらモダンなタイポグラフィが施されたボトルは、ベッドサイドやドレッサーに置くだけで一つのインテリアとして成立します。</p>
            <p>キャンドルの揺らめく灯りとともに、一日の終わりにワンプッシュ。それだけで、いつもの部屋が上質なリラックス空間へと早変わりします。</p>

            <h2>こんなシーン・こんな方におすすめ</h2>
            <ul>
                <li><strong>就寝前のリラックスタイムに：</strong> 読書や音楽を楽しみながら、一日の疲れを癒やすお供として。</li>
                <li><strong>特別なディナーやデートに：</strong> 甘すぎないウッディムスクが、大人びたさりげない色気を演出します。</li>
                <li><strong>集中したいお家時間に：</strong> 心を落ち着かせるシダーウッドの香りが、作業や仕事の効率を高めてくれるかもしれません。</li>
            </ul>

            <div class="call-to-action" style="margin-top: 40px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; text-align: center;">
                <h3 style="margin-top: 0;">編集部まとめ</h3>
                <p style="margin-bottom: 0;">NONFICTIONの「GENTLE NIGHT」は、単なる「良い香り」を超えて、まとう人の心に静けさと平穏をもたらしてくれる特別なフレグランスです。<br>忙しい現代だからこそ、自分と向き合う静かな夜の時間を大切にしたい。そんな方にぜひ手に取っていただきたい、心に寄り添う名香です。</p>
            </div>
        </div>
    </article>"""

html = re.sub(r'<article>.*?</article>', article_content, html, flags=re.DOTALL)

with open('article-nonfiction-gentle-night.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Created article-nonfiction-gentle-night.html")
