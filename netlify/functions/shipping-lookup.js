/**
 * 発送通知一括作成: CSV内の注文番号から Stripe Session 情報を逆引き取得
 *
 * Input (POST JSON):
 *   { orderNumbers: ['b14J8UTpAriSAbE63JeG', 'b1Z0BF6ObS37oU4iAHAI', ...] }
 *
 * Output:
 *   { results: [
 *       { orderNumberPrefix: 'b14J...', sessionId: 'cs_live_...',
 *         customerName, email, productName, status, amountTotal },
 *       ...
 *     ] }
 *
 * 注文番号は shipping-csv.js で `session.id.replace('cs_live_', '').slice(0, 20)` として
 * 切り詰めたものなので、Stripeセッション全件をlistして前方一致で照合する。
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const orderNumbers = (body.orderNumbers || []).filter(Boolean);
    if (!orderNumbers.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'orderNumbers required' }) };
    }

    // Stripe Session を直近60日分取得（最大100件×複数pages、ここでは1ページ100件まで）
    // 発送通知は通常完了後数日以内に行うので60日で十分
    const sixtyDaysAgo = Math.floor(Date.now() / 1000) - 60 * 86400;
    const allSessions = [];
    let hasMore = true;
    let startingAfter = undefined;
    while (hasMore && allSessions.length < 500) {
      const params = { created: { gte: sixtyDaysAgo }, limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const page = await stripe.checkout.sessions.list(params);
      allSessions.push(...page.data);
      hasMore = page.has_more;
      if (page.data.length) startingAfter = page.data[page.data.length - 1].id;
      else break;
    }

    // セッションIDから先頭20文字（shipping-csv.jsと同じ式）を作って辞書化
    const sessionByPrefix = new Map();
    for (const s of allSessions) {
      const prefix = s.id.replace('cs_live_', '').replace('cs_test_', '').slice(0, 20);
      sessionByPrefix.set(prefix, s);
    }

    // 各注文番号を照合
    const results = [];
    for (const orderNumber of orderNumbers) {
      const s = sessionByPrefix.get(orderNumber);
      if (!s) {
        results.push({ orderNumberPrefix: orderNumber, sessionId: null, status: 'not_found' });
        continue;
      }

      // line_items を取得して商品名を確定
      let productName = '';
      try {
        const full = await stripe.checkout.sessions.retrieve(s.id, { expand: ['line_items'] });
        const items = full.line_items?.data || [];
        const nonShipping = items.filter((it) => !/送料|ギフトラッピング/.test(it.description || ''));
        if (nonShipping.length > 0) {
          // 「ブランド - 商品名 (日本語)」形式から日本語抽出を試みる
          const desc = nonShipping[0].description || '';
          const ja = desc.match(/\(([^)]+)\)/);
          // 日本語があればそれ + 英語名、なければ英語名のみ
          productName = ja
            ? desc.replace(/\s*\([^)]*\)\s*/g, '').replace(/^[^-]*-\s*/, '').trim() + '（' + ja[1] + '）'
            : desc.replace(/^[^-]*-\s*/, '').trim();
          if (nonShipping.length > 1) productName += ' 他';
        }
      } catch (e) {
        console.error('line_items fetch failed:', e.message);
      }

      const cd = s.customer_details || {};
      results.push({
        orderNumberPrefix: orderNumber,
        sessionId: s.id,
        customerName: (cd.name || '').trim(),
        email: cd.email || '',
        productName: productName || '商品',
        status: s.status,
        amountTotal: s.amount_total || 0,
        shippingNotified: (s.metadata && s.metadata.shipping_notified) || null,
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ results }),
    };
  } catch (err) {
    console.error('shipping-lookup error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
