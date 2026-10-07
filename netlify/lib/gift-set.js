/**
 * 選べる3本ギフトセット — サーバー側の共通処理（2026-10-07）
 *
 * 定義は data/gift-set.json（ページ・カートと同じファイル）。
 * create-checkout.js … 香りNo・ケース色の検証と価格の再計算（クライアントの price は使わない）
 * stripe-webhook.js  … Slack 発送通知の内訳
 * shipping-csv.js    … 伝票の品名（全角25文字以内の短縮名）
 *
 * ※ netlify/functions の外に置いているのは、ここが関数として公開されないようにするため。
 *    require で静的に参照しているので、Netlify のバンドラが data/gift-set.json ごと同梱する。
 */
const CONFIG = require('../../data/gift-set.json');

const SCENT_BY_NO = Object.fromEntries(CONFIG.scents.map((s) => [s.no, s]));
const CASE_BY_ID = Object.fromEntries(CONFIG.cases.map((c) => [c.id, c]));
const CASE_BY_NAME = Object.fromEntries(CONFIG.cases.map((c) => [c.name, c]));
const PRODUCT_ID = CONFIG.productId;

function isGiftSetItem(item) {
  return !!item && (String(item.productId) === String(PRODUCT_ID) || (item.giftSet && typeof item.giftSet === 'object'));
}

/**
 * クライアントから来た giftSet を検証して正規化する。
 * 戻り値: { ok:true, scents:[{no,name,...}×3], kase:{id,name}, unitAmount, key, name, metaValue }
 *      or { ok:false, error }
 */
function resolveGiftSet(giftSet) {
  if (CONFIG.soldOut) return { ok: false, error: 'ギフトセットは現在お取り扱いを停止しています' };
  if (!giftSet || typeof giftSet !== 'object') return { ok: false, error: 'ギフトセットの内容が不正です' };
  const raw = Array.isArray(giftSet.scents) ? giftSet.scents : null;
  if (!raw || raw.length !== CONFIG.picks) {
    return { ok: false, error: `ギフトセットは香りを${CONFIG.picks}本お選びください` };
  }
  const scents = [];
  for (const v of raw) {
    const no = String(v == null ? '' : v).trim();
    const s = Object.prototype.hasOwnProperty.call(SCENT_BY_NO, no) ? SCENT_BY_NO[no] : null;
    if (!s) return { ok: false, error: '選べない香りが含まれています' };
    if (s.soldOut) return { ok: false, error: `「${s.name}」は品切れ中です。別の香りをお選びください` };
    scents.push(s);
  }
  const caseKey = String(giftSet.case == null ? '' : giftSet.case).trim();
  const kase = CASE_BY_ID[caseKey] || CASE_BY_NAME[caseKey] || null;
  if (!kase) return { ok: false, error: 'ケースの色が不正です' };
  if (kase.soldOut) return { ok: false, error: `ケース（${kase.name}）は品切れ中です。別の色をお選びください` };

  // 並び順は No 順に揃える（同じ組み合わせは同じ行・同じ表記にする）
  scents.sort((a, b) => a.no.localeCompare(b.no));
  const unitAmount = CONFIG.basePrice + scents.reduce((sum, s) => sum + s.surcharge, 0);
  return {
    ok: true,
    scents,
    kase,
    unitAmount,
    key: `gs:${scents.map((s) => s.no).join('-')}:${kase.id}`,
    // Stripe の商品名＝決済画面・領収書・Slack・伝票の元になる
    name: `${CONFIG.name}（${scents.map((s) => s.name).join('／')}・ケース:${kase.name}）`,
    // session metadata 用（gs1=030,018,039|エクリュ）
    metaValue: `${scents.map((s) => s.no).join(',')}|${kase.name}`,
  };
}

/** metadata の値（"030,018,039|エクリュ" または "...|エクリュ|x2"）を読み戻す */
function parseMetaValue(v) {
  const [nos, caseName, qty] = String(v || '').split('|');
  const scents = String(nos || '').split(',').filter(Boolean).map((no) => SCENT_BY_NO[no] || { no, name: `No.${no}`, short: no });
  return { scents, caseName: caseName || '', qty: qty ? parseInt(String(qty).replace(/^x/, ''), 10) || 1 : 1 };
}

/**
 * 伝票の品名（ヤマトB2: 全角25文字＝半角50バイト以内）
 * 1行目: 「ギフト3本 レイジー/ナイル/ジャズ」（最長でも半角換算48）
 * 2行目: 「香水ケース エクリュ 巾着」 … ケース発送は色を品名に入れるルール
 */
function shippingNames(scentNos, caseIdOrName, qty) {
  const shorts = scentNos.map((no) => (SCENT_BY_NO[no] ? SCENT_BY_NO[no].short : no));
  const q = qty > 1 ? `x${qty}` : '';
  const kase = CASE_BY_ID[caseIdOrName] || CASE_BY_NAME[caseIdOrName];
  const bytes = (t) => Array.from(t).reduce((b, ch) => b + (ch.charCodeAt(0) < 128 ? 1 : 2), 0);
  let line1 = `ギフト3本${q} ${shorts.join('/')}`;
  if (bytes(line1) > 50) line1 = `ギフト3本${q}${shorts.join('/')}`; // 10セット以上の時だけ空白を詰める
  return [
    line1,
    `香水ケース ${kase ? kase.name : caseIdOrName}${q ? ' ' + q : ''} 巾着`,
  ];
}

module.exports = {
  CONFIG,
  PRODUCT_ID,
  SCENT_BY_NO,
  CASE_BY_ID,
  isGiftSetItem,
  resolveGiftSet,
  parseMetaValue,
  shippingNames,
};
