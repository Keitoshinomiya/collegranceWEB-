/**
 * JOURNAL Articles Database
 * 新しい記事を追加する場合は、この配列の先頭に追加するか、日付を新しくしてください。
 * 自動的にトップページや一覧ページでソートされて表示されます。
 * NOTE: 日付フォーマットは YYYY-MM-DD です。
 */
const journalArticles = [
    {
        id: 'perfume_memory_proust_effect_brain',
        date: '2026-04-15',
        category: 'KNOWLEDGE',
        title: '【香水と記憶の科学】プルースト効果とは？脳科学が解き明かす「匂い」と「思い出」の関係',
        excerpt: 'ある匂いを嗅いだ瞬間、忘れていた記憶が鮮明に蘇る。この「プルースト効果」の正体を脳科学の視点から解説。香水を「記憶のタイムカプセル」として楽しむ方法も紹介します。',
        image: 'assets/images/journal/perfume-memory-proust-effect-brain.png',
        link: 'article-perfume-memory-proust-effect-brain.html'
    },
    {
        id: 'perfume_bedtime_relaxation',
        date: '2026-04-15',
        category: 'LIFESTYLE',
        title: '【寝る前の香水】眠りの質が変わる？リラックス香水3選と安眠のための使い方',
        excerpt: '香水は「お出かけの時だけ」と思っていませんか？実は寝る前の香りが睡眠の質を劇的に変えることも。リラックス効果の高い香水3選と、安眠のための正しい使い方を紹介します。',
        image: 'assets/images/journal/perfume-bedtime-relaxation.png',
        link: 'article-perfume-bedtime-relaxation.html'
    },
    {
        id: 'perfume_gift_women_30s',
        date: '2026-04-15',
        category: 'LIFESTYLE',
        title: '【30代女性に贈る香水ギフト】本当に喜ばれるプレゼント5選と選び方のコツ',
        excerpt: '30代女性への香水プレゼント、「失敗したくない」あなたへ。香りのプロが選ぶ喜ばれる5本と、絶対に外さない選び方のルールを伝授します。ギフトラッピング対応あり。',
        image: 'assets/images/journal/perfume-gift-women-30s.png',
        link: 'article-perfume-gift-women-30s.html'
    },
    {
        id: 'musk_perfume_unisex_recommended',
        date: '2026-04-15',
        category: 'REVIEW',
        title: '【ムスク系香水おすすめ5選】男女で共有できるユニセックスムスクの世界',
        excerpt: 'ムスク系香水の魅力とおすすめ5選を紹介。「肌の匂い」と形容される柔らかいムスクから、モダンなスキンセントまで。男女で共有できるユニセックスムスクの世界を案内します。',
        image: 'assets/images/journal/musk-perfume-unisex-recommended.png',
        link: 'article-musk-perfume-unisex-recommended.html'
    },
    {
        id: 'perfume_date_women_recommended',
        date: '2026-04-15',
        category: 'LIFESTYLE',
        title: '【2026年版】デートにおすすめの香水5選｜彼の記憶に残る女性の香り',
        excerpt: 'デートで好印象を残す女性の香水選び。「いい匂いだった」と記憶に刻まれる香り5選を、シーン別・距離感別に厳選。つけ方のコツも伝授します。',
        image: 'assets/images/journal/perfume-date-women-recommended.png',
        link: 'article-perfume-date-women-recommended.html'
    },
    {
        id: 'jo_malone_blackberry_bay_review_autumn',
        date: '2026-04-15',
        category: 'REVIEW',
        title: '【Jo Malone ブラックベリー&ベイ レビュー】秋を纏う香水｜英国庭園のベリーとベイリーフの調和',
        excerpt: 'Jo Maloneブラックベリー&ベイを徹底レビュー。深く熟したブラックベリーとベイリーフが描く英国の秋。季節感のある香水をお探しの方に最適な、ナチュラルでエレガントな一本です。',
        image: 'assets/images/journal/jo-malone-blackberry-bay-review-autumn.png',
        link: 'article-jo-malone-blackberry-bay-review-autumn.html'
    },
    {
        id: 'dior_hypnotic_poison_review_seductive',
        date: '2026-04-15',
        category: 'REVIEW',
        title: '【DIOR ヒプノティック プワゾン レビュー】毒という名の誘惑｜最もセクシーなディオールの傑作',
        excerpt: 'DIORヒプノティック プワゾンを徹底レビュー。アプリコットとバニラが描く禁断の甘さ。「毒」と名付けられた伝説的フレグランスが、なぜ四半世紀を経た今も人を虜にし続けるのかを解き明かします。',
        image: 'assets/images/journal/dior-hypnotic-poison-review-seductive.png',
        link: 'article-dior-hypnotic-poison-review-seductive.html'
    },
    {
        id: 'le_labo_another_13_review_mystery',
        date: '2026-04-15',
        category: 'REVIEW',
        title: '【LE LABO アナザー13 レビュー】説明できない魅力｜ムスクの概念を覆す革新的フレグランス',
        excerpt: 'LE LABOアナザー13を徹底レビュー。アンブロキサンとジャスミンが作り出す「説明できないのに惹かれる」不思議な香り。なぜファッション業界人がこぞって愛用するのか、その秘密に迫ります。',
        image: 'assets/images/journal/le-labo-another-13-review-mystery.png',
        link: 'article-le-labo-another-13-review-mystery.html'
    },
    {
        id: 'ysl_libre_review_strong_woman',
        date: '2026-04-15',
        category: 'REVIEW',
        title: '【YSL リブレ レビュー】自由を纏う女性のための香り｜ラベンダー×バニラの革命的フレグランス',
        excerpt: 'YSLリブレを徹底レビュー。ラベンダーとバニラという意外な組み合わせが生んだ「自由」の香り。なぜ世界中の女性がこの香水に共感するのか、その秘密を解き明かします。',
        image: 'assets/images/journal/ysl-libre-review-strong-woman.png',
        link: 'article-ysl-libre-review-strong-woman.html'
    },
    {
        id: 'diptyque_orpheon_review_intellectual_woody',
        date: '2026-04-15',
        category: 'REVIEW',
        title: '【DIPTYQUE オルフェオン レビュー】知的な男のための香り｜60年代パリの劇場が生んだウッディの傑作',
        excerpt: 'DIPTYQUEオルフェオンを徹底レビュー。ジュニパーベリーとジャスミンが織りなす知的でセクシーなウッディフレグランス。60年代パリの劇場にインスパイアされた香りの魅力を紐解きます。',
        image: 'assets/images/journal/diptyque-orpheon-review-intellectual-woody.png',
        link: 'article-diptyque-orpheon-review-intellectual-woody.html'
    },
    {
        id: 'hermes_un_jardin_sur_le_nil_review_exotic',
        date: '2026-04-14',
        category: 'REVIEW',
        title: '【旅する香水】エルメス"ナイルの庭"はなぜ人を虜にするのか？グリーンマンゴーが描くエキゾチックな水辺',
        excerpt: 'エルメス「ナイルの庭」が20年近く愛され続ける理由とは？グリーンマンゴーとロータスが描くエキゾチックな水辺の世界を、香りのプロが徹底レビューします。',
        image: 'assets/images/journal/hermes-un-jardin-sur-le-nil-review-exotic.png',
        link: 'article-hermes-un-jardin-sur-le-nil-review-exotic.html'
    },
    {
        id: 'dolce_gabbana_light_blue_review_summer_citrus',
        date: '2026-04-14',
        category: 'REVIEW',
        title: '【夏の定番】ドルチェ＆ガッバーナ ライトブルーが20年以上愛され続ける理由。地中海の風を纏う爽快シトラス',
        excerpt: '発売から20年以上、夏の定番として不動の人気を誇るD&Gライトブルー。シチリアンレモンが描く地中海の爽快感と、愛され続ける3つの理由を徹底レビューします。',
        image: 'assets/images/journal/dolce-gabbana-light-blue-review-summer-citrus.png',
        link: 'article-dolce-gabbana-light-blue-review-summer-citrus.html'
    },
    {
        id: 'loewe_001_woman_review_woody_floral',
        date: '2026-04-14',
        category: 'REVIEW',
        title: '【LOEWEの隠れた名香】001ウーマンはなぜ"彼女の香り"と呼ばれるのか？甘く柔らかいウッディフローラルの魅力',
        excerpt: 'LOEWEの001ウーマンが「彼女の香り」と愛される理由とは？ベルガモット×サンダルウッド×バニラが描く、甘く柔らかいウッディフローラルの魅力を徹底レビューします。',
        image: 'assets/images/journal/loewe-001-woman-review-woody-floral.png',
        link: 'article-loewe-001-woman-review-woody-floral.html'
    },
    {
        id: 'eau_de_toilette_vs_eau_de_parfum_guide',
        date: '2026-03-13',
        category: 'KNOWLEDGE',
        title: '【一発で解決】オードトワレとオードパルファムの違い｜濃度・持続時間・選び方を完全比較',
        excerpt: 'EDT（オードトワレ）とEDP（オードパルファム）の違いを一発で解決。濃度・持続時間・価格の比較と、あなたに合うのはどちらかを診断します。',
        image: 'assets/images/journal/eau-de-toilette-vs-eau-de-parfum-guide.png',
        link: 'article-eau-de-toilette-vs-eau-de-parfum-guide.html'
    },
    {
        id: 'office_perfume_etiquette_guide',
        date: '2026-03-17',
        category: 'KNOWLEDGE',
        title: '【完全ガイド】職場での香水マナー｜オフィスで好印象を与える香りの選び方とNGライン',
        excerpt: '職場に香水をつけていくのはマナー違反？OKとNGの境界線を明確にし、オフィスで好印象を与える香りの選び方・つけ方を解説します。',
        image: 'assets/images/journal/office-perfume-etiquette-guide.png',
        link: 'article-office-perfume-etiquette-guide.html'
    },
    {
        id: 'summer_refreshing_perfume_2026',
        date: '2026-03-21',
        category: 'TREND',
        title: '【2026年夏】爽やかな香水おすすめ8選｜暑い日でも好印象を保つ香りの選び方',
        excerpt: '夏こそ香水の出番。汗と混ざっても爽やかさを保つ、夏に最適な香水を8本厳選。シトラス・マリン・グリーンティーなど、涼感を演出する香りの選び方も。',
        image: 'assets/images/journal/summer-refreshing-perfume-2026.png',
        link: 'article-summer-refreshing-perfume-2026.html'
    },
    {
        id: 'woody_mens_fragrance_popular_picks',
        date: '2026-03-25',
        category: 'REVIEW',
        title: '【大人の色気】ウッディ系メンズ香水おすすめ6選｜木の温もりが演出する知的なセクシーさ',
        excerpt: 'ウッディ系香水は「大人の男」の代名詞。サンダルウッド、シダーウッド、ベチバーなど木の香りが持つ魅力と、メンズ人気の6本を香りのプロが厳選。',
        image: 'assets/images/journal/woody-mens-fragrance-popular-picks.png',
        link: 'article-woody-mens-fragrance-popular-picks.html'
    },
    {
        id: 'perfume_too_much_how_to_fix',
        date: '2026-03-28',
        category: 'HOW TO',
        title: '【緊急対応】香水をつけすぎた！すぐにできる5つの対処法と予防テクニック',
        excerpt: '香水をつけすぎた…そんな時に焦らず対処できる方法を5つ紹介。出先でもできる応急処置と、二度と繰り返さないための予防テクニックも解説。',
        image: 'assets/images/journal/perfume-too-much-how-to-fix.png',
        link: 'article-perfume-too-much-how-to-fix.html'
    },
    {
        id: 'floral_perfume_women_recommended_2026',
        date: '2026-04-01',
        category: 'REVIEW',
        title: '【2026年版】フローラル系香水おすすめ7選｜甘すぎない大人のフローラルを厳選',
        excerpt: 'フローラル系香水は「甘すぎてちょっと…」と思っていませんか？大人の女性にこそ似合う、洗練されたフローラルフレグランスを7本厳選しました。',
        image: 'assets/images/journal/floral-perfume-women-recommended-2026.png',
        link: 'article-floral-perfume-women-recommended-2026.html'
    },
    {
        id: 'perfume_storage_tips_prevent_deterioration',
        date: '2026-04-04',
        category: 'KNOWLEDGE',
        title: '【プロ直伝】香水の正しい保管方法5選｜劣化を防いで香りを長持ちさせるコツ',
        excerpt: 'お気に入りの香水、正しく保管できていますか？光・温度・湿度が香りに与える影響と、プロが実践する5つの保管テクニックを解説します。',
        image: 'assets/images/journal/perfume-storage-tips-prevent-deterioration.png',
        link: 'article-perfume-storage-tips-prevent-deterioration.html'
    },
    {
        id: 'niche_perfume_brands_recommended',
        date: '2026-04-07',
        category: 'REVIEW',
        title: '【脱・定番】ニッチ香水ブランドおすすめ5選｜被らない香りで差をつける',
        excerpt: '人と被らない香りを探しているあなたへ。BYREDO、DIPTYQUE、LE LABOなど、知る人ぞ知るニッチフレグランスブランドの魅力と代表作をプロが厳選紹介。',
        image: 'assets/images/journal/niche-perfume-brands-recommended.png',
        link: 'article-niche-perfume-brands-recommended.html'
    },
    {
        id: 'fragrance_notes_top_middle_base_guide',
        date: '2026-04-10',
        category: 'KNOWLEDGE',
        title: '【保存版】香水のトップ・ミドル・ラストノートとは？香りの三層構造をわかりやすく解説',
        excerpt: '香水の「トップノート」「ミドルノート」「ラストノート」って何？香りが時間とともに変化する仕組みを、初心者でもわかるように図解で解説します。',
        image: 'assets/images/journal/fragrance-notes-top-middle-base-guide.png',
        link: 'article-fragrance-notes-top-middle-base-guide.html'
    },
    {
        id: 'mens_fragrance_30s_attractive',
        date: '2026-04-12',
        category: 'LIFESTYLE',
        title: '【30代メンズ必見】本当にモテる香水の選び方とは？女性が思わず振り返る3つの香り',
        excerpt: '30代男性が本当にモテるための香水選びのコツとは？「いい匂い」と思わせる距離感と、女性ウケ抜群のおすすめ香水を香りのプロが厳選して紹介します。',
        image: 'assets/images/journal/mens-fragrance-30s-attractive.png',
        link: 'article-mens-fragrance-30s-attractive.html'
    },
    {
        id: 'perfume_vending_machine_trend',
        date: '2026-03-04',
        category: 'TREND',
        title: '話題の「香水自販機」って？ワンプッシュから手軽に試せる新しい香水の選び方',
        excerpt: 'SNSで話題沸騰中の「香水自動販売機」。ワンプッシュから手軽に試せるトレンドと、失敗しない香水の選び方をご紹介します。',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
        link: 'article-perfume-vending-machine.html'
    },
    {
        id: 'nonfiction_gentle_night_review',
        date: '2026-03-04',
        category: 'REVIEW',
        title: 'NONFICTION「GENTLE NIGHT」レビュー：穏やかな夜に寄り添うスエードとシダーウッドの香り',
        excerpt: '甘く柔らかなスエードと落ち着いたシダーウッドが絶妙に絡み合う、NONFICTIONのシグネチャー「GENTLE NIGHT」の魅力に迫ります。',
        image: 'assets/images/gentle_night_1.jpg',
        link: 'article-nonfiction-gentle-night.html'
    },
    {
        id: 'byredo_gypsy_water_review',
        date: '2026-01-21',
        category: 'REVIEW',
        title: '【神秘の香り】バイレード「ジプシーウォーター」はなぜ人々を魅了するのか？甘くないバニラが描く自由な魂',
        excerpt: '【神秘の香り】BYREDO(バイレード)の一番人気「GYPSY WATER(ジプシーウォーター)」。甘くないバニラとウッディが織りなす、神秘的でジェンダーレスな香りの魅力を徹底レビュー。',
        image: 'assets/images/byredo-gypsy-water-forest-atmosphere.jpg',
        link: 'article-byredo-gypsy-water.html'
    },
    {
        id: 'diptyque_tam_dao_review',
        date: '2026-01-20',
        category: 'REVIEW',
        title: '【冬のメンズ香水決定版】ディプティック「タムダオ」のウッドが深く香る理由',
        excerpt: '【冬のメンズ香水決定版】Diptyque(ディプティック)の傑作「TAM DAO(タムダオ)」。なぜ冬に選ばれるのか？ウッド系の深みとスパイスの温もりが演出する大人の色気を徹底レビュー。',
        image: 'assets/images/diptyque-tam-dao.jpg',
        link: 'article-diptyque-tam-dao.html'
    },
    {
        id: 'olfactory_fatigue_trivia',
        date: '2025-12-16',
        category: 'TRIVIA',
        title: '【雑学】「自分の匂いが分からない」はなぜ起きる？嗅覚疲労のメカニズムとリセット方法',
        excerpt: '香水をつけた直後は香るのに、数分経つと分からなくなる現象。「鼻がバカになった？」と心配する必要はありません。これは脳の賢い機能です。コーヒー豆が香水店にある理由とともに解説します。',
        image: 'assets/images/olfactory_fatigue.jpg',
        link: 'article-olfactory-fatigue.html'
    },
    {
        id: 'scent_wardrobe_guide',
        date: '2025-12-16',
        category: 'LIFESTYLE',
        title: '【賢い選択】いきなりボトルは買わない。お試し香水で作る「香りのワードローブ」という新習慣',
        excerpt: '洋服を着替えるように、香りも毎日変えたい。でもフルボトルを何本も買うのは大変...。そんなあなたに提案したい、1.5mlサイズを組み合わせて作る「香りのワードローブ」の楽しみ方。',
        image: 'assets/images/scent_wardrobe.jpg',
        link: 'article-scent-wardrobe.html'
    },
    {
        id: 'perfume_history_trivia',
        date: '2025-12-16',
        category: 'TRIVIA',
        title: '【雑学】香水（Perfume）の語源は「煙を通す」？知っておきたい香りの歴史と意外なルーツ',
        excerpt: '普段何気なく使っている「Perfume」という言葉。実は「煙」に関係があることをご存知ですか？香水の歴史と、ナポレオンやマリー・アントワネットなど歴史上の人物と香りの意外な関係を紹介します。',
        image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=800&q=80',
        link: 'article-perfume-history.html'
    },
    {
        id: 'decorte_kimono_yui_review',
        date: '2025-12-11',
        category: 'REVIEW',
        title: '【透明感No.1】コスメデコルテ「キモノ ユイ」はモテる？酢橘とピンクペッパーの香りを徹底レビュー',
        excerpt: '「奇跡の透明感」とSNSで話題。日本の美意識を表現したコスメデコルテ「キモノ ユイ(YUI)」の評判は？酢橘の爽やかさとバニラの甘さが織りなす、男女ウケ抜群の香りを深掘り解説。',
        image: 'assets/images/kimono_yui.jpg',
        link: 'kimono_yui.html'
    },
    {
        id: 'jo_malone_nectarine_review',
        date: '2025-12-11',
        category: 'REVIEW',
        title: '【桃香水の傑作】ジョーマローン「ネクタリン ブロッサム ＆ ハニー」は男ウケする？リアルな口コミと評判',
        excerpt: 'ジョーマローン人気No.1のフルーティな香り「ネクタリン ブロッサム ＆ ハニー」。甘すぎる？若すぎる？そんな疑問に答える、大人女子のための桃香水レビュー。コンバイニングのコツも紹介。',
        image: 'assets/images/jo_malone_nectarine.jpg',
        link: 'jo_malone_nectarine.html'
    },
    {
        id: 'fragrance_trivia_rubbing',
        date: '2025-12-11',
        category: 'KNOWLEDGE',
        title: '【Journal】「手首をこすり合わせる」はNG？香りの寿命を縮める、意外なタブーと正しい作法',
        excerpt: '香水を手首につけた後、無意識にこすり合わせていませんか？実はその行動が香りのピラミッドを崩し、寿命を縮めているかもしれません。プロが教える正しい付け方と、香りを長持ちさせるテクニックを解説。',
        image: 'assets/images/fragrance_trivia.jpg',
        link: 'fragrance_trivia.html'
    },
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