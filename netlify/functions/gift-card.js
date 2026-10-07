/**
 * ギフトセットのメッセージカード印刷ページ（2026-10-08）
 *
 * GET /.netlify/functions/gift-card?s=<session_id>&t=<token>[&slot=1..10][&test=1][&ox=0&oy=0][&mx=14&my=11]
 *   s     Stripe Checkout Session ID（cs_live_…）
 *   t     netlify/lib/gift-card.js の cardToken(s)。Slack の発送通知に載るリンクに付いている
 *   slot  A4マルチカード10面のうち、1枚目を刷る面（1=左上, 2=右上, 3=2段目左 … 10=右下）。既定1
 *         セットが複数なら続きの面へ。10面を超えたら2枚目の用紙へ
 *   test  1 なら 10面すべてに枠線と番号だけ（位置合わせ用。手持ちの普通紙で刷ってマルチカードと重ねる）
 *   ox/oy 印刷位置の微調整（mm。+で右/下へ）。画面で変えるとこのPCのブラウザに記憶される
 *   mx/my 用紙の左/上の余白（mm）。既定はエーワン等の名刺10面の標準 14 / 11
 *
 * 用紙: A4 縦・名刺サイズ 91×55mm を 2列×5段（ミシン目・隙間なし）
 * 文面は Stripe の metadata から作る（URL に本文・氏名は載せない）。
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { SESSION_RE, verifyToken, buildCards } = require('../lib/gift-card');

const CARD_W = 91;
const CARD_H = 55;
const COLS = 2;
const ROWS = 5;
const PER_SHEET = COLS * ROWS;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function num(v, def, min, max) {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function errorPage(statusCode, title, detail) {
  return {
    statusCode,
    headers: HEADERS,
    body: `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title></head>
<body style="font-family:-apple-system,'Hiragino Sans','Yu Gothic',sans-serif;padding:32px;color:#333"><h1 style="font-size:18px">${esc(title)}</h1><p style="font-size:14px">${esc(detail)}</p></body></html>`,
  };
}

/** 面番号(1..10) → 用紙上の左上座標(mm、余白・微調整は CSS 変数で足す) */
function slotPos(slot) {
  const i = slot - 1;
  return { col: i % COLS, row: Math.floor(i / COLS) };
}

/** 文字数からの初期フォントサイズ（pt）。画面・印刷とも、読み込み後にJSで枠に収まるまで縮める */
function initialFontPt(text, isDefault) {
  if (isDefault) return 22;
  const lines = text.split('\n');
  const n = Array.from(text.replace(/\n/g, '')).length;
  const longest = Math.max(...lines.map((l) => Array.from(l).length));
  let pt = n <= 8 ? 15 : n <= 16 ? 13.5 : n <= 30 ? 12 : n <= 45 ? 10.5 : 9.5;
  if (longest > 0) pt = Math.min(pt, (CARD_W - 18) / longest * 2.83 * 1.02); // 1行が横幅に収まる目安（1mm≒2.83pt）
  return Math.max(Math.round(pt * 2) / 2, 8);
}

function cardHtml(card, pos) {
  const msgCls = card.isDefault ? 'msg default' : 'msg';
  return `<div class="slot card" style="--c:${pos.col};--r:${pos.row}">
  <div class="${msgCls}"><div class="fit" style="font-size:${initialFontPt(card.message, card.isDefault)}pt">${esc(card.message)}</div></div>
  ${card.sender ? `<div class="sender">${esc(card.sender)} より</div>` : ''}
  <div class="logo"><img src="/assets/images/logo.png" alt="COLLEGRANCE"></div>
</div>`;
}

function testSlotHtml(slot) {
  const pos = slotPos(slot);
  return `<div class="slot frame" style="--c:${pos.col};--r:${pos.row}"><span>${slot}</span><i class="h"></i><i class="v"></i></div>`;
}

