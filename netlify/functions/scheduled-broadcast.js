/**
 * COLLEGRANCE – Scheduled LINE Broadcast
 *
 * Netlify Scheduled Functions で自動実行。
 * netlify.toml の [functions."scheduled-broadcast"] schedule で時刻を指定。
 *
 * 環境変数:
 *   LINE_CHANNEL_ACCESS_TOKEN  長期チャネルアクセストークン
 *   BROADCAST_ENABLED          "true" のときだけ実際に送信（安全スイッチ）
 *   COUPON_CODE                クーポンコード（省略時: COLLELINE）
 */

const { schedule } = require('@netlify/functions');
const CAMPAIGN_URL = 'https://collegrance.com/campaign-line-exclusive.html';

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
                { type: 'text', text: '① Amazonで商品をカートに入れる', size: 'sm', color: '#444444' },
                { type: 'text', text: '② レジに進む', size: 'sm', color: '#444444' },
                { type: 'text', text: `③ 「${couponCode}」を入力 → 20%OFF適用！`, size: 'sm', color: '#444444', weight: 'bold' },
              ],
            },
            { type: 'text', text: '※ 3/30（日）23:59まで有効', size: 'xxs', color: '#999999', margin: 'md' },
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

const handler = async () => {
  const token   = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const enabled = process.env.BROADCAST_ENABLED === 'true';
  const couponCode = process.env.COUPON_CODE || 'COLLELINE';

  console.log(`[scheduled-broadcast] enabled=${enabled} time=${new Date().toISOString()}`);

  if (!enabled) {
    console.log('[scheduled-broadcast] BROADCAST_ENABLED is not "true" – skipped (dry run)');
    return { statusCode: 200 };
  }

  if (!token) {
    console.error('[scheduled-broadcast] LINE_CHANNEL_ACCESS_TOKEN not set');
    return { statusCode: 500 };
  }

  const messages = buildMessages(couponCode);

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`LINE broadcast ${res.status}: ${text}`);
    console.log(`[scheduled-broadcast] SUCCESS: ${text}`);
    return { statusCode: 200 };
  } catch (err) {
    console.error('[scheduled-broadcast] FAILED:', err.message);
    return { statusCode: 500 };
  }
};

// Netlify Scheduled Functions はここで schedule() でラップして export
exports.handler = schedule(
  // ★ テスト用：今日の日本時間12:00 = UTC 03:00
  // 本番に切り替えるときは下の TEST_SCHEDULE を PROD_SCHEDULE にコメント切替
  '0 3 * * *',   // TEST: 毎日 JST 12:00 (UTC 03:00) に実行
  // '0 15 28 3 *', // PROD: 2025-03-29 JST 00:00 (UTC 15:00, 28日) に1回実行
  handler
);
