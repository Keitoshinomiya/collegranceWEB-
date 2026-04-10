const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const FREE_SHIP_THRESHOLD = 30000;
const SHIPPING_AMOUNT = 700;
const GIFT_WRAP_AMOUNT = 300;
const SITE_URL = 'https://collegrance.com';

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { items, giftWrap, metadata } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'カートが空です' }) };
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
          display_name: isFreeShipping ? '送料無料（¥30,000以上）' : '通常配送',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 2 },
            maximum: { unit: 'business_day', value: 5 },
          },
        },
      },
    ];

    // Session metadata
    const sessionMetadata = {
      channel: (metadata && metadata.channel) || 'direct',
      gift_wrap: giftWrap ? 'yes' : 'no',
      diagnosis_session_id: (metadata && metadata.diagnosis_session_id) || '',
    };

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'ja',
      line_items,
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
      shipping_options,
      success_url: SITE_URL + '/shop.html?ok=1&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: SITE_URL + '/shop.html',
      metadata: sessionMetadata,
      payment_intent_data: {
        metadata: sessionMetadata,
        receipt_email: undefined, // Will use customer email from checkout form
      },
      customer_creation: 'always',
      allow_promotion_codes: true,
      invoice_creation: {
        enabled: true,
      },
    });

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
