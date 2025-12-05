/**
 * JOURNAL Articles Database
 * 新しい記事を追加する場合は、この配列の先頭に追加するか、日付を新しくしてください。
 * 自動的にトップページや一覧ページでソートされて表示されます。
 * NOTE: 日付フォーマットは YYYY-MM-DD です。
 */
const journalArticles = [
    {
        id: 'ck_one_review',
        date: '2025-12-05',
        category: 'REVIEW',
        title: '【永遠の定番】CK-ONE(シーケーワン)が30年愛され続ける理由。ジェンダーレス香水の金字塔を再評価',
        excerpt: '発売から30年経っても色褪せないCalvin Klein「CK-ONE」。世界初のユニセックス香水として歴史を変えた名香の魅力、シトラスノートの特徴、現代にこそ響くジェンダーレスな価値を再レビューします。',
        image: 'assets/images/ck-one-review.jpg',
        link: 'article-ck-one.html'
    },
    {
        id: 'byredo_blanche_review',
        date: '2025-12-05',
        category: 'REVIEW',
        title: '【純白の香り】BYREDO(バイレード)「ブランシュ」の魅力とは？"洗い立てのシーツ"を超える、究極の清潔感',
        excerpt: 'BYREDO(バイレード)のアイコン的香水「BLANCHE(ブランシュ)」。白という色を香りで表現した、透明感あふれるアルデヒドとホワイトローズの香り。マルジェラとの違いや評判を徹底レビュー。',
        image: 'assets/images/byredo-blanche-review.jpg',
        link: 'article-byredo-blanche.html'
    },
    {
        id: 'perfume_expiry_guide',
        date: '2025-12-05',
        category: 'KNOWLEDGE',
        title: '【香水の消費期限】未開封・開封後はいつまで使える？プロが教える「香りを劣化させない」3つの正しい保管方法',
        excerpt: '香水にも消費期限はあるの？開封後1年、未開封3年説の真実と、香りが劣化した時のサイン（変色・異臭）。冷蔵庫保管はNG？プロが実践する、お気に入りの香水を長く楽しむための正しい保管場所とルールを解説。',
        image: 'assets/images/perfume-storage-guide.jpg',
        link: 'article-perfume-expiry.html'
    },
    {
        id: 'diptyque_fleur_de_peau_review',
        date: '2025-12-04',
        category: 'REVIEW',
        title: '【K-POPアイドルも虜に】Diptyque「フルール ドゥ ポー」はなぜ"伝説"なのか？肌に溶け込む究極のムスクを徹底レビュー',
        excerpt: 'TXTのヨンジュンなど、人気K-POPアイドルも愛用するDiptyque(ディプティック)の「フルール ドゥ ポー」。肌そのものが美しく香るような「究極のムスク」の魅力、香りの特徴、おすすめの使い方を徹底レビュー。',
        image: 'assets/images/blog_image_fleur_de_peau.jpg',
        link: 'article-diptyque-fleur-de-peau.html'
    },
    {
        id: 'dior_sauvage_review',
        date: '2025-12-04',
        category: 'REVIEW',
        title: '【メンズ香水の頂点】Dior「ソヴァージュ」が世界を魅了する理由。"野生"と"気品"が同居する最強のモテ香水',
        excerpt: 'ジョニー・デップのCMでおなじみ、Dior「ソヴァージュ」。世界で最も売れているメンズ香水の人気の秘密、香りの特徴、そして「つけすぎ注意」を防ぐプロのテクニックまで徹底解説します。',
        image: 'assets/images/blog_image_sauvage.jpg',
        link: 'article-dior-sauvage.html'
    },
    {
        id: 'skin_diagnosis_guide',
        date: '2025-12-04',
        category: 'KNOWLEDGE',
        title: '【肌質診断】乾燥肌には「バニラ」、体温高めなら「シトラス」？プロが教える「肌質別」香水選びの正解',
        excerpt: '「香りの持ちが悪い」「重たく感じる」その原因は肌質かも？乾燥肌・脂性肌・体温高め・低め、それぞれのタイプに合う香水選びの法則をプロが解説します。',
        image: 'assets/images/blog_image.jpg',
        link: 'article-skin-diagnosis.html'
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
