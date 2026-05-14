/**
 * ヤマトB2クラウド 外部データ取り込み用 CSV生成
 *
 * テンプレート: newb2web_template1.xls 「外部データ取り込み基本レイアウト」95列に準拠
 * 取り込み時は「ヘッダなし」を選択してください（このCSVはヘッダ行を出力しません）
 *
 * 使い方:
 *   GET /.netlify/functions/shipping-csv?session=cs_live_xxx
 *   GET /.netlify/functions/shipping-csv?session=cs_live_xxx&phone=09012345678
 *      → 電話番号がStripe側で空の場合、URLパラメータで補完可能
 *
 * オプション環境変数（B2クラウド契約者情報）:
 *   YAMATO_BILLING_CUSTOMER_CODE  ご請求先顧客コード（半角10〜12文字）
 *   YAMATO_BILLING_CLASS_CODE     ご請求先分類コード（半角3文字、任意）
 *   YAMATO_FREIGHT_CONTROL_NO     運賃管理番号（半角2文字）
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const iconv = require('iconv-lite');

// 発送元情報（ご依頼主）
const SENDER = {
  phone: '050-5527-2641',
  postal: '5630032',
  addressFirst: '大阪府池田市石橋1-15-33',
  addressSecond: '平尾ビル2F',
  name: 'COLLEGRANCE',
};

// お届け先電話番号が空の場合のフォールバック（弊社の代表番号）
const FALLBACK_RECIPIENT_PHONE = '08042421092';

// B2クラウド契約者情報（環境変数で上書き可能）
const BILLING_CUSTOMER_CODE = process.env.YAMATO_BILLING_CUSTOMER_CODE || '080424210981';
const BILLING_CLASS_CODE = process.env.YAMATO_BILLING_CLASS_CODE || '';
const FREIGHT_CONTROL_NO = process.env.YAMATO_FREIGHT_CONTROL_NO || '01';

// 95列フル仕様のCSV列定義（newb2web_template1.xls 「外部データ取り込み基本レイアウト」準拠）
// 各列の値を生成するマッピング
function buildRow(ctx) {
  const {
    orderNumber, shipDate, arriveDate,
    recipient, products, sender, articleMemo,
  } = ctx;

  // 95列を順番に埋める
  return [
    /*  1 */ orderNumber,                                                     // お客様管理番号
    /*  2 */ '0',                                                             // 送り状種類: 0=発払い
    /*  3 */ '0',                                                             // クール区分: 0=通常
    /*  4 */ '',                                                              // 伝票番号（B2クラウドにて付与）
    /*  5 */ shipDate,                                                        // 出荷予定日 YYYY/MM/DD
    /*  6 */ arriveDate,                                                      // お届け予定日 YYYY/MM/DD
    /*  7 */ '',                                                              // 配達時間帯（指定なし）
    /*  8 */ '',                                                              // お届け先コード
    /*  9 */ recipient.phone,                                                 // お届け先電話番号
    /* 10 */ '',                                                              // お届け先電話番号枝番
    /* 11 */ recipient.postal,                                                // お届け先郵便番号
    /* 12 */ recipient.address,                                               // お届け先住所
    /* 13 */ recipient.building,                                              // お届け先アパートマンション名
    /* 14 */ '',                                                              // お届け先会社・部門１
    /* 15 */ '',                                                              // お届け先会社・部門２
    /* 16 */ recipient.name,                                                  // お届け先名
    /* 17 */ '',                                                              // お届け先名(カナ)
    /* 18 */ '様',                                                             // 敬称
    /* 19 */ '',                                                              // ご依頼主コード
    /* 20 */ sender.phone,                                                    // ご依頼主電話番号
    /* 21 */ '',                                                              // ご依頼主電話番号枝番
    /* 22 */ sender.postal,                                                   // ご依頼主郵便番号
    /* 23 */ sender.addressFirst,                                             // ご依頼主住所
    /* 24 */ sender.addressSecond,                                            // ご依頼主アパートマンション
    /* 25 */ sender.name,                                                     // ご依頼主名
    /* 26 */ '',                                                              // ご依頼主名(カナ)
    /* 27 */ '',                                                              // 品名コード１
    /* 28 */ products[0] || '香水',                                            // 品名１
    /* 29 */ '',                                                              // 品名コード２
    /* 30 */ products[1] || '',                                                // 品名２
    /* 31 */ '',                                                              // 荷扱い１
    /* 32 */ '',                                                              // 荷扱い２
    /* 33 */ articleMemo || `Order ${orderNumber}`,                           // 記事（全角22文字以内）
    /* 34 */ '',                                                              // コレクト代金引換額(税込)
    /* 35 */ '',                                                              // 内消費税額等
    /* 36 */ '0',                                                             // 止置き: 0=利用しない
    /* 37 */ '',                                                              // 営業所コード
    /* 38 */ '1',                                                             // 発行枚数
    /* 39 */ '1',                                                             // 個数口表示フラグ: 1=印字する
    /* 40 */ BILLING_CUSTOMER_CODE,                                           // 請求先顧客コード（必須）
    /* 41 */ BILLING_CLASS_CODE,                                              // 請求先分類コード
    /* 42 */ FREIGHT_CONTROL_NO,                                              // 運賃管理番号（必須）
    /* 43 */ '0',                                                             // クロネコwebコレクトデータ登録: 無し
    /* 44 */ '',                                                              // クロネコwebコレクト加盟店番号
    /* 45 */ '',                                                              // クロネコwebコレクト申込受付番号１
    /* 46 */ '',                                                              // クロネコwebコレクト申込受付番号２
    /* 47 */ '',                                                              // クロネコwebコレクト申込受付番号３
    /* 48 */ '0',                                                             // お届け予定eメール利用区分: 利用しない
    /* 49 */ '',                                                              // お届け予定eメールe-mailアドレス
    /* 50 */ '',                                                              // 入力機種
    /* 51 */ '',                                                              // お届け予定eメールメッセージ
    /* 52 */ '0',                                                             // お届け完了eメール利用区分: 利用しない
    /* 53 */ '',                                                              // お届け完了eメールe-mailアドレス
    /* 54 */ '',                                                              // お届け完了eメールメッセージ
    /* 55 */ '0',                                                             // クロネコ収納代行利用区分: 利用しない
    /* 56 */ '',                                                              // 予備
    /* 57 */ '',                                                              // 収納代行請求金額(税込)
    /* 58 */ '',                                                              // 収納代行内消費税額等
    /* 59 */ '',                                                              // 収納代行請求先郵便番号
    /* 60 */ '',                                                              // 収納代行請求先住所
    /* 61 */ '',                                                              // 収納代行請求先住所(アパマン)
    /* 62 */ '',                                                              // 収納代行請求先会社・部門名１
    /* 63 */ '',                                                              // 収納代行請求先会社・部門名２
    /* 64 */ '',                                                              // 収納代行請求先名(漢字)
    /* 65 */ '',                                                              // 収納代行請求先名(カナ)
    /* 66 */ '',                                                              // 収納代行問合せ先名(漢字)
    /* 67 */ '',                                                              // 収納代行問合せ先郵便番号
    /* 68 */ '',                                                              // 収納代行問合せ先住所
    /* 69 */ '',                                                              // 収納代行問合せ先住所(アパマン)
    /* 70 */ '',                                                              // 収納代行問合せ先電話番号
    /* 71 */ '',                                                              // 収納代行管理番号
    /* 72 */ '',                                                              // 収納代行品名
    /* 73 */ '',                                                              // 収納代行備考
    /* 74 */ '',                                                              // 複数口くくりキー
    /* 75 */ '',                                                              // 検索キータイトル1
    /* 76 */ '',                                                              // 検索キー1
    /* 77 */ '',                                                              // 検索キータイトル2
    /* 78 */ '',                                                              // 検索キー2
    /* 79 */ '',                                                              // 検索キータイトル3
    /* 80 */ '',                                                              // 検索キー3
    /* 81 */ '',                                                              // 検索キータイトル4
    /* 82 */ '',                                                              // 検索キー4
    /* 83 */ '',                                                              // 検索キータイトル5（自動）
    /* 84 */ '',                                                              // 検索キー5（自動）
    /* 85 */ '',                                                              // 予備
    /* 86 */ '',                                                              // 予備
    /* 87 */ '0',                                                             // 投函予定メール利用区分
    /* 88 */ '',                                                              // 投函予定メールe-mailアドレス
    /* 89 */ '',                                                              // 投函予定メールメッセージ
    /* 90 */ '0',                                                             // 投函完了メール（お届け先宛）利用区分
    /* 91 */ '',                                                              // 投函完了メール（お届け先宛）e-mailアドレス
    /* 92 */ '',                                                              // 投函完了メール（お届け先宛）メッセージ
    /* 93 */ '0',                                                             // 投函完了メール（ご依頼主宛）利用区分
    /* 94 */ '',                                                              // 投函完了メール（ご依頼主宛）e-mailアドレス
    /* 95 */ '',                                                              // 投函完了メール（ご依頼主宛）メッセージ
  ];
}

