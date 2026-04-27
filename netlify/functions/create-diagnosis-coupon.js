/**
 * AI診断完了者向け 10%OFFクーポン発行 Function
 *
 * 設計:
 * - 毎回ユニークなプロモコード `AID-XXXXXX` を発行（再診断 = 新コード）
 * - 10% OFF / 24時間後に自動失効 / 1回限り使用可能（max_redemptions=1）
 * - Bot対策: Origin/Referer/User-Agentチェック + IPレート制限
 *
 * 入力: { sessionId?: string }
 * 出力: { code: string, expiresAt: number, percentOff: 10 }
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const ALLOWED_ORIGINS = ['https://collegrance.com', 'https://www.collegrance.com'];
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24時間
const RATE_LIMIT_MAX = 10; // 同一IPから24時間に最大10回まで（実利用は1〜2回想定、Bot対策）
const COUPON_TTL_SEC = 24 * 60 * 60; // 24時間

// 簡易インメモリレート制限（Function instanceごと）
const rateLimitStore = new Map();

function getClientIp(event) {
  const xff = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'];
  if (xff) return xff.split(',')[0].trim();
  return event.headers['client-ip'] || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  // 期限切れレコードの掃除
  if (rateLimitStore.size > 1000) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (val.resetAt < now) rateLimitStore.delete(key);
    }
  }
  if (record.resetAt < now) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  record.count += 1;
  rateLimitStore.set(ip, record);
  return record.count <= RATE_LIMIT_MAX;
}

function generateCode() {
  // 紛らわしい文字（0,O,1,I,L）を除外
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = 'AID-';
  for (let i = 0; i < 6; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // === Bot対策1: Origin/Refererチェック ===
  const origin = event.headers.origin || event.headers.Origin || '';
  const referer = event.headers.referer || event.headers.Referer || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.some(o =>
    origin === o || referer.startsWith(o + '/') || referer === o
  );
  if (!isAllowedOrigin) {
    console.warn('[BLOCKED] Invalid origin:', { origin, referer, ip: getClientIp(event) });
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  // === Bot対策2: User-Agentチェック ===
  const ua = (event.headers['user-agent'] || event.headers['User-Agent'] || '').toLowerCase();
  if (!ua || /bot|crawler|spider|scrape|curl|wget|python-requests|postman|httpie/.test(ua)) {
    console.warn('[BLOCKED] Suspicious UA:', { ua, ip: getClientIp(event) });
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  // === Bot対策3: レート制限 ===
  const ip = getClientIp(event);
  if (!checkRateLimit(ip)) {
    console.warn('[BLOCKED] Rate limit:', { ip });
    return { statusCode: 429, body: JSON.stringify({ error: 'リクエストが多すぎます。しばらく時間をおいてください。' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const sessionId = body.sessionId || '';

    const expiresAt = Math.floor(Date.now() / 1000) + COUPON_TTL_SEC;

    // 1. Coupon（割引定義）作成
    const coupon = await stripe.coupons.create({
      percent_off: 10,
      duration: 'once',
      max_redemptions: 1,
      redeem_by: expiresAt,
      name: 'AI診断特典 10% OFF',
      metadata: {
        source: 'ai_diagnosis',
        issued_at: new Date().toISOString(),
        diagnosis_session_id: sessionId,
        client_ip_hash: ip ? Buffer.from(ip).toString('base64').slice(0, 8) : '',
      },
    });

    // 2. プロモコード作成（コード再生成のリトライあり、念のため）
    let code, promo;
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      code = generateCode();
      try {
        promo = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: code,
          max_redemptions: 1,
          expires_at: expiresAt,
          metadata: {
            source: 'ai_diagnosis',
            diagnosis_session_id: sessionId,
          },
        });
        break;
      } catch (e) {
        if (e.code === 'resource_already_exists' && attempts < 3) {
          continue; // コード重複 → 再生成
        }
        throw e;
      }
    }

    if (!promo) {
      throw new Error('Failed to create promotion code after 3 attempts');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        code: promo.code,
        expiresAt: expiresAt,
        percentOff: 10,
        promoId: promo.id,
      }),
    };
  } catch (err) {
    console.error('create-diagnosis-coupon error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
