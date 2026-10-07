/**
 * ギフトセットのメッセージカード — 共通処理（2026-10-08）
 *
 * gift-card.js（印刷ページ）と stripe-webhook.js（Slack の印刷リンク）が使う。
 * リンクは /.netlify/functions/gift-card?s=<session_id>&t=<token>
 *   token = HMAC-SHA256(STRIPE_WEBHOOK_SECRET, "gift-card:" + session_id) の先頭22文字（base64url）
 *   → URL にメッセージ本文や氏名を載せない。session_id だけでは開けない。
 */
const crypto = require('crypto');

let giftSetLib = null;
try { giftSetLib = require('./gift-set'); } catch (e) { console.error('[giftcard] gift-set lib load failed:', e.message); }

const SITE_URL = 'https://collegrance.com';
const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/;

function secret() {
  return process.env.GIFT_CARD_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
}

function cardToken(sessionId) {
  const key = secret();
  if (!key) return '';
  return crypto.createHmac('sha256', key).update('gift-card:' + String(sessionId)).digest('base64url').slice(0, 22);
}

function verifyToken(sessionId, token) {
  const expect = cardToken(sessionId);
  if (!expect || typeof token !== 'string' || token.length !== expect.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(token));
}

function cardUrl(sessionId) {
  const t = cardToken(sessionId);
  if (!t) return '';
  return `${SITE_URL}/.netlify/functions/gift-card?s=${encodeURIComponent(sessionId)}&t=${t}`;
}

/** metadata から gs1, gs2… を番号順に取り出す */
function giftSetKeys(metadata) {
  return Object.keys(metadata || {})
    .filter((k) => /^gs\d+$/.test(k))
    .sort((a, b) => parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10));
}

/**
 * 印刷するカードの一覧（セット数ぶん。同じ注文のメッセージは全カード共通）
 * 戻り値: { cards:[{ key, label, message, isDefault, sender }], mode, totalSets }
 */
function buildCards(metadata) {
  const md = metadata || {};
  const keys = giftSetKeys(md);
  // create-checkout.js は改行を " / " にして保存している → カードでは改行に戻す
  const rawMsg = String(md.gift_message || '').split(' / ').join('\n').trim();
  const message = rawMsg ? Array.from(rawMsg).slice(0, 60).join('') : '';
  const mode = md.gift_mode === 'direct' ? 'direct' : 'self';
  const sender = mode === 'direct' ? String(md.gift_sender || '').trim().slice(0, 30) : '';
  const cards = [];
  for (const k of keys) {
    let qty = 1;
    let label = md[k];
    if (giftSetLib) {
      const g = giftSetLib.parseMetaValue(md[k]);
      qty = g.qty;
      label = `${g.scents.map((s) => s.name).join('／')}・ケース:${g.caseName}`;
    } else {
      const m = /\|x(\d+)$/.exec(String(md[k] || ''));
      if (m) qty = parseInt(m[1], 10) || 1;
    }
    qty = Math.min(Math.max(qty, 1), 50);
    for (let i = 0; i < qty; i++) {
      cards.push({ key: k, label: qty > 1 ? `${label}（${i + 1}/${qty}）` : label, message: message || 'For you', isDefault: !message, sender });
    }
  }
  return { cards, mode, totalSets: cards.length };
}

module.exports = { SESSION_RE, cardToken, verifyToken, cardUrl, giftSetKeys, buildCards };