/**
 * 品名を B2クラウド仕様（全角25文字/半角50文字）に短縮
 * 半角=1, 全角=2 で文字数換算
 */
function truncateProductName(text, maxByteLength = 50) {
  if (!text) return '';
  let bytes = 0;
  let result = '';
  for (const ch of text) {
    // ASCII（半角英数記号）= 1, それ以外（日本語など）= 2
    const charBytes = ch.charCodeAt(0) < 128 ? 1 : 2;
    if (bytes + charBytes > maxByteLength) break;
    bytes += charBytes;
    result += ch;
  }
  return result;
}

/**
 * 商品名を伝票用に短縮（ブランド名 + 主要部分のみ）
 * 例: "Maison Margiela - Lazy Sunday Morning (レイジーサンデーモーニング)"
 *  →  "Maison Margiela Lazy Sunday Morning"
 */
function simplifyProductName(text) {
  if (!text) return '香水';
  // 括弧内の日本語表記を削除
  let simplified = text.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  // 「ブランド - 商品名」のハイフンを除去（フラット化）
  simplified = simplified.replace(/\s*-\s*/g, ' ').trim();
  // B2クラウド仕様で最大半角50文字に切り詰め
  return truncateProductName(simplified, 50);
}

/**
 * 電話番号正規化（B2クラウド向け）
 * Stripe は `+819022792345` 形式で保存することがあるが、B2 は国内形式 `09022792345` を要求。
 * - 先頭 `+81` を `0` に置換
 * - 数字とハイフン以外を除去
 * - 例: "+81 90-2279-2345" → "09022792345"
 */
