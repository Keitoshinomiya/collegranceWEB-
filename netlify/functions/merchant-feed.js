// Google Merchant Center 用の商品データ（TSV）。2026-11-17 作成。
// URL: https://collegrance.com/feeds/google-merchant.tsv （_redirects でこの関数へ。netlify.toml より _redirects が先に効く）
// 写真は images.collegrance.com を直接指す（/assets/images/ は Cloudflare へ302転送しているため）
// data/samples.json・products.json・data/gift-set.json から毎回作るので、価格・品切れの変更は自動で反映される。
//
// 載せるもの：サイトで買えるお試し1.5mL（品切れは out_of_stock）と、選べる3本ギフトセット。
// 載せないもの：フルボトル（詳細画面に値段が複数並び、価格の照合で落ちやすいため・後で検討）、
//   EXCLUDE_BRANDS のブランド（2026-11 Amazonでマルジェラ系が停止されたため、申し立てのリスクを避ける）、写真の無い香り。
// 表記ルール（2026-11-09）：「正規品」と書かない。並行輸入品・当社が独自に詰め替え・ブランドとは無関係、を説明文に書く。
const SITE = 'https://collegrance.com';
const EXCLUDE_BRANDS = [/margiela/i];
const CATEGORY_PERFUME = '479'; // Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne

let PRODUCTS = [], SAMPLES = { items: {} }, GIFT = null;
try { PRODUCTS = require('../../products.json'); } catch (e) { console.error('[feed] products.json', e.message); }
try { SAMPLES = require('../../data/samples.json'); } catch (e) { console.error('[feed] samples.json', e.message); }
try { GIFT = require('../../data/gift-set.json'); } catch (e) { console.error('[feed] gift-set.json', e.message); }

const clean = (s) => String(s == null ? '' : s).replace(/[\t\r\n]+/g, ' ').trim();
const COLS = ['id', 'title', 'description', 'link', 'image_link', 'availability', 'price', 'brand', 'condition',
  'identifier_exists', 'google_product_category', 'product_type', 'shipping', 'custom_label_0'];

function bundleText() {
  const t = (SAMPLES.bundle || []);
  if (!t.length) return '';
  return t.map((x, i) => x.min + '本' + (i === t.length - 1 ? '以上' : '') + 'で' + Math.round(x.rate * 100) + '%').join('・') + '引き。';
}

function rows() {
  const out = [];
  const byId = new Map(PRODUCTS.map((p) => [String(p.id), p]));
  Object.keys(SAMPLES.items || {}).forEach((sid) => {
    const c = SAMPLES.items[sid];
    const p = byId.get(String(sid));
    if (!p || !c || !c.img) return;
    if (EXCLUDE_BRANDS.some((re) => re.test(p.brand || ''))) return;
    const price = p.samplePrice;
    if (!price) return;
    const nm = (p.nameJa || p.name);
    const conc = p.concentration ? ' ' + p.concentration : '';
    out.push({
      id: 'sample-' + sid,
      title: 'お試し香水 1.5mL 原材料：' + p.brand + ' ' + nm + conc + ' | COLLEGRANCE',
      description: 'COLLEGRANCEのお試し香水1.5mL（1回1プッシュで約20〜25回分）。並行輸入品の' + p.brand + '「' + nm + '」' + conc.trim()
        + 'を、当社（合同会社ヤシノミ）が自社の製造所で独自に1.5mLへ詰め替えた商品です。ブランドとは関係ありません。'
        + '全品送料無料。お試しはまとめ買いで' + bundleText() + '＋300円で香水ケース付き（12色）も選べます。',
      link: SITE + '/?from=recommend&product=' + sid + '&utm_source=google&utm_medium=shopping&utm_campaign=merchant',
      image_link: 'https://images.collegrance.com/' + c.img + '.jpg',
      availability: c.soldOut ? 'out_of_stock' : 'in_stock',
      price: price + ' JPY',
      brand: 'COLLEGRANCE',
      condition: 'new',
      identifier_exists: 'no',
      google_product_category: CATEGORY_PERFUME,
      product_type: '香水 > お試し香水 1.5mL',
      shipping: 'JP:::0 JPY',
      custom_label_0: 'sample'
    });
  });
  if (GIFT && GIFT.basePrice) {
    out.push({
      id: 'giftset-' + (GIFT.productId || 9001),
      title: '選べる3本ギフトセット お試し香水1.5mL×3本・香水ケース・コットンポーチ・メッセージカード | COLLEGRANCE',
      description: '香りの好みが分からない人に、3つ試せる香水ギフト。お試し香水1.5mLを3本（香りは選べます）、香水ケース1個（12色）、ロゴ入りコットンポーチ、印字メッセージカードをギフト包装でお届けします。'
        + '香水は並行輸入品を当社（合同会社ヤシノミ）が独自に詰め替えたもので、ブランドとは関係ありません。送料込み・金額の分かる明細なし・ポストに届くネコポス。価格は香りの組み合わせで変わります（最安' + GIFT.basePrice + '円）。',
      link: SITE + '/gift-set.html?utm_source=google&utm_medium=shopping&utm_campaign=merchant',
      image_link: 'https://images.collegrance.com/assets/images/gift/gift_contents.jpg',
      availability: GIFT.soldOut ? 'out_of_stock' : 'in_stock',
      price: GIFT.basePrice + ' JPY',
      brand: 'COLLEGRANCE',
      condition: 'new',
      identifier_exists: 'no',
      google_product_category: CATEGORY_PERFUME,
      product_type: '香水 > ギフトセット',
      shipping: 'JP:::0 JPY',
      custom_label_0: 'giftset'
    });
  }
  return out;
}

exports.handler = async () => {
  const lines = [COLS.join('\t')].concat(rows().map((r) => COLS.map((k) => clean(r[k])).join('\t')));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/tab-separated-values; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    body: lines.join('\n') + '\n'
  };
};
