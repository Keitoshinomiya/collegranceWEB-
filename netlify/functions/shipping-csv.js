/**
 * ヤマトB2クラウド 伝票発行用CSV生成エンドポイント
 *
 * 使い方:
 *   GET /.netlify/functions/shipping-csv?session=cs_live_xxx
 *
 * → Stripe Checkout Session の情報からB2クラウド形式のCSVを生成して返却。
 *    ファイル名: shipping_<注文番号>.csv （Shift_JIS、ヘッダ行付き）
 *    ダウンロード後、B2クラウドの「ファイル取り込み」にアップロードすれば伝票発行可能。
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const iconv = require('iconv-lite');

// 発送元情報（ご依頼主）
const SENDER = {
  phone: '050-5527-2641',
  postal: '5630032',
  addressFirst: '大阪府池田市石橋1-15-33',
  addressSecond: '平尾ビル2F',
  name: '合同会社ヤシノミ',
};

// B2クラウド CSV ヘッダー（基本29列構成）
const CSV_HEADERS = [
  'お客様管理番号',         // 1
  '送り状種類',              // 2 (0=発払)
  'クール区分',              // 3 (0=通常)
  '伝票番号',                // 4 (空欄=自動採番)
  '出荷予定日',              // 5
  'お届け予定日',            // 6
  '配達時間帯',              // 7 (0=指定なし)
  'お届け先コード',          // 8
  'お届け先電話番号',        // 9
  'お届け先電話番号枝番',    // 10
  'お届け先郵便番号',        // 11
  'お届け先住所',            // 12
  'お届け先アパートマンション名', // 13
  'お届け先会社・部門名1',   // 14
  'お届け先会社・部門名2',   // 15
  'お届け先名',              // 16
  'お届け先名(カナ)',        // 17
  'お届け先敬称',            // 18 (様)
  'ご依頼主コード',          // 19
  'ご依頼主電話番号',        // 20
  'ご依頼主電話番号枝番',    // 21
  'ご依頼主郵便番号',        // 22
  'ご依頼主住所',            // 23
  'ご依頼主アパートマンション名', // 24
  'ご依頼主名',              // 25
  'ご依頼主名(カナ)',        // 26
  '品名コード1',             // 27
  '品名1',                   // 28
  '品名コード2',             // 29
  '品名2',                   // 30
  '荷扱い1',                 // 31
  '荷扱い2',                 // 32
  '記事',                    // 33
  'コレクト代金引換金額',    // 34
  'コレクト内消費税額等',    // 35
];

/**
 * 日付フォーマット（B2クラウド: YYYY/MM/DD）
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * 営業日加算（土日除外）
 */
function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) added++;
  }
  return d;
}

/**
 * CSV値のエスケープ（カンマやダブルクォート対応）
 */
function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters?.session;

  if (!sessionId) {
    return {
      statusCode: 400,
      body: 'session parameter required',
    };
  }

  try {
    // Stripeセッション取得（line_items含む）
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    if (session.status !== 'complete') {
      return {
        statusCode: 400,
        body: `セッションが完了状態ではありません: status=${session.status}`,
      };
    }

    const customerDetails = session.customer_details || {};
    const shippingDetails = session.shipping_details || customerDetails;
    const addr = shippingDetails.address || customerDetails.address || {};

    // 注文番号（管理番号）
    const orderNumber = session.id.replace('cs_live_', '').slice(0, 20);

    // お届け予定日（営業日2日後 → 配達は3〜5日後で安全側）
    const today = new Date();
    const shipDate = addBusinessDays(today, 1);    // 翌営業日に発送想定
    const arriveDate = addBusinessDays(today, 4);  // 4営業日後到着想定

    // 商品名
    const lineItems = session.line_items?.data || [];
    const productNames = lineItems
      .filter((item) => !/送料|ギフトラッピング/.test(item.description || ''))
      .map((item) => `${item.description}${item.quantity > 1 ? ` x${item.quantity}` : ''}`);
    const productName1 = productNames[0] || '香水';
    const productName2 = productNames.slice(1).join(' / ') || '';

    // 住所を「番地まで」と「建物名」に分割（B2クラウドの仕様）
    const addressLine1 = addr.line1 || '';
    const addressLine2 = addr.line2 || '';

    // 郵便番号（ハイフンなし）
    const postalDest = (addr.postal_code || '').replace(/-/g, '');

    // 電話番号（ハイフン整形維持）
    const phone = customerDetails.phone || '';

    // ご依頼主住所
    const senderAddrFull = SENDER.addressFirst;
    const senderAddrSecond = SENDER.addressSecond;

    // 1行のCSVデータ
    const row = [
      orderNumber,                             // お客様管理番号
      '0',                                     // 送り状種類: 発払
      '0',                                     // クール区分: 通常
      '',                                      // 伝票番号: 空欄（自動採番）
      formatDate(shipDate),                    // 出荷予定日
      formatDate(arriveDate),                  // お届け予定日
      '0',                                     // 配達時間帯: 指定なし
      '',                                      // お届け先コード
      phone,                                   // お届け先電話番号
      '',                                      // お届け先電話番号枝番
      postalDest,                              // お届け先郵便番号
      `${addr.state || ''}${addr.city || ''}${addressLine1}`,  // お届け先住所
      addressLine2,                            // お届け先アパートマンション名
      '',                                      // お届け先会社・部門名1
      '',                                      // お届け先会社・部門名2
      customerDetails.name || '',              // お届け先名
      '',                                      // お届け先名(カナ)
      '様',                                    // お届け先敬称
      '',                                      // ご依頼主コード
      SENDER.phone,                            // ご依頼主電話番号
      '',                                      // ご依頼主電話番号枝番
      SENDER.postal,                           // ご依頼主郵便番号
      senderAddrFull,                          // ご依頼主住所
      senderAddrSecond,                        // ご依頼主アパートマンション名
      SENDER.name,                             // ご依頼主名
      '',                                      // ご依頼主名(カナ)
      '',                                      // 品名コード1
      productName1,                            // 品名1
      '',                                      // 品名コード2
      productName2,                            // 品名2
      '',                                      // 荷扱い1
      '',                                      // 荷扱い2
      `Order ${orderNumber}`,                  // 記事
      '',                                      // コレクト代金引換金額
      '',                                      // コレクト内消費税額等
    ];

    // CSV生成（ヘッダ + 1行）
    const csvText = [
      CSV_HEADERS.map(escapeCsv).join(','),
      row.map(escapeCsv).join(','),
    ].join('\r\n');

    // Shift_JISエンコード（B2クラウド標準）
    const csvBuffer = iconv.encode(csvText, 'Shift_JIS');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=Shift_JIS',
        'Content-Disposition': `attachment; filename="shipping_${orderNumber}.csv"`,
        'Cache-Control': 'no-store',
      },
      body: csvBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('shipping-csv error:', err);
    return {
      statusCode: 500,
      body: `Error: ${err.message}`,
    };
  }
};