function renderPage({ sessionId, token, cards, slot, test, ox, oy, mx, my, warn, summary }) {
  // 用紙ごとに面を割り当てる
  const sheets = [];
  if (test) {
    sheets.push(Array.from({ length: PER_SHEET }, (_, i) => testSlotHtml(i + 1)).join('\n'));
  } else {
    let cur = [];
    let s = slot;
    const used = [];
    for (const c of cards) {
      if (s > PER_SHEET) { sheets.push(cur.join('\n')); cur = []; s = 1; }
      cur.push(cardHtml(c, slotPos(s)));
      used.push(s);
      s++;
    }
    if (cur.length) sheets.push(cur.join('\n'));
    summary.used = used;
  }
  // 画面だけに出す面のガイド（印刷されない）
  const guides = Array.from({ length: PER_SHEET }, (_, i) => {
    const p = slotPos(i + 1);
    return `<div class="slot guide" style="--c:${p.col};--r:${p.row}"><span>${i + 1}</span></div>`;
  }).join('');

  const base = `?s=${encodeURIComponent(sessionId)}&t=${encodeURIComponent(token)}`;
  const slotLinks = Array.from({ length: PER_SHEET }, (_, i) => {
    const n = i + 1;
    const on = !test && n === slot;
    return `<a class="sl${on ? ' on' : ''}" href="${base}&slot=${n}">${n}</a>`;
  }).join('');
  const range = test ? '10面すべて（枠線のみ）'
    : summary.used.length === 1 ? `${summary.used[0]} の面`
      : `${summary.used[0]}〜${summary.used[summary.used.length - 1]} の面（${summary.used.length}枚${sheets.length > 1 ? `・用紙${sheets.length}枚` : ''}）`;

  return `<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${test ? '位置合わせテスト' : 'メッセージカード印刷'} | COLLEGRANCE</title>
<style>
@page { size: A4 portrait; margin: 0; }
:root { --mx:${mx}mm; --my:${my}mm; --ox:${ox}mm; --oy:${oy}mm; --cw:${CARD_W}mm; --ch:${CARD_H}mm; --teal:#5AB9BE; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: #e6eaea; color: #2b2b2b; font-family: -apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ui { max-width: 210mm; margin: 0 auto; padding: 16px 16px 8px; font-size: 14px; line-height: 1.6; }
.ui h1 { font-size: 17px; margin: 0 0 8px; }
.ui .box { background: #fff; border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
.ui .how { display: grid; grid-template-columns: max-content 1fr; gap: 2px 12px; margin: 0; }
.ui .how dt { color: #6a7576; }
.ui .how dd { margin: 0; font-weight: 600; }
.ui .warn { background: #fff4e5; border: 1px solid #f0b45a; color: #8a4b00; }
.ui .slots { display: grid; grid-template-columns: repeat(2, 40px); gap: 4px; margin: 6px 0; }
.ui .row { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }
.ui a.sl { display: block; text-align: center; padding: 6px 0; border: 1px solid #b9c4c5; border-radius: 6px; text-decoration: none; color: #2b2b2b; background: #fff; }
.ui a.sl.on { background: var(--teal); border-color: var(--teal); color: #fff; font-weight: 700; }
.ui button, .ui a.btn { font: inherit; padding: 10px 18px; border-radius: 8px; border: 1px solid var(--teal); background: var(--teal); color: #fff; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; }
.ui a.btn.sub { background: #fff; color: #2b7f84; }
.ui input { width: 64px; font-size: 16px; padding: 4px 6px; }
.ui small { color: #6a7576; }
.sheet { position: relative; width: 210mm; height: 297mm; margin: 8px auto 24px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.15); overflow: hidden; page-break-after: always; break-after: page; }
.sheet:last-child { page-break-after: auto; break-after: auto; }
.slot { position: absolute; width: var(--cw); height: var(--ch);
  left: calc(var(--mx) + var(--ox) + var(--c) * var(--cw));
  top:  calc(var(--my) + var(--oy) + var(--r) * var(--ch)); }
.guide { outline: 1px dashed #cfd6d6; outline-offset: -0.5px; z-index: 0; }
.guide span { position: absolute; left: 2mm; top: 1.5mm; font-size: 9px; color: #b7c0c0; }
.card { z-index: 1; background: #fff; }
.card .msg { position: absolute; left: 8mm; right: 8mm; top: 6.5mm; bottom: 15mm; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.card .fit { max-width: 100%; max-height: 100%; text-align: center; white-space: pre-wrap; line-break: strict; overflow-wrap: anywhere; line-height: 1.75; letter-spacing: .06em; color: #2b2b2b;
  font-family: "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Yu Mincho", "YuMincho", "BIZ UDPMincho", "MS PMincho", "Noto Serif JP", serif; font-feature-settings: "palt" 0; }
.card .msg.default .fit { font-family: "Didot", "Bodoni 72", "Times New Roman", "Hiragino Mincho ProN", serif; font-style: italic; letter-spacing: .04em; line-height: 1.2; }
.card .sender { position: absolute; right: 9mm; bottom: 10.5mm; font-size: 8.5pt; letter-spacing: .08em; color: #444;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "MS PMincho", serif; white-space: nowrap; max-width: 60mm; overflow: hidden; text-overflow: ellipsis; }
/* ロゴ: assets/images/logo.png（640×640・文字は x60〜576 / y297〜341）を切り抜いて 24mm 幅で表示 */
.card .logo { position: absolute; left: 50%; bottom: 5mm; width: 24mm; height: 2.2mm; margin-left: -12mm; overflow: hidden; }
.card .logo img { position: absolute; width: 29.71mm; height: 29.71mm; left: -2.79mm; top: -13.75mm; max-width: none; }
.frame { border: 0.2mm solid #000; display: flex; align-items: center; justify-content: center; }
.frame span { font: 700 22pt/1 sans-serif; color: #999; }
.frame i.h, .frame i.v { position: absolute; background: #000; }
.frame i.h { left: calc(50% - 4mm); top: 50%; width: 8mm; height: 0.2mm; }
.frame i.v { top: calc(50% - 4mm); left: 50%; height: 8mm; width: 0.2mm; }
.test-note { position: absolute; left: 0; right: 0; bottom: 3mm; text-align: center; font-size: 8pt; color: #666; }
@media print {
  body { background: #fff; }
  .ui, .guide { display: none !important; }
  .sheet { margin: 0; box-shadow: none; }
}
@media screen and (max-width: 820px) {
  .sheet { zoom: .45; }
}
</style>
</head>
<body>
<div class="ui">
  <h1>${test ? '印刷位置のテスト（枠線のみ）' : 'ギフトセットのメッセージカード'}</h1>
  ${warn ? `<div class="box warn">${esc(warn)}</div>` : ''}
  ${test ? '' : `<div class="box"><dl class="how">
    <dt>セット数</dt><dd>${summary.totalSets}枚</dd>
    <dt>お届け</dt><dd>${summary.mode === 'direct' ? '相手に直送' : 'ご本人が受け取って手渡し'}</dd>
    <dt>文面</dt><dd>${summary.isDefault ? '（記入なし → 「For you」）' : esc(summary.message).replace(/\n/g, '<br>')}</dd>
    ${summary.sender ? `<dt>贈り主</dt><dd>${esc(summary.sender)} より</dd>` : ''}
  </dl></div>`}
  <div class="box"><dl class="how">
    <dt>用紙</dt><dd>A4マルチカード 10面（名刺 91×55mm）を表向きに</dd>
    <dt>印刷設定</dt><dd>倍率 100%（実際のサイズ）・余白なし・ヘッダー/フッターなし・片面</dd>
    <dt>印刷する面</dt><dd>${range}</dd>
  </dl></div>
  <div class="box row">
    <div><b>1枚目を刷る面</b><div class="slots">${slotLinks}</div><small>使った面は飛ばして、空いている面を選ぶ</small></div>
    <div style="flex:1;min-width:220px">
      <b>位置の微調整（mm）</b><br>
      右へ <input id="ox" type="number" step="0.5" value="${ox}"> 下へ <input id="oy" type="number" step="0.5" value="${oy}"><br>
      <small>テスト印刷で枠がずれたら入力（マイナスで左・上）。このPCのブラウザに記憶されます</small><br>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" onclick="window.print()">印刷する</button>
        ${test ? `<a class="btn sub" href="${base}">カードに戻る</a>` : `<a class="btn sub" href="${base}&test=1">位置合わせテスト</a>`}
      </div>
    </div>
  </div>
</div>
${sheets.map((inner) => `<div class="sheet">${guides}${inner}${test ? '<div class="test-note">位置合わせテスト：普通紙に印刷し、マルチカードと重ねて透かして確認</div>' : ''}</div>`).join('\n')}
<script>
(function(){
  var root = document.documentElement, q = new URLSearchParams(location.search);
  function setOff(k, v){ root.style.setProperty('--' + k, (parseFloat(v) || 0) + 'mm'); }
  ['ox','oy'].forEach(function(k){
    var el = document.getElementById(k), saved = null;
    try { saved = localStorage.getItem('clg_giftcard_' + k); } catch(e){}
    if(!q.has(k) && saved !== null){ el.value = saved; setOff(k, saved); }
    el.addEventListener('input', function(){ setOff(k, el.value); try { localStorage.setItem('clg_giftcard_' + k, String(parseFloat(el.value) || 0)); } catch(e){} });
  });
  // 文面が枠からはみ出さないよう縮める（8ptまで）
  function fit(){
    document.querySelectorAll('.card .fit').forEach(function(el){
      var box = el.parentNode, pt = parseFloat(el.style.fontSize) || 12;
      while(pt > 8 && (el.scrollHeight > box.clientHeight + 0.5 || el.scrollWidth > box.clientWidth + 0.5)){ pt -= 0.5; el.style.fontSize = pt + 'pt'; }
    });
  }
  fit();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('beforeprint', fit);
})();
</script>
</body></html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };
  }
  const q = event.queryStringParameters || {};
  const sessionId = String(q.s || '');
  const token = String(q.t || '');
  if (!SESSION_RE.test(sessionId) || !verifyToken(sessionId, token)) {
    return errorPage(403, 'このリンクは開けません', 'Slack の発送通知にある「メッセージカードを印刷」のリンクから開いてください。');
  }

  const slot = Math.round(num(q.slot, 1, 1, PER_SHEET));
  const test = q.test === '1';
  const ox = num(q.ox, 0, -10, 10);
  const oy = num(q.oy, 0, -10, 10);
  const mx = num(q.mx, 14, 0, 30);
  const my = num(q.my, 11, 0, 30);

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    if (err && (err.code === 'resource_missing' || err.statusCode === 404)) {
      return errorPage(404, '注文が見つかりません', 'この注文は存在しないか、削除されています。');
    }
    console.error('[gift-card] stripe retrieve failed:', err && err.message);
    return errorPage(502, '注文情報を読み込めませんでした', '時間をおいて再読み込みしてください。');
  }

  const { cards, mode, totalSets } = buildCards(session.metadata || {});
  if (!cards.length) {
    return errorPage(404, 'ギフトセットの注文ではありません', 'この注文にはメッセージカードを印刷するギフトセットが含まれていません。');
  }

  let warn = '';
  if (session.payment_status !== 'paid') {
    warn = session.status === 'expired'
      ? 'この注文は決済されずに期限切れになっています（発送不要）。'
      : 'この注文はまだ決済が完了していません。発送前に Stripe で確認してください。';
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: renderPage({
      sessionId, token, cards, slot, test, ox, oy, mx, my, warn,
      summary: { totalSets, mode, message: cards[0].message, isDefault: cards[0].isDefault, sender: cards[0].sender, used: [] },
    }),
  };
};
