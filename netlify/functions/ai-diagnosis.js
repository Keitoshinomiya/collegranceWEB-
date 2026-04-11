const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load catalog dynamically (will be updated weekly with inventory)
let PRODUCT_CATALOG = "";
let VALID_IDS = new Set(); // バリデーション用: カタログに存在するIDセット
let VALID_ID_LIST = ""; // プロンプト埋め込み用IDリスト文字列
try {
  const catalogPath = path.join(__dirname, "../../catalog_full.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const filtered = catalog.filter((p) => p.sellPrice >= 3000);
  // バリデーション用IDセット構築
  filtered.forEach((p) => {
    const id = p.productsJsonId || p.code;
    VALID_IDS.add(String(id));
  });
  // プロンプト内のプレースホルダーにIDリストを埋め込む
  VALID_ID_LIST = [...VALID_IDS].join(", ");
  const lines = filtered
    .map((p, idx) => {
      const catalogId = p.productsJsonId || p.code;
      const sampleInfo = p.samplePrice
        ? ` / 小分け¥${p.samplePrice}`
        : "";
      const salesInfo = p.salesCount ? ` | 販売${p.salesCount}個` : "";
      const type =
        p.existsInProductsJson && p.samplePrice
          ? "【小分け+フルボトル】"
          : "【フルボトルのみ】";
      return `[${idx + 1}] id=${catalogId} ${type} ${p.brandEn || p.brand} - ${p.nameEn || p.name} (${p.spec || ""} ${p.size} ¥${p.sellPrice.toLocaleString()}${sampleInfo})\n      Notes: ${p.notes} | ${p.description}${salesInfo}`;
    });
  PRODUCT_CATALOG = `\n\n══════════════════════════════════════════\n⚠️ 以下のリストに掲載されている商品「のみ」から選んでください。\nこのリスト以外の商品は絶対に推薦しないでください。\n存在しないブランド・商品を推薦した場合、お客様が購入できず信頼を失います。\n══════════════════════════════════════════\n\nCOLLEGRANCEの全取扱商品カタログ（${lines.length}商品）:\n\n${lines.join("\n\n")}\n\n══════════════════════════════════════════\n以上が全${lines.length}商品です。上記以外の商品は取り扱いがありません。\nAcqua di Parma, Creed, Tom Ford Tobacco Vanille, Le Labo等、\n上記リストにないブランド・商品は絶対に推薦禁止です。\n══════════════════════════════════════════`;
} catch (e) {
  // Fallback: catalog not yet generated
  PRODUCT_CATALOG = "カタログ読み込みエラー。商品名とブランドのみで推薦してください。";
}

const SYSTEM_PROMPT = `あなたはCOLLEGRANCE（コレグランス）のAI香りコンシェルジュです。
高級ブランド香水の小分けお試し・フルボトル販売を行う専門店の接客担当として、お客様一人ひとりに最適な香りを提案してください。

あなたの役割:
- 香水のプロフェッショナルとして、お客様の好みと状況を深く理解する
- 単なる商品リストではなく、「パーソナルレター」として結果を届ける
- お客様の自由記述には必ず共感と具体的なアドバイスで応える

🚨🚨🚨 最重要ルール（絶対厳守・違反は致命的エラー）🚨🚨🚨

あなたが使用できるproductIdは以下の数値のみです。これ以外のIDは絶対に使用禁止:
ALLOWED_IDS: [VALID_ID_PLACEHOLDER]

ルール:
1. 推薦する3本は「必ず」下記カタログに掲載されている商品のみから選ぶこと
2. productIdには上記ALLOWED_IDSに含まれる数値のみを記入すること
3. あなたの一般知識にある香水でも、カタログに載っていなければ絶対に推薦禁止
4. 存在しない商品名・ブランド名を創作してはならない。カタログのname, brandを正確にコピーすること
5. 推薦前チェックリスト:
   ✅ この商品はカタログに掲載されているか？
   ✅ このproductIdはALLOWED_IDSに含まれるか？
   ✅ このブランド名・商品名はカタログの記載と完全一致するか？
   → 3つ全てYESでなければ、その商品は推薦してはならない

その他のルール:
- 【リピーター】の場合: 前回試した商品の感想を踏まえて、次の体験を提案
  - 「大好き」+「フルボトルが欲しい」→ 1位は必ずその同じ商品のフルボトルを推薦。2位3位で似た系統の別の香りを提案
  - 「大好き」+「別の小分け」→ 似た系統 + 少しだけ冒険の提案
  - 「違う系統希望」→ 対照的な香りを提案しつつ、好みの要素は残す
  - 「好みじゃなかった」→ なぜ合わなかったかを推測し、別方向を提案
- 【新規】の場合: シーン・好み・印象から最適な香りを導く
- フルボトル購入を基本の推薦とし、小分けがある商品は「まず試してみる」選択肢も提示
- 予算、季節、年代、性別、用途すべて考慮する
- プレゼントの場合はギフトとしての魅力も説明
- 自由記述の内容には必ず直接触れて共感+知識を示すこと

トーンとスタイル:
- 百貨店の香水フロアのプロの販売員のように、温かく知的に
- 専門用語は使わず、香りのイメージが伝わる表現を使う
- 「〜ですね」「〜いかがでしょうか」の丁寧語で

出力フォーマット（厳守・JSON）:
{
  "personalMessage": "お客様への個人的なメッセージ（3〜5文）。自由記述への共感、香りの知識を交えたアドバイス、なぜこの3本を選んだかの概要。ここが最も重要。",
  "profileType": "香りタイプ（4〜8文字のキャッチーな表現。例: ナチュラルクリーン系、スモーキーセクシー系）",
  "recommendations": [
    {
      "rank": 1,
      "productId": "ALLOWED_IDSに含まれるIDのみ使用可。例: 58, 101 等の数値",
      "name": "カタログに記載されている商品名をそのままコピー",
      "brand": "カタログに記載されているブランド名をそのままコピー",
      "reason": "推薦理由（4〜5文。お客様の回答に具体的に触れながら、なぜこの香りがぴったりなのかを説明）",
      "scene": "こんなシーンで: 具体的な使用シーン提案（1文）",
      "matchScore": 95
    },
    {
      "rank": 2,
      "reason": "2〜3文。1位との違いも交えて",
      ...
    },
    {
      "rank": 3,
      "reason": "2〜3文。新しい発見としての提案",
      ...
    }
  ]
}`;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { answers } = JSON.parse(event.body);

    if (!answers || typeof answers !== "object") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid answers" }),
      };
    }

    // Build user message based on whether repeater or new
    let userMessage = "";

    if (answers.isRepeater) {
      userMessage = `【リピーターのお客様】
- 前回試した香水: ${answers.previousProduct || "未選択"}
- 感想: ${answers.previousFeeling || "未回答"}
- 次の希望: ${answers.nextWish || "未回答"}
- 香りの強さ: ${answers.strength || "未回答"}
- 季節: ${answers.season || "未回答"}
- 性別: ${answers.gender || "未回答"}
- 年代: ${answers.age || "未回答"}
${answers.freeText ? "- お客様のコメント: " + answers.freeText : ""}

前回の体験を踏まえて、次に試すべき香水を3本推薦してください。必ずカタログに掲載されている商品のみから選び、productIdにはカタログのid値を正確に記入してください。`;
    } else {
      userMessage = `【初めてのお客様】
- 使用シーン: ${answers.scene || "未回答"}
- 好みの香りの系統: ${answers.scentType || "未回答"}
- 求める印象: ${answers.impression || "未回答"}
- 購入希望: ${answers.purchaseType || "未回答"}
- 香りの強さ: ${answers.strength || "未回答"}
- 季節: ${answers.season || "未回答"}
- 性別: ${answers.gender || "未回答"}
- 年代: ${answers.age || "未回答"}
${answers.freeText ? "- お客様のコメント: " + answers.freeText : ""}

お客様の好みに最適な香水を3本推薦してください。必ずカタログに掲載されている商品のみから選び、productIdにはカタログのid値を正確に記入してください。`;
    }

    // バリデーション付きでAI呼び出し（最大2回リトライ）
    let result = null;
    const MAX_ATTEMPTS = 2;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const messages = [{ role: "user", content: userMessage }];

      // 2回目以降はリトライ指示を追加
      if (attempt > 1) {
        messages.push(
          { role: "assistant", content: JSON.stringify(result) },
          { role: "user", content: `エラー: 推薦した商品のproductIdがカタログに存在しません。以下のIDのみ使用可能です: ${[...VALID_IDS].join(', ')}\n\n必ずカタログ内のIDのみを使って、もう一度推薦してください。` }
        );
      }

      // プレースホルダーを実際のIDリストに置換
      const systemText = (SYSTEM_PROMPT + "\n\n" + PRODUCT_CATALOG).replace("VALID_ID_PLACEHOLDER", VALID_ID_LIST);

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: [
          {
            type: "text",
            text: systemText,
            cache_control: { type: "ephemeral" }
          }
        ],
        messages,
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        if (attempt === MAX_ATTEMPTS) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "AI response parse error" }),
          };
        }
        continue;
      }

      result = JSON.parse(jsonMatch[0]);

      // バリデーション: 全推薦商品のIDがカタログに存在するか確認
      if (result.recommendations && Array.isArray(result.recommendations)) {
        const invalidRecs = result.recommendations.filter((rec) => {
          const id = String(rec.productId || "").replace(/^id=/, "");
          return !VALID_IDS.has(id);
        });

        if (invalidRecs.length === 0) {
          // 全商品がカタログ内 → OK
          break;
        }

        console.warn(`Attempt ${attempt}: Invalid productIds found:`, invalidRecs.map(r => r.productId));

        if (attempt === MAX_ATTEMPTS) {
          // 最終試行でもダメ → カタログ外の推薦を除外し、有効なもののみ返す
          result.recommendations = result.recommendations.filter((rec) => {
            const id = String(rec.productId || "").replace(/^id=/, "");
            return VALID_IDS.has(id);
          });
          // ランクを振り直す
          result.recommendations.forEach((rec, i) => { rec.rank = i + 1; });
        }
      } else {
        break;
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    console.error("AI Diagnosis Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Internal server error" }),
    };
  }
};
