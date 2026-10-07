const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// ギフトセット定義（data/gift-set.json）。読めなくても通常商品の決済は止めない（ギフトセット行だけ400）
let giftSetLib = null;
try { giftSetLib = require('../lib/gift-set'); } catch (e) { console.error('[giftset] lib load failed:', e.message); }
const isGiftSetItem = (item) => !!item && (String(item.productId) === '9001' || (item.giftSet && typeof item.giftSet === 'object'));

// === 価格はサーバー側で決める（2026-10-07） ===
// 従来は price_data.unit_amount にクライアントの price をそのまま使っていた（改ざんで1円決済が作れた）。
// ・ギフトセット … data/gift-set.json の価格表で再計算（香りNo・ケース色はホワイトリスト検証）
// ・通常商品   … products.json の sellPrice を使う（関数と同じデプロイで同梱される＝ページと同じ版）
// products.json が読めない時だけは、全決済を止めないためにクライアント値で通す（ログに残す）。
let PRODUCT_BY_ID = null;
try {
  const list = require('../../products.json');
  PRODUCT_BY_ID = new Map(list.map((p) => [String(p.id), p]));
} catch (e) {
  console.error('[price] products.json load failed — falling back to client prices:', e.message);
}

/** index.html の doCheckout() と同じ組み立てで商品名を作る（伝票の品名もここから作られる） */
function productDisplayName(p) {
  return (p.brand ? p.brand + ' - ' : '') + p.name + (p.nameJa ? ' (' + p.nameJa + ')' : '') + (p.tester ? '【テスター品】' : '');
}

// 2026-05-13: 送料を全商品価格に内包したため、Stripe側送料は常に¥0
const FREE_SHIP_THRESHOLD = 0;
const SHIPPING_AMOUNT = 0;
const GIFT_WRAP_AMOUNT = 300;
const SITE_URL = 'https://collegrance.com';
const ALLOWED_ORIGINS = ['https://collegrance.com', 'https://www.collegrance.com'];

