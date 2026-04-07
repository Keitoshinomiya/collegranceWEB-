const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SLACK_CHANNEL = 'C091LDC8MKN';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

/**
 * Send a message to Slack via Web API (chat.postMessage)
 */
async function sendSlackMessage(text) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel: SLACK_CHANNEL,
      text,
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error('Slack API error:', data.error);
  }
  return data;
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

      // Build product lines
      const lineItems = fullSession.line_items?.data || [];
      let subtotal = 0;
      let shippingAmount = 0;
      const productLines = [];
      let hasGiftWrap = metadata.gift_wrap === 'yes';

      for (const item of lineItems) {
        const name = item.description || item.price?.product?.name || '商品';
        const qty = item.quantity || 1;
        const amount = item.amount_total || 0;

        productLines.push(`• ${name} x ${qty}  ¥${amount.toLocaleString()}`);
        subtotal += amount;
      }

      // Get shipping cost from session
      if (fullSession.total_details?.amount_shipping != null) {
        shippingAmount = fullSession.total_details.amount_shipping;
      } else if (fullSession.shipping_cost?.amount_total != null) {
        shippingAmount = fullSession.shipping_cost.amount_total;
      }

      const total = fullSession.amount_total || 0;
      const shippingAddress = formatAddress(fullSession.shipping_details);

      // Build Slack message
      const slackMsg = [
        ':shopping_cart: *新規注文*',
        '',
        `注文者: ${customerName}`,
        `メール: ${customerEmail}`,
        '',
        '商品:',
        ...productLines,
        '',
        `小計: ¥${subtotal.toLocaleString()}`,
        `送料: ¥${shippingAmount.toLocaleString()}`,
        `ギフトラッピング: ${hasGiftWrap ? 'あり' : 'なし'}`,
        `合計: ¥${total.toLocaleString()}`,
        '',
        `配送先: ${shippingAddress}`,
        '',
        `Stripeダッシュボード: https://dashboard.stripe.com/payments/${paymentIntent}`,
      ].join('\n');

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
