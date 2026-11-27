/**
 * #collegrance-発送 に出す「新規注文」の投稿文を作る（2026-11-25 短い形に変更・発送スタッフの要望）
 *
 * 載せるのは「詰めるのに要るもの」だけ：お届け先の名前（送り状との照合用）・送り方・商品と同梱物・CSVリンク。
 * メール・電話・住所・手順の説明・Stripeリンクは載せない（住所はB2／e飛伝のCSVに入っている）。
 * 金額は、値段の付け間違いなどに気づけるよう、商品ごとの金額と合計だけ載せる（2026-11-25 スタッフの要望で戻した）。
 * ギフト（選べる3本ギフトセット・ギフトラッピング）は、2行目に必ずお渡し方法を太字で出す（2026-11-27 スタッフの要望）：
 *   「注文者が受け取って手渡し」か「プレゼントする相手に直送」か（直送は 注文者 → お届け先 の名前も）。
 * 絵文字は商品の行の頭だけ：🧴フルボトル 🧪小分け（お試し） 👝ケース
 * 本数は「*1本*」「*1個*」と太字、ケースは「*ケース 色 1個*」と行ごと太字（見落とし防止・2026-11-25 スタッフの要望）。
 * Slackの太字は * の前後が空白か行末でないと効かないので、前後の半角スペースを消さないこと。
 *
 * ⚠️ この文面は Mac Mini の ~/scripts/ship_notify_watch.py（お客さまへの発送連絡）と
 *    ~/scripts/shipping_unchecked.py（月曜の週次チェック）が読んでいる。次の3つを変える時は、その2つも一緒に直すこと。
 *      ・1行目が「【要対応・発送】新規注文｜お届け先の名前 様｜ネコポス または 佐川」であること
 *      ・「新規注文」という言葉
 *      ・CSVリンクのURL（shipping-csv?session=cs_live_…）
 */

const CASE_NAMES = { BLK: 'ブラック', ECR: 'エクリュ', BRN: 'ブラウン', NVY: 'ネイビー', RED: 'レッド', PNK: 'ピンク', LBL: 'ライトブルー', YEL: 'イエロー', SLV: 'シルバー', GLD: 'ゴールド', KHK: 'カーキ', GRY: 'グレー' };
const HEADER = '【要対応・発送】';

const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 商品名を短くする。
 * 「Maison Margiela - Jazz Club (ジャズクラブ)【お試し1.5ml・ケース:ゴールド】（まとめ買い10%引き）」→「ジャズクラブ」
 * 「HERMÈS - Un Jardin sur le Nil (ナイルの庭)【テスター品】」→「ナイルの庭【テスター品】」（テスター品のように中身が違う印は残す）
 */
function shortName(desc) {
  let s = String(desc || '商品');
  s = s.replace(/（[^（）]*引き[^（）]*）/g, '');
  const keep = [];
  s = s.replace(/【([^】]*)】/g, (_, inner) => {
    inner.split('・').map((p) => p.trim()).filter(Boolean).forEach((p) => {
      if (!/^お試し/.test(p) && !/^ケース\s*[:：]/.test(p)) keep.push(p);
    });
    return '';
  });
  s = s.trim();
  const m = s.match(/\(([^()]+)\)\s*$/) || s.match(/\(([^()]+)\)/);
  const name = (m ? m[1] : s.replace(/^.*?\s-\s/, '')).trim() || s || '商品';
  return name + (keep.length ? `【${keep.join('・')}】` : '');
}

function shipToName(session) {
  const cands = [
    session.shipping_details,
    session.collected_information && session.collected_information.shipping_details,
    session.customer_details,
  ];
  for (const c of cands) {
    if (c && c.name && String(c.name).trim()) return String(c.name).trim();
  }
  return '不明';
}

function shipToState(session) {
  const cands = [
    session.shipping_details,
    session.collected_information && session.collected_information.shipping_details,
  ];
  for (const c of cands) {
    if (c && c.address && c.address.state) return c.address.state;
  }
  return '';
}

