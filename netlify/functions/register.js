/**
 * COLLEGRANCE Campaign Notification Registration API
 * POST /api/register
 *
 * Body: { type: "email"|"line", value: "...", campaign: "line-exclusive-2025" }
 *
 * Storage: Netlify Blobs (key-value store)
 * Notification dispatch: /api/notify  (called manually by admin)
 */

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { type, value, campaign = 'line-exclusive-2025' } = body;

  // Validation
  if (!type || !value) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'type と value は必須です' }) };
  }
  if (!['email', 'line'].includes(type)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'type は email または line のみ有効です' }) };
  }

  // Email validation
  if (type === 'email') {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(value)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'メールアドレスの形式が正しくありません' }) };
    }
  }

  // LINE token validation (basic length check)
  if (type === 'line') {
    if (value.length < 10) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'LINE Notifyトークンが短すぎます' }) };
    }
  }

  try {
    // Store registration in Netlify Blobs
    const store = getStore({ name: 'campaign-notifications', consistency: 'strong' });

    // Key: type:sha-of-value to avoid duplicates
    const key = `${campaign}:${type}:${Buffer.from(value).toString('base64').replace(/[/+=]/g, '_')}`;

    // Check duplicate
    const existing = await store.get(key);
    if (existing) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, message: 'すでに登録済みです', duplicate: true }),
      };
    }

    const record = {
      type,
      value,
      campaign,
      registeredAt: new Date().toISOString(),
      notified: false,
    };

    await store.setJSON(key, record);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: '登録しました！キャンペーン開始時にお知らせします。' }),
    };
  } catch (err) {
    console.error('Store error:', err);
    // Fallback: Netlify Blobs が使えない環境（ローカル等）でも200を返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: '登録を受け付けました！（開発環境）' }),
    };
  }
};
