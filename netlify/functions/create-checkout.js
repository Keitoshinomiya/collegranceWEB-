const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 2026-05-13: 送料を全商品価格に内包したため、Stripe側送料は常に¥0
const FREE_SHIP_THRESHOLD = 0;
const SHIPPING_AMOUNT = 0;
const GIFT_WRAP_AMOUNT = 300;
const SITE_URL = 'https://collegrance.com';
const ALLOWED_ORIGINS = ['https://collegrance.com', 'https://www.collegrance.com'];

// 簡易インメモリレート制限（Netlify Functionsは関数インスタンスごとに保持される）
// 同一IPから60秒以内に3回まで
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;

function getClientIp(event) {
  const xff = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'];
  if (xff) return xff.split(',')[0].trim();
  return event.headers['client-ip'] || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  // 古いレコードを掃除（メモリリーク防止）
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

exports.handler = async (event) => {
  // Only allow POST
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

  // === Bot対策2: User-Agentチェック（明らかなBotを弾く）===
  const ua = (event.headers['user-agent'] || event.headers['User-Agent'] || '').toLowerCase();
  if (!ua || /bot|crawler|spider|scrape|curl|wget|python-requests|postman|httpie/.test(ua)) {
    console.warn('[BLOCKED] Suspicious UA:', { ua, ip: getClientIp(event) });
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  // === Bot対策3: レート制限 ===
  const ip = getClientIp(event);
  if (!checkRateLimit(ip)) {
    console.warn('[BLOCKED] Rate limit exceeded:', { ip });
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests. Please wait a moment.' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { items, giftWrap, metadata, couponCode } = body;

    // === Bot対策4: metadata必須化（フロントエンドからのリクエストには必ず付く）===
    if (!metadata || typeof metadata !== 'object' || !('channel' in metadata)) {
      console.warn('[BLOCKED] Missing metadata:', { ip, ua });
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
    }

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'カートが空です' }) };
    }

    // === Bot対策5: items構造の妥当性チェック ===
    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || item.price <= 0 || item.price > 100000) {
        console.warn('[BLOCKED] Invalid item:', { item, ip });
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid item data' }) };
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 20) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid quantity' }) };
      }
    }
    if (items.length > 20) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Too many items' }) };
    }

    // Build line_items from cart
    const line_items = items.map((item) => {
      const images = [];
      if (item.image) {
        if (item.image.startsWith('http')) {
          images.push(item.image);
        } else {
          images.push(SITE_URL + '/' + item.image);
        }
      }

      return {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: item.name,
            metadata: { collegrance_product_id: String(item.productId) },
            ...(images.length ? { images } : {}),
          },
          unit_amount: item.price, // JPY is zero-decimal
        },
        quantity: item.quantity,
      };
    });

    // Gift wrapping line item
    if (giftWrap) {
      line_items.push({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'ギフトラッピング',
          },
          unit_amount: GIFT_WRAP_AMOUNT,
        },
        quantity: 1,
      });
    }

    // Calculate subtotal for shipping logic
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isFreeShipping = subtotal >= FREE_SHIP_THRESHOLD;

    // Shipping options
    const shipping_options = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: isFreeShipping ? 0 : SHIPPING_AMOUNT,
            currency: 'jpy',
          },
          display_name: '送料無料',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 2 },
            maximum: { unit: 'business_day', value: 5 },
          },
        },
      },
    ];

    // === クーポンコード事前適用 (2026-05-14: PRJ-001 Phase 1) ===
    // ユーザーがLINEで受け取った CLG-XXX 等のコードを Stripe Promotion Code に変換
    // promotion_code は ID 必要なので、code文字列から逆引きする
    let discounts = undefined;
    let appliedCouponInfo = null;
    if (couponCode && typeof couponCode === 'string') {
      const normalizedCode = couponCode.trim().toUpperCase();
      // 許可するプレフィックス（衝突回避用ホワイトリスト）
      const ALLOWED_PREFIXES = ['CLG-', 'AID-', 'LIN-', 'LCK-', 'FBL-'];
      const isKnownPrefix = ALLOWED_PREFIXES.some(p => normalizedCode.startsWith(p));
      if (isKnownPrefix) {
        try {
          const list = await stripe.promotionCodes.list({ code: normalizedCode, active: true, limit: 1 });
          if (list.data.length > 0) {
            const promo = list.data[0];
            discounts = [{ promotion_code: promo.id }];
            appliedCouponInfo = {
              code: promo.code,
              id: promo.id,
              coupon_id: promo.coupon && promo.coupon.id,
            };
            console.log('[coupon] pre-applied:', normalizedCode, '→', promo.id);
          } else {
            // 見つからないけど、Stripe checkout の手入力欄を残すので致命的ではない
            console.warn('[coupon] code not found:', normalizedCode);
          }
        } catch (couponErr) {
          // クーポンエラーで決済自体は止めない（手入力可能）
          console.error('[coupon] lookup failed:', couponErr.message);
        }
      } else {
        console.warn('[coupon] rejected unknown prefix:', normalizedCode);
      }
    }

    // Session metadata
    // line_friend_id: LINE経由訪問時にlocalStorageから渡される。Stripe webhook → line-harness Worker で
    // friends と紐付けて customer_web タグ付与・購入資産化に使用される（INTEGRATION_CONTRACT.md参照）
    const rawLineFriendId = (metadata && metadata.line_friend_id) || '';
    const lineFriendId = (typeof rawLineFriendId === 'string' && /^[a-zA-Z0-9-]{6,64}$/.test(rawLineFriendId))
      ? rawLineFriendId
      : '';

    const sessionMetadata = {
      channel: (metadata && metadata.channel) || 'direct',
      gift_wrap: giftWrap ? 'yes' : 'no',
      diagnosis_session_id: (metadata && metadata.diagnosis_session_id) || '',
      ...(lineFriendId ? { line_friend_id: lineFriendId } : {}),
      ...(appliedCouponInfo ? { applied_coupon_code: appliedCouponInfo.code } : {}),
    };

    // Create Checkout Session
    // 注意: discounts と allow_promotion_codes は同時指定不可
    // → 事前適用クーポンがある場合は手入力欄をオフ、ない場合のみオン
    const sessionParams = {
      mode: 'payment',
      locale: 'ja',
      line_items,
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
      shipping_options,
      success_url: SITE_URL + '/?ok=1&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: SITE_URL + '/',
      metadata: sessionMetadata,
      payment_intent_data: {
        metadata: sessionMetadata,
        receipt_email: undefined, // Will use customer email from checkout form
      },
      customer_creation: 'always',
      invoice_creation: {
        enabled: true,
      },
      // ヤマトB2クラウド伝票発行に必要なため電話番号を必須化
      phone_number_collection: {
        enabled: true,
      },
    };
    if (discounts) {
      sessionParams.discounts = discounts;
    } else {
      // クーポン未指定時のみ手入力欄を表示（StripeのDBレベルで制約）
      sessionParams.allow_promotion_codes = true;
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('create-checkout error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