// 簡易インメモリレート制限（Netlify Functionsは関数インスタンスごとに保持される）
// 同一IP+UAから60秒以内に30回まで（キャリア回線は多数の端末が同一IPを共有するため、IP単独・3回では正規ユーザーを弾く）
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;

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
  const rateKey = ip + '|' + String(event.headers['user-agent'] || '').slice(0, 80);
  if (!checkRateLimit(rateKey)) {
    console.warn('[BLOCKED] Rate limit exceeded:', { ip });
    return { statusCode: 429, body: JSON.stringify({ error: '短時間にアクセスが集中しています。1分ほど待ってからもう一度お試しください。' }) };
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

    // === 価格・商品名をサーバー側で確定 ===
    const giftSetRows = []; // session metadata の gs1, gs2… 用
    const resolved = [];
    for (const item of items) {
      if (isGiftSetItem(item)) {
        const gs = giftSetLib ? giftSetLib.resolveGiftSet(item.giftSet) : { ok: false, error: 'ギフトセットは現在お取り扱いできません。時間をおいてお試しください' };
        if (!gs.ok) {
          console.warn('[giftset] rejected:', { giftSet: item.giftSet, error: gs.error, ip });
          return { statusCode: 400, body: JSON.stringify({ error: gs.error }) };
        }
        if (item.price !== gs.unitAmount) {
          console.warn('[price] giftset client price mismatch:', { client: item.price, server: gs.unitAmount, key: gs.key });
        }
        // 同じ組み合わせが別行で来たらまとめる
        const same = resolved.find((r) => r.key === gs.key);
        if (same) { same.quantity += item.quantity; continue; }
        resolved.push({
          key: gs.key,
          name: gs.name,
          unitAmount: gs.unitAmount,
          quantity: item.quantity,
          image: giftSetLib.CONFIG.image,
          productMeta: {
            collegrance_product_id: String(giftSetLib.PRODUCT_ID),
            gift_scents: gs.scents.map((s) => s.no).join(','),
            gift_case: gs.kase.id,
          },
          giftSet: gs,
        });
        continue;
      }

      let name = item.name;
      let unitAmount = item.price;
      let image = item.image || '';
      if (PRODUCT_BY_ID) {
        const p = PRODUCT_BY_ID.get(String(item.productId));
        if (!p || typeof p.sellPrice !== 'number' || p.sellPrice <= 0) {
          console.warn('[price] unknown product:', { productId: item.productId, ip });
          return { statusCode: 400, body: JSON.stringify({ error: 'お取り扱いのない商品が含まれています。ページを再読み込みしてカートをご確認ください' }) };
        }
        if (p.inStock === false) {
          return { statusCode: 400, body: JSON.stringify({ error: `「${p.nameJa || p.name}」は在庫切れになりました。カートから外してお進みください` }) };
        }
        if (item.price !== p.sellPrice) {
          console.warn('[price] client price mismatch:', { productId: item.productId, client: item.price, server: p.sellPrice });
        }
        unitAmount = p.sellPrice;
        name = productDisplayName(p);
        image = p.img || image;
      }
      resolved.push({
        name,
        unitAmount,
        quantity: item.quantity,
        image,
        productMeta: { collegrance_product_id: String(item.productId) },
      });
    }

    for (const r of resolved) {
      if (r.giftSet) giftSetRows.push(r.giftSet.metaValue + (r.quantity > 1 ? `|x${r.quantity}` : ''));
    }
    const hasGiftSet = giftSetRows.length > 0;

    // Build line_items from cart
    const line_items = resolved.map((item) => {
      const images = [];
      if (item.image) {
        if (item.image.startsWith('http')) {
          images.push(item.image);
        } else {
          images.push(SITE_URL + '/' + item.image.replace(/^\//, ''));
        }
      }

      return {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: item.name,
            metadata: item.productMeta,
            ...(images.length ? { images } : {}),
          },
          unit_amount: item.unitAmount, // JPY is zero-decimal（サーバー側で確定した価格）
        },
        quantity: item.quantity,
      };
    });

    // ギフトセットは巾着・メッセージカード込みなので、ラッピング（+300円）は付けない
    if (giftWrap && hasGiftSet) {
      console.log('[giftset] giftWrap ignored (included in gift set)');
    }

    // Gift wrapping line item
    if (giftWrap && !hasGiftSet) {
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
    const subtotal = resolved.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
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

    // ギフトのお渡し方法（2026-09-18 追加）
    //   self   = 購入者が受け取って手渡し → カードは未記入で同梱
    //   direct = 相手に直送 → カードに gift_message を記入、gift_sender を贈り主として記載
    // すべて任意入力。旧フロント（キャッシュされたページ）からは来ないので、未指定は 'self' 扱いにして決済は止めない。
    // Stripe metadata は1値500文字までなので、念のためここでも長さと制御文字を落とす。
    const cleanGiftText = (v, max) => String(v == null ? '' : v)
      .replace(/\r?\n/g, ' / ')
      .replace(/[ -]/g, ' ')
      .trim()
      .slice(0, max);
    // ギフトセットはラッピングの有無に関係なくお渡し方法を持つ（メッセージは手渡しでもカードに印字する）
    const giftWrapCharged = !!giftWrap && !hasGiftSet;
    const giftMode = (giftWrapCharged || hasGiftSet) ? ((metadata && metadata.gift_mode) === 'direct' ? 'direct' : 'self') : '';
    const withMessage = giftMode === 'direct' || (hasGiftSet && giftMode === 'self');

    // LINE内ブラウザ → 外部ブラウザへ引き継いで来た決済か（2026-10-05）。効果測定用。既知の値だけ通す
    const handoff = (metadata && metadata.handoff === 'line_external') ? 'line_external' : '';

    const sessionMetadata = {
      channel: (metadata && metadata.channel) || 'direct',
      ...(handoff ? { handoff } : {}),
      gift_wrap: giftWrapCharged ? 'yes' : 'no',
      ...(giftMode ? { gift_mode: giftMode } : {}),
      ...(withMessage ? { gift_message: cleanGiftText(metadata.gift_message, 200) } : {}),
      ...(giftMode === 'direct' ? { gift_sender: cleanGiftText(metadata.gift_sender, 40) } : {}),
      // ギフトセットの内訳（gs1=030,018,039|エクリュ[|x2]）。Stripe metadata は50キー・1値500文字まで（行は最大20）
      ...(hasGiftSet ? { gift_set_count: String(giftSetRows.length) } : {}),
      ...Object.fromEntries(giftSetRows.map((v, i) => [`gs${i + 1}`, v.slice(0, 500)])),
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
      // 決済画面の「戻る」はカートを開いた状態で戻す（2026-10-05。従来はトップに戻りカートが見えなかった）
      cancel_url: SITE_URL + '/?cart=1',
      // ⚠️ consent_collection.promotions は日本のアカウントでは使えない（Stripe が "not available in your country" で
      //    セッション作成ごと拒否する＝全決済が止まる。2026-10-05 実測）。Stripe のカゴ落ちメール回収は日本では不可
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
