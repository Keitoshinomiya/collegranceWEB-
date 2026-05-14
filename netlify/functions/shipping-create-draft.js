/**
 * 発送通知メール送信 — Gmail SMTP (App Password)
 *
 * Input (POST JSON):
 *   { sessionId, to, subject, body, trackingNumber, shipDate }
 *
 * 動作:
 *   1. Stripe Session の metadata に shipping_notified / tracking_number を記録
 *   2. Nodemailer + Gmail SMTP で実送信
 *   3. Slack #collegrance に送信ログ通知
 *
 * テストモード:
 *   環境変数 GMAIL_TEST_OVERRIDE_TO が設定されている場合、
 *   すべてのメールがそのアドレスにリダイレクトされる。
 *   件名に [テスト送信→本来: <実宛先>] プレフィックスが付く。
 *
 * 必要な環境変数:
 *   - GMAIL_FROM_EMAIL       送信元アドレス (info@collegrance.com)
 *   - GMAIL_APP_PASSWORD     Gmail アプリパスワード（2FA有効化後に生成、空白なし16文字）
 *   - GMAIL_TEST_OVERRIDE_TO (任意) テスト用リダイレクト先
 *   - STRIPE_SECRET_KEY      Stripeセッション metadata 更新用
 *   - SLACK_WEBHOOK_URL      (任意) Slack 通知用
 */
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const GMAIL_FROM = process.env.GMAIL_FROM_EMAIL || 'info@collegrance.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const TEST_OVERRIDE_TO = process.env.GMAIL_TEST_OVERRIDE_TO || '';

// SMTPトランスポート（Gmail）
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!GMAIL_PASS) {
    throw new Error('GMAIL_APP_PASSWORD 環境変数が設定されていません');
  }
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_FROM,
      pass: GMAIL_PASS.replace(/\s+/g, ''),  // 万一空白付きで渡されても除去
    },
  });
  return transporter;
}

async function notifySlack(text) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.error('Slack通知失敗:', e.message);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { sessionId, to: originalTo, subject: originalSubject, body: emailBody, trackingNumber, shipDate } = body;

    if (!sessionId || !originalTo || !originalSubject || !emailBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'sessionId, to, subject, body は必須' }),
      };
    }

    // テストモード判定: TEST_OVERRIDE_TO が設定されていれば全メールをそこにリダイレクト
    const isTestMode = !!TEST_OVERRIDE_TO;
    const actualTo = isTestMode ? TEST_OVERRIDE_TO : originalTo;
    const actualSubject = isTestMode
      ? `[テスト送信→本来: ${originalTo}] ${originalSubject}`
      : originalSubject;

    // === Gmail SMTP で送信 ===
    let sendResult;
    try {
      const t = getTransporter();
      sendResult = await t.sendMail({
        from: `COLLEGRANCE <${GMAIL_FROM}>`,
        to: actualTo,
        subject: actualSubject,
        text: emailBody,
        replyTo: GMAIL_FROM,
      });
    } catch (sendErr) {
      console.error('SMTP send failed:', sendErr.message);
      await notifySlack(
        `🚨 *発送通知メール送信失敗*\n宛先: ${actualTo}\n件名: ${actualSubject}\nエラー: ${sendErr.message}`
      );
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `メール送信に失敗しました: ${sendErr.message}`,
        }),
      };
    }

    // === Stripe Session metadata 更新 ===
    try {
      const currentMeta = (await stripe.checkout.sessions.retrieve(sessionId)).metadata || {};
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          ...currentMeta,
          shipping_notified: new Date().toISOString(),
          tracking_number: trackingNumber || '',
          ship_date: shipDate || '',
          ...(isTestMode ? { test_mode: 'true' } : {}),
        },
      });
    } catch (metaErr) {
      console.error('Stripe metadata update failed:', metaErr.message);
      // 致命的ではないので送信成功は返す
    }

    // === Slack 通知 ===
    const slackMsg = isTestMode
      ? `📧 *[テスト送信]* 発送通知メール送信完了\n宛先(テスト): ${actualTo}\n本来宛先: ${originalTo}\n件名: ${originalSubject}\n追跡番号: ${trackingNumber || '未指定'}\nmessageId: ${sendResult.messageId}`
      : `📧 *発送通知メール送信完了*\n宛先: ${actualTo}\n件名: ${originalSubject}\n追跡番号: ${trackingNumber || '未指定'}\nmessageId: ${sendResult.messageId}`;
    await notifySlack(slackMsg);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: isTestMode
          ? `✅ テスト送信完了 (${actualTo} 宛, 本来は ${originalTo})`
          : `✅ 送信完了 (${actualTo})`,
        testMode: isTestMode,
        messageId: sendResult.messageId,
        sentTo: actualTo,
        originalTo,
      }),
    };
  } catch (err) {
    console.error('shipping-create-draft error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
