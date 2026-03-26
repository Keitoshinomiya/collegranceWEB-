/**
 * COLLEGRANCE – LINE Messaging API Broadcast
 * POST /api/line-broadcast
 *
 * LINE Messaging API の multicast / broadcast で
 * 公式LINEアカウントの友達全員にプッシュ通知を送る。
 *
 * Headers: { x-admin-secret: <ADMIN_SECRET> }
 * Body: { mode: "broadcast"|"test", couponCode: "COLLELINE" }
 *   mode=broadcast → 友達全員に送信
 *   mode=test      → LINE_TEST_USER_ID 環境変数のユーザー1名だけに送信
 *
 * 必要な環境変数（Netlify Dashboard で設定）:
 *   LINE_CHANNEL_ACCESS_TOKEN  長期チャネルアクセストークン
 *   LINE_CHANNEL_SECRET        チャネルシークレット（署名検証用）
 *   ADMIN_SECRET               管理パネルのパスワード
 *   LINE_TEST_USER_ID          テスト送信先のLINE User ID（自分のID）
 */

const CAMPAIGN_URL = 'https://collegrance.com/campaign-line-exclusive.html';
const COUPON_DEFAULT = 'COLLELINE';

// ── LINE メッセージ構築 ──────────────────────────────────────────────────────
function buildMessages(couponCode) {
  return [
    {
      type: 'flex',
      altText: `【COLLEGRANCE】LINE友達限定クーポンが解放されました！コード: ${couponCode}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#1a1a1a',
          paddingAll: '20px',
          contents: [
            {
              type: 'text',
              text: 'COLLEGRANCE',
              color: '#ffffff',
              size: 'lg',
              weight: 'bold',
              align: 'center',
              letterSpacing: '4px',
            },
            {
              type: 'text',
              text: 'LINE友達限定',
              color: '#06C755',
              size: 'xs',
              align: 'center',
              margin: 'sm',
              letterSpacing: '2px',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '20px',
          spacing: 'md',
          contents: [
            {
              type: 'text',
              text: '20% OFF クーポンが',
              size: 'xl',
              weight: 'bold',
              color: '#1a1a1a',
              align: 'center',
            },
            {
              type: 'text',
              text: '解放されました！',
              size: 'xl',
              weight: 'bold',
              color: '#1a1a1a',
              align: 'center',
            },
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#e8f8ee',
              borderColor: '#06C755',
              borderWidth: '2px',
              cornerRadius: '4px',
              paddingAll: '16px',
              margin: 'md',
              contents: [
                {
                  type: 'text',
                  text: 'COUPON CODE',
                  size: 'xxs',
                  color: '#059144',
                  align: 'center',
                  letterSpacing: '3px',
                },
                {
                  type: 'text',
                  text: couponCode,
                  size: 'xxl',
                  weight: 'bold',
                  color: '#1a1a1a',
                  align: 'center',
                  margin: 'sm',
                  letterSpacing: '4px',
                },
              ],
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              spacing: 'xs',
              contents: [
                {
                  type: 'text',
                  text: '① Amazonで商品をカートに入れる',
                  size: 'sm',
                  color: '#444444',
                },
                {
                  type: 'text',
                  text: '② レジに進む',
                  size: 'sm',
                  color: '#444444',
                },
                {
                  type: 'text',
                  text: `③ 「${couponCode}」を入力 → 20%OFF適用！`,
                  size: 'sm',
                  color: '#444444',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'text',
              text: '※ 3/30（日）23:59まで有効',
              size: 'xxs',
              color: '#999999',
              margin: 'md',
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '16px',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#FF9900',
              action: {
                type: 'uri',
                label: 'キャンペーンページを見る →',
                uri: CAMPAIGN_URL,
              },
              height: 'sm',
            },
          ],
        },
      },
    },
  ];
}

// ── broadcast（友達全員）──────────────────────────────────────────────────────
async function broadcast(token, messages) {
  const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LINE broadcast error ${res.status}: ${text}`);
  return { status: res.status, body: text };
}

// ── push（特定1名へテスト送信）───────────────────────────────────────────────
async function pushToUser(token, userId, messages) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to: userId, messages }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LINE push error ${res.status}: ${text}`);
  return { status: res.status, body: text };
}

// ── フォロワー数取得 ─────────────────────────────────────────────────────────
async function getFollowerCount(token) {
  try {
    const res = await fetch('https://api.line.me/v2/bot/followers/count', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.count ?? null;
  } catch {
    return null;
  }
}

// ── main handler ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Admin auth
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && event.headers['x-admin-secret'] !== adminSecret) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'LINE_CHANNEL_ACCESS_TOKEN not set' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { mode = 'broadcast', couponCode = COUPON_DEFAULT } = body;

  // Ping mode: auth check only (used by admin panel login)
  if (mode === 'ping') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, mode: 'ping' }) };
  }

  const messages = buildMessages(couponCode);

  try {
    if (mode === 'test') {
      // テスト送信：LINE_TEST_USER_ID に1通だけ送る
      const testUserId = process.env.LINE_TEST_USER_ID;
      if (!testUserId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'LINE_TEST_USER_ID not set. Netlify環境変数に自分のLINE User IDを設定してください。' }) };
      }
      const result = await pushToUser(token, testUserId, messages);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ ok: true, mode: 'test', sentTo: testUserId, result }),
      };
    } else {
      // 本番broadcast
      const followerCount = await getFollowerCount(token);
      const result = await broadcast(token, messages);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ ok: true, mode: 'broadcast', followerCount, result }),
      };
    }
  } catch (err) {
    console.error('LINE send error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
