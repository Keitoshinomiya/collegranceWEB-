/**
 * 発送通知メール下書き作成（Stripe metadata更新 + 将来的にGmail API連携）
 *
 * Input (POST JSON):
 *   { sessionId, to, subject, body, trackingNumber, shipDate }
 *
 * 動作:
 *   1. Stripe Session の metadata に shipping_notified / tracking_number を記録
 *   2. （現状POC）メール本文を Slack #collegrance に通知（オペレータ確認用）
 *   3. （将来）Gmail API or SMTP で実送信に切替予定
 *
 * セキュリティ:
 *   - 本番運用時は HTTP Basic 認証 or Cloudflare Access 必須
 *   - 現状は Netlify _redirects で /admin/* に Basic 認証を設定する想定
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { sessionId, to, subject, body: emailBody, trackingNumber, shipDate } = body;

    if (!sessionId || !to || !subject || !emailBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'sessionId, to, subject, body は必須' }),
      };
    }

    // === Stripe Session の metadata を更新（発送済みフラグ + 追跡番号記録）===
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          shipping_notified: new Date().toISOString(),
          tracking_number: trackingNumber || '',
          ship_date: shipDate || '',
        },
      });
    } catch (metaErr) {
      console.error('Stripe metadata update failed:', metaErr.message);
      // 致命的ではないので継続（メール送信側を優先）
    }

    // === Gmail下書き作成（POC段階のスタブ実装）===
    // 本実装では Gmail API (OAuth) or SMTP (App Password) に置き換える。
    // 今は Slack #collegrance に通知して、オペレータが手で送信する想定。
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook) {
      try {
        const slackMsg = [
          '📧 *発送通知メール下書き作成リクエスト*',
          '',
          `*宛先:* ${to}`,
          `*件名:* ${subject}`,
          `*追跡番号:* ${trackingNumber || '未指定'}`,
          `*発送日:* ${shipDate || '未指定'}`,
          '',
          '*本文プレビュー:*',
          '```',
          emailBody.split('\n').slice(0, 8).join('\n') + '\n...',
          '```',
          '',
          `<https://dashboard.stripe.com/payments/${sessionId}|Stripe Dashboardで確認>`,
        ].join('\n');
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: slackMsg }),
        });
      } catch (slackErr) {
        console.error('Slack notification failed:', slackErr.message);
      }
    }

    // === 本実装プランの選択肢（コメント記載）===
    // Option A: Gmail API (OAuth refresh token)
    //   - users.drafts.create で下書き作成
    //   - 一番proper、ただしOAuth初期設定が必要
    // Option B: nodemailer + Gmail SMTP (App Password)
    //   - require('nodemailer'); transporter.sendMail({...})
    //   - App Password を Netlify env に保存 (GMAIL_APP_PASSWORD)
    //   - 即時送信になる（下書きではなく）
    // Option C: SendGrid / Mailgun API
    //   - 別途契約必要
    //
    // 推奨: Option B（実装30分、ユーザー側は info@collegrance.com の App Password を1回生成するだけ）

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: '✅ Stripe metadata 更新 + Slack通知完了（実送信は未実装）',
        sessionId,
        to,
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