/**
 * @param {object} o
 * @param {object} o.session      line_items と line_items.data.price.product を展開した Checkout Session
 * @param {string} o.sessionId    cs_live_…
 * @param {object} [o.giftSetLib] ../lib/gift-set（無くても動く）
 * @param {object} [o.giftCardLib] ../lib/gift-card（無くても動く）
 * @param {number} [o.nekoposMax] 小分けをネコポスで送れる上限本数
 * @returns {{ text: string, carrier: 'nekopos'|'sagawa', shipName: string }}
 */
function buildOrderSlackText({ session, sessionId, giftSetLib, giftCardLib, nekoposMax = 10 }) {
  const metadata = session.metadata || {};
  const lineItems = (session.line_items && session.line_items.data) || [];
  const prodMeta = (item) => (item.price && item.price.product && item.price.product.metadata) || {};
  const descOf = (item) => item.description || (item.price && item.price.product && item.price.product.name) || '商品';
  const isSample = (item) => prodMeta(item).variant === 'sample';
  const isGiftSetItem = (item) => /選べる3本ギフトセット/.test(descOf(item));

  const shipItems = lineItems.filter((item) => !/送料|ギフトラッピング/.test(item.description || ''));
  const giftSetKeys = Object.keys(metadata).filter((k) => /^gs\d+$/.test(k))
    .sort((a, b) => parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10));

  // 送り方：選べる3本ギフトセットだけ・小分けだけ（上限本数以内）はネコポス、それ以外は佐川（shipping-csv.js と同じ規則）
  const giftOnly = giftSetKeys.length > 0 && shipItems.length > 0 && shipItems.every(isGiftSetItem);
  const sampleBottles = shipItems.filter(isSample).reduce((n, item) => n + (item.quantity || 1), 0);
  const sampleOnly = shipItems.length > 0 && shipItems.every(isSample);
  const sampleNekopos = sampleOnly && sampleBottles <= nekoposMax;
  const carrier = (giftOnly || sampleNekopos) ? 'nekopos' : 'sagawa';

  const shipName = shipToName(session);
  const lines = [`${HEADER}新規注文｜${esc(shipName)} 様｜${carrier === 'nekopos' ? 'ネコポス' : '佐川'}`];

  // ギフトのお渡し方法（2行目・太字）。gift_mode: self＝注文者が受け取って手渡し / direct＝相手に直送
  const isGift = giftSetKeys.length > 0 || metadata.gift_wrap === 'yes';
  const giftMode = metadata.gift_mode || '';
  if (isGift) {
    const buyer = ((session.customer_details && session.customer_details.name) || '').trim();
    if (giftMode === 'direct') {
      lines.push(`*ギフト：プレゼントする相手に直送* （注文者 ${esc(buyer || '不明')} 様 → お届け先 ${esc(shipName)} 様）`);
    } else if (giftMode === 'self') {
      lines.push('*ギフト：注文者が受け取って手渡し* （お届け先は注文者ご本人）');
    } else {
      lines.push('*ギフト：お渡し方法の指定なし* （注文者とお届け先が同じなら手渡し扱い）');
    }
  }

  // 商品（ギフトセットの中身は下でまとめて出す）。金額は割引後・その行の合計（ケース付きはケース代込み）
  for (const item of shipItems) {
    if (isGiftSetItem(item) && giftSetKeys.length) continue;
    const qty = item.quantity || 1;
    const price = yen(item.amount_total);
    if (isSample(item)) {
      lines.push(`🧪 ${esc(shortName(descOf(item)))} *${qty}本* ${price}`);
      const c = prodMeta(item).case;
      if (c) lines.push(`👝 *ケース ${esc(CASE_NAMES[c] || c)} ${qty}個* （↑の瓶を入れる）`);
    } else {
      lines.push(`🧴 ${esc(shortName(descOf(item)))} *${qty}本* ${price}`);
    }
  }
  if (metadata.free_case) {
    lines.push(`👝 *ケース ${esc(CASE_NAMES[metadata.free_case] || metadata.free_case)} 1個* （プレゼント・空のまま同梱）`);
  }
  if (sampleBottles >= 2) lines.push(`*お試し 合計 ${sampleBottles}本*`);

  // 選べる3本ギフトセット。gs1, gs2… = "030,018,039|エクリュ[|x2]"
  if (giftSetKeys.length) {
    // ギフトセットの金額：セットの行（決済の明細）と gs1, gs2… が同じ数なら1つずつ、違えばまとめて1行で出す
    const giftItems = shipItems.filter(isGiftSetItem);
    const perSet = giftItems.length === giftSetKeys.length;
    let gi = 0;
    for (const k of giftSetKeys) {
      const setPrice = perSet ? ` ${yen(giftItems[gi++].amount_total)}` : '';
      const v = metadata[k];
      let g = null;
      try { g = giftSetLib ? giftSetLib.parseMetaValue(v) : null; } catch (e) { g = null; }
      if (g && g.scents && g.scents.length) {
        const q = g.qty > 1 ? g.qty : 1;
        lines.push(`🧪 ${esc(g.scents.map((s) => s.name).join('／'))} *各${q}本*${setPrice}`);
        lines.push(`👝 *ケース ${esc(g.caseName)} ${q}個*`);
      } else {
        lines.push(`🧪 ギフトセット ${esc(v)}${setPrice}`);
      }
    }
    if (!perSet && giftItems.length) lines.push(`ギフトセット代 ${yen(giftItems.reduce((n, it) => n + (it.amount_total || 0), 0))}`);
    let cardLink = '';
    try { cardLink = giftCardLib ? giftCardLib.cardUrl(sessionId) : ''; } catch (e) { cardLink = ''; }
    const cardText = metadata.gift_message ? `カード「${esc(metadata.gift_message)}」` : 'カード（記入なし → 「あなたに似合う香りが、見つかりますように。」）';
    lines.push(`ギフトセット：巾着＋${cardText}${cardLink ? ` <${cardLink}|カードを印刷>` : '（印刷リンクを作れませんでした）'}`);
    if (giftMode === 'direct') lines.push(`カードの贈り主: ${esc(metadata.gift_sender || '記入なし')}`);
  }

  // ギフトラッピングは「あり」の時だけ出す
  const wrapItems = lineItems.filter((item) => /ギフトラッピング/.test(item.description || ''));
  if (metadata.gift_wrap === 'yes') {
    const mode = metadata.gift_mode || '';
    if (wrapItems.length) lines.push(`ギフトラッピング代 ${yen(wrapItems.reduce((n, it) => n + (it.amount_total || 0), 0))}`);
    if (mode === 'direct') {
      lines.push(`ギフトラッピング：カードに記入して同梱＋巾着／文面 ${metadata.gift_message ? `「${esc(metadata.gift_message)}」` : '記入なし → 未記入カード'}／贈り主 ${esc(metadata.gift_sender || '記入なし')}`);
    } else {
      lines.push('ギフトラッピング：未記入カード＋巾着を同梱');
    }
  }
  if (isGift) lines.push(giftMode === 'direct' ? '※金額の分かる書類は入れない（お届け先は贈り先）' : '※金額の分かる書類は入れない');

  if (carrier === 'sagawa' && /沖縄/.test(shipToState(session))) {
    lines.push('※沖縄宛て：佐川の見積もり外（別料金）。出す前に四宮さんに確認');
  }

  // 送料は0円でない時だけ。合計はお客さまが支払った金額（送料・ラッピング込み）
  const td = session.total_details || {};
  const shippingAmount = td.amount_shipping != null ? td.amount_shipping
    : (session.shipping_cost && session.shipping_cost.amount_total) || 0;
  if (shippingAmount > 0) lines.push(`送料 ${yen(shippingAmount)}`);
  lines.push(`合計 *${yen(session.amount_total)}*`);

  lines.push(`<https://collegrance.com/.netlify/functions/shipping-csv?session=${sessionId}|CSVをダウンロード>`);
  return { text: lines.join('\n'), carrier, shipName };
}

module.exports = { buildOrderSlackText, shortName, CASE_NAMES, HEADER };