function normalizeJapanesePhone(phone) {
  if (!phone) return '';
  let p = String(phone).trim();
  // 国際表記 +81... を 0... に
  if (p.startsWith('+81')) {
    p = '0' + p.slice(3);
  } else if (p.startsWith('81') && p.length >= 11 && !p.startsWith('0')) {
    // 0始まりでない+81欠落形式の救済（ごく稀）
    p = '0' + p.slice(2);
  }
  // 数字以外を除去（空白・ハイフン・括弧等）
  p = p.replace(/[^\d]/g, '');
  return p;
}

/**
 * B2クラウド列ごとの全角バイト換算上限（外部データ取り込み基本レイアウト準拠）
 * - 半角ASCII = 1, 全角(非ASCII) = 2 で計数し、指定上限以内に切り詰める
 */
function truncateZenkaku(text, maxZenkaku) {
  // 全角n文字 = 半角2n相当のbyte上限
  return truncateProductName(text || '', maxZenkaku * 2);
}

function bytesOf(s) {
  let b = 0;
  for (const ch of String(s || '')) b += (ch.charCodeAt(0) < 128 ? 1 : 2);
  return b;
}

/**
 * 住所のスマート分割
 * Stripeのline1にマンション名まで詰め込まれているケース (例: 加藤さん) を救済する。
 * 16z上限を超える場合、上限内の最後のスペースで分割し、超過分をline2側に流す。
 * スペースなしなら強制カット。
 */
function smartSplitAddress(line1, line2, zmax = 16) {
  const l1 = (line1 || '').trim();
  const l2 = (line2 || '').trim();
  if (bytesOf(l1) <= zmax * 2) {
    return { line1: l1, building: truncateZenkaku(l2, zmax) };
  }
  // 上限内の最後のスペース位置を探す
  let bytes = 0;
  let lastSpace = -1;
  for (let i = 0; i < l1.length; i++) {
    const cb = l1.charCodeAt(i) < 128 ? 1 : 2;
    if (bytes + cb > zmax * 2) break;
    bytes += cb;
    if (l1[i] === ' ' || l1[i] === '　') lastSpace = i;
  }
  let head, overflow;
  if (lastSpace > 0) {
    head = l1.slice(0, lastSpace).trimEnd();
    overflow = l1.slice(lastSpace + 1).trim();
  } else {
    head = truncateZenkaku(l1, zmax);
    overflow = l1.slice(head.length).trim();
  }
  const combined = (overflow + (l2 ? ' ' + l2 : '')).trim();
  return { line1: head, building: truncateZenkaku(combined, zmax) };
}

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
 * CSV値のエスケープ（カンマやダブルクォートを含む場合のみダブルクォート囲み）
 */
