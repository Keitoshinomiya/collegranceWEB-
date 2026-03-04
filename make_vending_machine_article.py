import re

with open('article-brand-ranking.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace metadata
html = re.sub(
    r'<title>.*?</title>',
    '<title>話題の「香水自販機」って？ワンプッシュから手軽に試せる新しい香水の選び方 - COLLEGRANCE</title>',
    html
)
html = re.sub(
    r'<meta name="description" content=".*?">',
    '<meta name="description" content="SNSで話題沸騰中の「香水自動販売機」。ワンプッシュから手軽にハイブランドの香水を試せる新しいトレンドと、失敗しない香水の選び方、そして小分けサービスの魅力をご紹介します。">',
    html
)
html = re.sub(
    r'<meta name="keywords" content=".*?">',
    '<meta name="keywords" content="コレグランス,香水,自販機,自動販売機,ワンプッシュ,お試し,小分け,トレンド">',
    html
)
html = re.sub(
    r'<link rel="canonical" href=".*?">',
    '<link rel="canonical" href="https://collegrance.com/article-perfume-vending-machine.html">',
    html
)

# OGP Replacements
html = re.sub(
    r'<meta property="og:title" content=".*?">',
    '<meta property="og:title" content="話題の「香水自販機」って？ワンプッシュから手軽に試せる新しい選び方">',
    html
)
html = re.sub(
    r'<meta property="og:url" content=".*?">',
    '<meta property="og:url" content="https://collegrance.com/article-perfume-vending-machine.html">',
    html
)
html = re.sub(
    r'<meta property="og:image" content=".*?">',
    '<meta property="og:image" content="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80">',
    html
)
html = re.sub(
    r'<meta property="og:description" content=".*?">',
    '<meta property="og:description" content="SNSで話題沸騰中の「香水自動販売機」。ワンプッシュから手軽にハイブランドの香水を試せる新しいトレンドと、失敗しない香水の選び方、そして小分けサービスの魅力をご紹介します。">',
    html
)

# JSON-LD BlogPosting
html = re.sub(
    r'"@id": "https://collegrance.com/article-brand-ranking.html"',
    '"@id": "https://collegrance.com/article-perfume-vending-machine.html"',
    html
)
html = re.sub(
    r'"headline": ".*?"',
    '"headline": "話題の「香水自販機」って？ワンプッシュから手軽に試せる新しい選び方"',
    html
)

# Build the new article content
article_content = """<article>
        <header class="article-header">
            <div class="container">
                <span class="article-meta">TREND | 2026.03.04</span>
                <h1 class="article-title">話題の「香水自販機」って？<br>ワンプッシュから手軽に試せる新しい香水の選び方</h1>
                <div class="article-meta">Reading Time: 5 mins</div>
            </div>
        </header>

        <div class="article-body">
            <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80" alt="香水のボトル" class="article-image" style="width: 100%; height: 400px; object-fit: cover; border-radius: 4px;">
            
            <p>最近、TikTokやInstagramなどのSNSで<strong>「香水の自動販売機」</strong>が話題になっているのをご存知ですか？</p>
            <p>街中や商業施設の一角に設置され、ハイブランドからニッチフレグランスまで、気になる香りを「ワンプッシュ」から手軽に試せるという画期的なサービスです。今回は、この新しい香水体験のトレンドと、そこから見えてくる「現代の賢い香水の選び方」について深掘りしていきます。</p>

            <h2>なぜ今「香水自販機」が人気なのか？</h2>
            
            <h3>1. 店頭での「試香ハードル」をクリア</h3>
            <p>百貨店のコスメカウンターや専門店で香水を試す際、「美容部員さんに声をかけられるのが少し苦手」「買わずに帰るのが申し訳ない」と感じる方は少なくありません。</p>
            <p>自販機であれば、対面でのやり取りが一切不要。自分のペースで、周りの目を気にすることなく気になる香りを試すことができます。</p>

            <h3>2. 数百円からハイブランドを体験</h3>
            <p>フルボトルで購入すると数万円するようなラグジュアリーブランドの香水でも、自販機のワンプッシュなら数百円〜千円程度で試すことが可能です。手の届きにくい香りでも、「まずは一度だけ肌に乗せてみる」という体験が手軽に買えるのが最大の魅力です。</p>

            <h3>3. 「ムエット（試香紙）」ではなく「肌」で試せる</h3>
            <p>香水は、紙（ムエット）に出した時と、実際に自分の肌に乗せた時とで香りの立ち方が大きく変わります（体温や皮脂と混ざるため）。自販機でワンプッシュ分を購入し、手首につけて1日過ごしてみることで、トップノートからラストノートまでの「自分だけの香りの変化」を正確に確かめることができます。</p>

            <img src="https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80" alt="香水をつける様子" class="article-image" style="width: 100%; height: 400px; object-fit: cover; border-radius: 4px;">

            <h2>ワンプッシュの「次」はどうする？</h2>
            <p>自販機で「この香り、好きかも！」と思っても、すぐに数万円のフルボトルを買うのはまだ少しリスキーかもしれません。「ワンプッシュの時は良かったけれど、毎日つけると少し重たく感じる」といった、“香水あるある”の失敗を防ぐためにはどうすれば良いのでしょうか。</p>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 40px 0;">
                <h3 style="margin-top: 0; color: #333; text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 15px;">おすすめのステップアップ法</h3>
                <ul style="margin-top: 20px;">
                    <li style="margin-bottom: 15px;"><strong>Step 1 : 自販機・店頭で試す</strong><br>まずは直感で気になるものをワンプッシュ肌に乗せ、数時間後の香りの変化（ラストノート）まで確認する。</li>
                    <li style="margin-bottom: 15px;"><strong>Step 2 : お試しサイズ（アトマイザー）で数日過ごす</strong><br>数日〜数週間使える「小分け（量り売り）」や「ミニサイズ」を入手し、日常生活の中で香りが浮かないか、周りの反応はどうかを確かめる。</li>
                    <li style="margin-bottom: 0;"><strong>Step 3 : フルボトルを購入する</strong><br>「これなら最後まで使い切れる！」「自分のシグネチャーにしたい！」と確信できたら、フルボトルを迎える。</li>
                </ul>
            </div>

            <h2>COLLEGRANCEが提案する「新しい香水体験」</h2>
            <p>「香水自販機」が象徴するように、現代の香水選びは<strong>「いきなりボトル買い」から「まずは少しだけ試す」</strong>スタイルへと完全にシフトしています。</p>
            <p>私たちCOLLEGRANCE（コレグランス）も、まさにこの思想を大切にしています。憧れのブランド香水を、使い切りやすい少量サイズでお届けすることで、「買ったけれど使わなかった」という香水ロスをなくし、より多くの方が自由に、そして気軽に香りの着替えを楽しめる世界を目指しています。</p>

            <p>自販機で運命的な香りに出会えたら、次はぜひCOLLEGRANCEのアトマイザーで「日常使いのテスト」をしてみてください。あなたの毎日を少しだけ特別にしてくれる、本物の「運命の香り」がきっと見つかるはずです。</p>

            <div class="call-to-action" style="margin-top: 50px; padding: 30px; background-color: #222; color: #fff; border-radius: 8px; text-align: center;">
                <h3 style="margin-top: 0; color: #fff;">気になる香りを、まずは少量から。</h3>
                <p style="margin-bottom: 20px; color: #ddd;">COLLEGRANCEでは、人気のブランド香水を約30〜40プッシュ使えるアトマイザーサイズでお届けしています。</p>
                <a href="product-list.html" style="display: inline-block; background-color: #fff; color: #222; padding: 15px 40px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 16px; transition: opacity 0.3s;">商品一覧を見る</a>
            </div>
        </div>
    </article>"""

html = re.sub(r'<article>.*?</article>', article_content, html, flags=re.DOTALL)

with open('article-perfume-vending-machine.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Created article-perfume-vending-machine.html")
