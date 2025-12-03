/**
 * JOURNAL Articles Database
 * 新しい記事を追加する場合は、この配列の先頭に追加するか、日付を新しくしてください。
 * 自動的にトップページや一覧ページでソートされて表示されます。
 * NOTE: 日付フォーマットは YYYY-MM-DD です。
 */
const journalArticles = [
    {
        id: 'jazz_club_review',
        date: '2025-12-05',
        category: 'REVIEW',
        title: '【大人の色気】マルジェラ「ジャズクラブ」の香りの特徴と、似合うシーン・ファッション',
        excerpt: 'ブルックリンのジャズバーをイメージした、スモーキーで甘い香り。秋冬の夜に纏いたくなる、深みのあるダンディなフレグランスの魅力を徹底解剖。',
        image: 'assets/images/MRG-JazzClub-EDT.jpg',
        link: 'article-jazz-club-review.html'
    },
    {
        id: 'another13_review',
        date: '2025-12-04',
        category: 'REVIEW',
        title: '【中毒性あり】ルラボ「Another 13」はなぜこれほど人を惹きつけるのか？',
        excerpt: '「都会的で洗練されたムスク」。つける人によって香りが変わる不思議なスキンセント、Another 13。その唯一無二の魅力と口コミを紹介します。',
        image: 'assets/images/LLB-Another13-EDP.jpg',
        link: 'article-another13-review.html'
    },
    {
        id: 'tiffany_rosegold_review',
        date: '2025-12-03',
        category: 'REVIEW',
        title: '【ギフトに最適】ティファニー「ローズゴールド」が喜ばれる理由は？年齢層と香りの特徴',
        excerpt: 'ブラックカラントとブルーローズの透明感あふれる香り。年齢層や口コミ、プレゼントに選ばれる「夢が叶う」ストーリーを解説します。',
        image: 'assets/images/tiffany-rosegold-holiday.jpg',
        link: 'article-tiffany-rosegold.html'
    },
    {
        id: 'lazy_sunday_morning_review',
        date: '2025-12-02',
        category: 'REVIEW',
        title: '【なぜ人気？】マルジェラ「レイジーサンデーモーニング」が男女に愛される理由とリアルな口コミ',
        excerpt: 'SNSで話題の「洗い立てのシーツの香り」。男女問わず愛される理由や、実際に使って分かったメリット・デメリットを徹底解説します。',
        image: 'assets/images/lazy-sunday-morning-hero.jpg',
        link: 'article-lazy-sunday-morning.html'
    },
    {
        id: 'fragrance_basics',
        date: '2025-12-01',
        category: 'KNOWLEDGE',
        title: '【図解】香水の種類と持続時間・香りの変化（ノート）を完全解説',
        excerpt: '「パルファムとトワレの違いは？」「トップノートって何？」香水選びに役立つ基礎知識（賦香率・ピラミッド）を図解でわかりやすく紹介します。',
        image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=800&q=80',
        link: 'article-fragrance-basics.html'
    },
    {
        id: 'seasonal_trend_2025',
        date: '2025-11-30',
        category: 'TREND',
        title: '2025年春のトレンド！「お試し香水」で先取りする、桜とフローラルの新作特集',
        excerpt: 'もうすぐ春。重たいウッディから軽やかなフローラルへ衣替えしませんか？来年注目の「透明感のある桜」や「生花系フローラル」をいち早くチェック。',
        image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80',
        link: 'article-seasonal-trend.html'
    },
    {
        id: 'gift_guide',
        date: '2025-11-25',
        category: 'LIFESTYLE',
        title: '失敗しないプレゼント選び。おしゃれな「お試し香水ギフト」が喜ばれる5つの理由',
        excerpt: '香水のプレゼントはハードルが高い？いいえ、ミニサイズなら「センスがいい」と喜ばれる最高のプチギフトになります。相手に気を遣わせない贈り方のコツ。',
        image: 'https://images.unsplash.com/photo-1513116476489-7635e79feb27?auto=format&fit=crop&w=800&q=80',
        link: 'article-gift-guide.html'
    },
    {
        id: 'scent_layering',
        date: '2025-11-15',
        category: 'HOW TO',
        title: '毎日違う香りを楽しむ。「お試し香水」で叶えるシーン別使い分け＆重ね付け術',
        excerpt: 'オフィスでは清潔感のあるシトラス、デートでは甘いバニラ。シーンに合わせて香りを着替える大人の楽しみ方と、上級者向けのレイヤリング（重ね付け）レシピ。',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
        link: 'article-scent-layering.html'
    },
    {
        id: 'brand_ranking',
        date: '2025-11-05',
        category: 'RANKING',
        title: '2025年最新｜香水初心者におすすめの人気ブランドTOP5と失敗しない選び方',
        excerpt: 'マルジェラ、ジョーマローン、SHIRO...今みんなが選んでいるブランドはこれ！初めての一本で迷ったらチェックしたい、絶対にハズさない鉄板ラインナップ。',
        image: 'https://images.unsplash.com/photo-1718466044521-d38654f3ba0a?auto=format&fit=crop&w=800&q=80',
        link: 'article-brand-ranking.html'
    },
    {
        id: 'full_vs_trial',
        date: '2025-10-20',
        category: 'KNOWLEDGE',
        title: '高級香水は「お試し香水」が賢い！フルボトル購入前に知っておきたいコスパの真実',
        excerpt: '憧れのブランド香水、いきなり3万円出すのは勇気がいりますよね。1.5mlサイズなら10分の1以下の価格で、使い切れる量だけ賢く楽しめます。',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
        link: 'article-full-vs-trial.html'
    },
    {
        id: 'subscription_vs_buy',
        date: '2025-10-12',
        category: 'KNOWLEDGE',
        title: '香水サブスク vs お試し購入、どっちがお得？初心者におすすめの選び方徹底比較',
        excerpt: '毎月届くサブスクと、好きな時に買える都度払い。それぞれのメリット・デメリットを徹底比較。「解約が面倒」「量が多すぎる」という悩みもこれで解決。',
        image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80',
        link: 'article-subscription-vs-buy.html'
    },
    {
        id: 'how_to_wear',
        date: '2025-10-05',
        category: 'HOW TO',
        title: '【初心者必見】香水をつける場所と量は？つけ直しに便利なアトマイザー活用術',
        excerpt: '手首、お腹、足首など場所による香りの違いや、外出先でのスマートなつけ直しマナーを徹底解説します。',
        image: 'https://images.unsplash.com/photo-1754770343024-4ff245479610?auto=format&fit=crop&w=800&q=80',
        link: 'article-how-to-wear.html'
    },
    {
        id: 'trial_perfume',
        date: '2025-10-01',
        category: 'KNOWLEDGE',
        title: '【プロが解説】香水選びで失敗しないための「お試しサイズ」活用術',
        excerpt: '「いい香りだと思って買ったのに、家でつけると何だか違う…」そんな経験はありませんか？高級香水こそ1.5mlの小分けで試すべき3つの理由。',
        image: 'https://images.unsplash.com/photo-1654524437870-58365dea153b?auto=format&fit=crop&w=800&q=80',
        link: 'article-trial-perfume.html'
    }
];

// 外部から利用できるようにグローバルスコープに公開
window.journalArticles = journalArticles;