function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters?.session;
  // 電話番号の手動補完（Stripeで未入力の場合用）
  const phoneOverride = event.queryStringParameters?.phone;
  // 出荷予定日・お届け予定日のオーバーライド（YYYY-MM-DD or YYYY/MM/DD）
  const shipDateOverride = event.queryStringParameters?.ship_date;
  const arriveDateOverride = event.queryStringParameters?.arrive_date;

  if (!sessionId) {
    return { statusCode: 400, body: 'session parameter required' };
  }

  try {
    // Stripeセッション取得
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

    // 注文番号（管理番号、最大50文字以内）
    const orderNumber = session.id.replace('cs_live_', '').slice(0, 20);

    // 出荷予定日・お届け予定日
    // URLパラメータ指定があればそれを優先（YYYY/MM/DD 形式に正規化）
    // なければ shipDate = 翌営業日、arriveDate = 空欄（ヤマト最短）
    const normDate = (s) => (s ? s.replace(/-/g, '/') : '');
    const today = new Date();
    const shipDate = normDate(shipDateOverride) || formatDate(addBusinessDays(today, 1));
    const arriveDate = normDate(arriveDateOverride) || '';

    // 商品名（送料・ギフトラッピング除外、長すぎる名前は短縮 = 全角25文字 / 半角50文字）
    const lineItems = session.line_items?.data || [];
    const productNames = lineItems
      .filter((item) => !/送料|ギフトラッピング/.test(item.description || ''))
      .map((item) => {
        const baseName = simplifyProductName(item.description);
        const qtySuffix = item.quantity > 1 ? ` x${item.quantity}` : '';
        return truncateProductName(baseName + qtySuffix, 50);
      });

    // 電話番号: URLパラメータ最優先 → Stripeの値 → 弊社代表番号フォールバック
    // 1. URLパラメータ（手動指定があれば最優先）
    // 2. Stripeチェックアウトでお客様が入力した番号 (`+81...` は `0...` に正規化)
    // 3. どちらも空なら弊社代表 08042421092（B2必須項目を埋めるため）
    const rawPhone = phoneOverride || customerDetails.phone || FALLBACK_RECIPIENT_PHONE;
    const phone = normalizeJapanesePhone(rawPhone) || FALLBACK_RECIPIENT_PHONE;

    // === B2クラウド フィールド長制限（外部データ取り込み基本レイアウト準拠） ===
    //  - 市区郡町村: 全角12文字
    //  - 町・番地: 全角16文字
    //  - マンション・ビル名: 全角16文字
    //  - お届け先名: 全角16文字
    //  - 品名1/2: 全角25文字（truncateProductName内で対応済）
    //  - 記事(メモ): 全角22文字
    // ※ 95列CSVの「住所」(col 12) は連結フィールドだが、B2側で都道府県/市区郡町村/町・番地 に分割パースされる。
    //   そのため `state + city + line1` の合計を「市区郡町村+町番地の合計」とみなし、過長になる場合は line1 側を切り詰める。
    const state = addr.state || '';
    const city = truncateZenkaku(addr.city || '', 12);    // 市区郡町村: 全角12
    // Stripeのline1にマンション名まで詰め込まれている場合の救済 (smart split)
    const { line1, building } = smartSplitAddress(addr.line1, addr.line2, 16);
    const recipientName = truncateZenkaku(customerDetails.name || '', 16); // お届け先名: 全角16
    const articleMemo = truncateZenkaku(`Order ${orderNumber}`, 22); // 記事: 全角22

    // 1行のCSVデータを構築
    const row = buildRow({
      orderNumber,
      shipDate,
      arriveDate,
      recipient: {
        phone,
        postal: (addr.postal_code || '').replace(/-/g, ''),
        address: `${state}${city}${line1}`,
        building,
        name: recipientName,
      },
      products: productNames,
      sender: SENDER,
      articleMemo,
    });

    // CSVテキスト生成（ヘッダなし、CRLF改行）
    const csvText = row.map(escapeCsv).join(',') + '\r\n';

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
