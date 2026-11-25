const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// 選べる3本ギフトセットの内訳表示用（読めなくても通知自体は止めない）
let giftSetLib = null;
try { giftSetLib = require('../lib/gift-set'); } catch (e) { console.error('[giftset] lib load failed:', e.message); }
// メッセージカード印刷ページのリンク（2026-10-08）
let giftCardLib = null;
try { giftCardLib = require('../lib/gift-card'); } catch (e) { console.error('[giftcard] lib load failed:', e.message); }
// 発送チャンネルの「新規注文」の文面（2026-11-25）
const orderSlack = require('../lib/order-slack');

// 2026-09-14 発送専用チャンネル #collegrance-発送 (C0C1NLCNYRJ) に分離（旧 #line-連絡 と混ざってややこしいため）。Netlify env SLACK_CHANNEL_ID で上書き可
const SLACK_CHANNEL = process.env.SLACK_CHANNEL_ID || 'C0C1NLCNYRJ';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; // 優先: Incoming Webhook URL（推奨）
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;     // フォールバック: Bot Token

/**
 * Slack送信。Webhook URL → Bot Token の順で試す。
 * 両方失敗してもログに残し、決済処理自体は止めない。
 */
async function sendSlackMessage(text) {
  // ① Incoming Webhook URL（推奨方式・トークン管理不要・最も堅牢）
  if (SLACK_WEBHOOK_URL) {
    try {
      const res = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        console.log('[Slack] sent via Webhook URL');
        return { ok: true, method: 'webhook' };
      }
      const errText = await res.text();
      console.error(`[Slack] Webhook URL failed: ${res.status} ${errText}`);
    } catch (err) {
      console.error('[Slack] Webhook URL exception:', err.message);
    }
  }

  // ② Bot Token（フォールバック）
  if (SLACK_BOT_TOKEN) {
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ channel: SLACK_CHANNEL, text, mrkdwn: true, username: '発送係', icon_emoji: ':package:' }),
      });
      const data = await res.json();
      if (data.ok) {
        console.log('[Slack] sent via Bot Token');
        return { ok: true, method: 'token' };
      }
      console.error(`[Slack] Bot Token API error: ${data.error}`);
    } catch (err) {
      console.error('[Slack] Bot Token exception:', err.message);
    }
  }

  // ③ 両方失敗 → 強くログ。Stripe ダッシュボードで気付ける
  console.error('🚨🚨🚨 [SLACK_FAILURE] 全Slack通知方式が失敗しました。Stripe Dashboardで注文を確認してください。');
  console.error('--- 送信予定だったメッセージ（コピペで通知）---');
  console.error(text);
  console.error('--- ここまで ---');
  return { ok: false, method: 'none' };
}

/**
 * Format shipping address from Stripe session
 */
function formatAddress(shipping) {
  if (!shipping || !shipping.address) return '未入力';
  const a = shipping.address;
  const parts = [
    a.postal_code ? `〒${a.postal_code}` : '',
    a.state || '',
    a.city || '',
    a.line1 || '',
    a.line2 || '',
  ].filter(Boolean);
  const name = shipping.name || '';
  return name + '\n' + parts.join(' ');
}

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle checkout.session.completed
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    try {
      // Retrieve session with line items expanded
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price.product'],
      });

      const customerName = fullSession.customer_details?.name || '不明';
      const customerEmail = fullSession.customer_details?.email || '不明';
      const paymentIntent = fullSession.payment_intent || '';
      const metadata = fullSession.metadata || {};
      // 混在カートでフルボトル分だけ値引きした時は、元の1回限りのクーポンコードをここで使用済みにする（2026-11-17）
      if (metadata.coupon_scope === 'fullbottle_only' && metadata.coupon_promo_id && metadata.coupon_promo_single === '1') {
        try { await stripe.promotionCodes.update(metadata.coupon_promo_id, { active: false }); console.log('[coupon] source promo deactivated:', metadata.coupon_promo_id); }
        catch (e) { console.error('[coupon] deactivate failed:', metadata.coupon_promo_id, e.message); }
      }

      // 発送チャンネルへの投稿文（2026-11-25 短い形に変更。文面は netlify/lib/order-slack.js）
      let nekoposMax = 10;
      try { nekoposMax = require('../../data/samples.json').nekoposMax || 10; } catch (e) {}
      let slackMsg;
      try {
        slackMsg = orderSlack.buildOrderSlackText({ session: fullSession, sessionId: session.id, giftSetLib, giftCardLib, nekoposMax }).text;
      } catch (buildErr) {
        // 文面づくりで失敗しても、注文があったことだけは必ず知らせる
        console.error('[Slack] order text build failed:', buildErr);
        slackMsg = [
          `【要対応・発送】新規注文｜${customerName} 様｜送り方はCSVで確認`,
          '※商品の表示に失敗しました。中身はCSVで確認し、四宮さんに知らせてください。',
          `<https://collegrance.com/.netlify/functions/shipping-csv?session=${session.id}|CSVをダウンロード>`,
        ].join('\n');
      }

      await sendSlackMessage(slackMsg);

      // Send receipt email via Stripe
      if (paymentIntent && customerEmail && customerEmail !== '不明') {
        try {
          await stripe.paymentIntents.update(paymentIntent, {
            receipt_email: customerEmail,
          });
          console.log(`Receipt email sent to ${customerEmail}`);
        } catch (emailErr) {
          console.error('Failed to send receipt email:', emailErr.message);
        }
      }

      // --- Future: Google Spreadsheet logging ---
      // TODO: Append order data to Google Sheet
      // const { google } = require('googleapis');
      // const auth = new google.auth.GoogleAuth({ ... });
      // const sheets = google.sheets({ version: 'v4', auth });
      // await sheets.spreadsheets.values.append({ ... });

    } catch (err) {
      console.error('Error processing checkout.session.completed:', err);
      // Still return 200 so Stripe doesn't retry
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true }),
  };
};
