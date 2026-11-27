// 前回と同じ香りをカートに入れる入口（2026-11-27）
//   LINE から https://collegrance.com/.netlify/functions/reorder?f=<友だち番号> を開く
//   → Stripe で、その友だち番号の直近の決済（成功）を探す → 商品行から「お試し（ケース色つき）・フルボトル」を取り出す
//   → https://collegrance.com/?ro=<s30.2_s12KRO.1_15.1>&lfid=<友だち番号> へ転送（サイトがカートに入れて開く）
//   ギフトセットは中身の組み合わせが特殊なので対象外。見つからなければ ?ro=none（サイトが「前回のご注文が見つかりませんでした」と出す）
//   返すのは商品の番号と本数だけ（住所・名前などは返さない）。友だち番号は推測できないUUID
const SITE = 'https://collegrance.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function stripe(path, key) {
  const r = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + key } });
  if (!r.ok) throw new Error('stripe ' + r.status);
  return r.json();
}

function go(qs) {
  return { statusCode: 302, headers: { Location: SITE + '/?' + qs, 'Cache-Control': 'no-store' }, body: '' };
}

exports.handler = async (event) => {
  const f = String((event.queryStringParameters || {}).f || '').toLowerCase();
  const utm = 'utm_source=line&utm_medium=reorder&utm_campaign=reorder';
  if (!UUID.test(f)) return go('ro=none&' + utm);
  const key = process.env.STRIPE_SECRET_KEY;
  try {
    const q = encodeURIComponent(`metadata['line_friend_id']:'${f}' AND status:'succeeded'`);
    const pis = await stripe(`payment_intents/search?query=${q}&limit=10`, key);
    const list = (pis.data || []).sort((a, b) => b.created - a.created);
    for (const pi of list) {
      const ss = await stripe(`checkout/sessions?payment_intent=${pi.id}&limit=1`, key);
      const s = (ss.data || [])[0];
      if (!s) continue;
      const li = await stripe(`checkout/sessions/${s.id}/line_items?limit=100&expand[]=data.price.product`, key);
      const toks = [];
      for (const it of li.data || []) {
        const md = (it.price && it.price.product && it.price.product.metadata) || {};
        const id = parseInt(md.collegrance_product_id, 10);
        if (!id) continue; // ギフトセット・ラッピング・送料などは入れない
        const qty = Math.min(Math.max(it.quantity || 1, 1), 20);
        if (md.variant === 'sample') toks.push('s' + id + (/^[A-Z]{3}$/.test(md.case || '') ? md.case : '') + '.' + qty);
        else toks.push(id + '.' + qty);
      }
      if (toks.length) return go('ro=' + toks.slice(0, 20).join('_') + '&lfid=' + f + '&' + utm);
    }
    return go('ro=none&lfid=' + f + '&' + utm);
  } catch (e) {
    console.error('[reorder]', e.message);
    return go('ro=none&lfid=' + f + '&' + utm);
  }
};
