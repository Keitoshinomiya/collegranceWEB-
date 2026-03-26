/**
 * COLLEGRANCE Campaign Notification Dispatch API
 * POST /api/notify
 *
 * Headers: { x-admin-secret: <ADMIN_SECRET env var> }
 * Body: { campaign: "line-exclusive-2025", message: "..." }
 *
 * - Iterates all registrations for the campaign
 * - Sends email via Resend API (EMAIL registrations)
 * - Sends LINE message via LINE Notify API (LINE registrations)
 * - Marks each record as notified: true
 */

const { getStore } = require('@netlify/blobs');

// ── helpers ────────────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'COLLEGRANCE <noreply@collegrance.com>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

async function sendLineNotify(token, message) {
  const res = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ message }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE Notify error: ${err}`);
  }
  return res.json();
}

// ── HTML email template ────────────────────────────────────────────────────

function buildEmailHtml(couponCode) {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border:1px solid #e5e5e5;">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:24px;text-align:center;">
          <span style="color:#fff;font-size:18px;letter-spacing:0.15em;font-family:Georgia,serif;">COLLEGRANCE</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 28px;">
          <p style="font-size:13px;color:#666;margin:0 0 16px;">お待たせしました。</p>
          <h1 style="font-size:22px;font-weight:400;color:#1a1a1a;margin:0 0 20px;line-height:1.5;">
            LINE友達限定<br><strong>20% OFF クーポンが解放されました！</strong>
          </h1>
          <p style="font-size:13px;color:#444;line-height:1.8;margin:0 0 24px;">
            2日間限定のキャンペーンが開始しました。<br>
            下記のプロモーションコードをAmazonのカート画面でご入力ください。
          </p>
          <!-- Coupon Box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:#e8f8ee;border:2px solid #06C755;padding:18px;text-align:center;">
                <div style="font-size:11px;color:#059144;letter-spacing:0.2em;margin-bottom:8px;">COUPON CODE</div>
                <div style="font-family:Georgia,serif;font-size:28px;color:#1a1a1a;letter-spacing:0.3em;">${couponCode}</div>
              </td>
            </tr>
          </table>
          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:0 0 24px;">
                <a href="https://collegrance.com/campaign-line-exclusive.html"
                   style="display:inline-block;background:#FF9900;color:#1a1a1a;font-weight:700;font-size:14px;letter-spacing:0.06em;padding:14px 36px;text-decoration:none;">
                  キャンペーンページを見る →
                </a>
              </td>
            </tr>
          </table>
          <!-- Steps -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;">
            <tr><td style="background:#f7f7f7;padding:12px 16px;border-bottom:1px solid #e5e5e5;">
              <span style="font-size:12px;font-weight:700;color:#06C755;">STEP 1</span>
              <span style="font-size:12px;color:#333;margin-left:8px;">Amazonで商品ページを開く</span>
            </td></tr>
            <tr><td style="background:#f7f7f7;padding:12px 16px;border-bottom:1px solid #e5e5e5;">
              <span style="font-size:12px;font-weight:700;color:#06C755;">STEP 2</span>
              <span style="font-size:12px;color:#333;margin-left:8px;">カートに入れてレジへ進む</span>
            </td></tr>
            <tr><td style="background:#f7f7f7;padding:12px 16px;">
              <span style="font-size:12px;font-weight:700;color:#06C755;">STEP 3</span>
              <span style="font-size:12px;color:#333;margin-left:8px;"><strong>${couponCode}</strong> を入力して適用</span>
            </td></tr>
          </table>
          <p style="font-size:11px;color:#999;margin:20px 0 0;line-height:1.7;">
            ※ 有効期限: 2025年3月30日 23:59まで<br>
            ※ Amazonの表示価格には影響しません。カート画面でのみ適用されます。
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f7f7f7;border-top:1px solid #e5e5e5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#bbb;margin:0;">© 2025 COLLEGRANCE. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── main handler ───────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Admin auth
  const secret = process.env.ADMIN_SECRET;
  if (secret && event.headers['x-admin-secret'] !== secret) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
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

  const { campaign = 'line-exclusive-2025', couponCode = 'COLLELINE' } = body;
  const lineMessage = `\n【COLLEGRANCE】\nLINE友達限定クーポンが解放されました！\n\nクーポンコード: ${couponCode}\n有効期限: 3/30 23:59まで\n\n▼キャンペーンページ\nhttps://collegrance.com/campaign-line-exclusive.html\n\nAmazonのカート画面でコードを入力してください。`;

  const emailSubject = '【COLLEGRANCE】LINE友達限定クーポンが解放されました！';
  const emailHtml = buildEmailHtml(couponCode);

  try {
    const store = getStore({ name: 'campaign-notifications', consistency: 'strong' });
    const { blobs } = await store.list({ prefix: `${campaign}:` });

    let emailOk = 0, emailFail = 0, lineOk = 0, lineFail = 0;

    for (const blob of blobs) {
      const record = await store.get(blob.key, { type: 'json' });
      if (!record || record.notified) continue;

      try {
        if (record.type === 'email') {
          await sendEmail(record.value, emailSubject, emailHtml);
          emailOk++;
        } else if (record.type === 'line') {
          await sendLineNotify(record.value, lineMessage);
          lineOk++;
        }
        // Mark as notified
        await store.setJSON(blob.key, { ...record, notified: true, notifiedAt: new Date().toISOString() });
      } catch (err) {
        console.error(`Failed to notify ${blob.key}:`, err.message);
        if (record.type === 'email') emailFail++;
        else lineFail++;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        total: blobs.length,
        email: { ok: emailOk, fail: emailFail },
        line: { ok: lineOk, fail: lineFail },
      }),
    };
  } catch (err) {
    console.error('Notify error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
