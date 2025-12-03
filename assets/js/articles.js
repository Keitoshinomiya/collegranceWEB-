
/**
 * JOURNAL Articles Database
 * 新しい記事を追加する場合は、この配列の先頭に追加するか、日付を新しくしてください。
 * 自動的にトップページや一覧ページでソートされて表示されます。
 */
const journalArticles = [
    {
        id: 'seasonal_trend_2025',
        date: '2025-11-30',
        category: 'TREND',
        title: '2025年春のトレンド！「お試し香水」で先取りする、桜とフローラルの新作特集',
        excerpt: 'もうすぐ春。重たいウッディから軽やかなフローラルへ衣替えしませんか？今年注目の「透明感のある桜」や「生花系フローラル」をいち早くチェック。',
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
        id: 'tiffany_rosegold',
        date: '2025-11-15',
        category: 'REVIEW',
        title: '【ギフトに最適】ティファニー「ローズゴールド」が喜ばれる理由は？年齢層と香りの特徴',
        excerpt: 'ティファニーらしい透明感と輝きのあるローズの香り。甘すぎず、凛とした上品さがあり、自分に自信を与えてくれる一本です。',
        image: 'assets/images/tiffany-rosegold-holiday.jpg',
        link: 'article-tiffany-rosegold.html'
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
        id: 'brand_ranking',
        date: '2025-10-05',
        category: 'RANKING',
        title: '【2025最新】今売れている人気ブランド香水ランキングTOP10',
        excerpt: 'マルジェラ、ディプティック、ルラボ...今本当に支持されているブランドは？売上データから算出したリアルな人気ランキングを発表。',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80',
        link: 'article-brand-ranking.html'
    },
    {
        id: 'fragrance_basics',
        date: '2025-09-15',
        category: 'KNOWLEDGE',
        title: '【初心者必見】オードトワレとオードパルファムの違いは？香水の基本知識',
        excerpt: '香水の種類や付け方、保存方法など、知っているようで知らない香水の基本をわかりやすく解説します。',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
        link: 'article-fragrance-basics.html'
    }
];

// 外部から利用できるようにグローバルスコープに公開（モジュールシステムを使っていないため）
window.journalArticles = journalArticles;
