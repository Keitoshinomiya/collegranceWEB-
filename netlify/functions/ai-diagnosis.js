const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load catalog dynamically (will be updated weekly with inventory)
let PRODUCT_CATALOG = "";
try {
  const catalogPath = path.join(__dirname, "../../catalog_full.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const lines = catalog
    .filter((p) => p.sellPrice >= 3000)
    .map((p) => {
      const sampleInfo = p.samplePrice
        ? ` / 小分け¥${p.samplePrice}`
        : "";
      const salesInfo = p.salesCount ? ` | 販売${p.salesCount}個` : "";
      const type =
        p.existsInProductsJson && p.samplePrice
          ? "【小分け+フルボトル】"
          : "【フルボトルのみ】";
      return `id=${p.productsJsonId || p.code} ${type} ${p.brandEn || p.brand} - ${p.nameEn || p.name} (${p.spec || ""} ${p.size} ¥${p.sellPrice.toLocaleString()}${sampleInfo})\n      Notes: ${p.notes} | ${p.description}${salesInfo}`;
    });
  PRODUCT_CATALOG = `COLLEGRANCEの全取扱商品カタログ（${lines.length}商品）:\n\n${lines.join("\n\n")}`;
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

重要ルール:
- 必ず上記カタログの中から3本選ぶこと
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
      "productId": "id番号 or 商品コード",
      "name": "商品名",
      "brand": "ブランド名",
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

前回の体験を踏まえて、次に試すべき香水を3本推薦してください。`;
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

お客様の好みに最適な香水を3本推薦してください。`;
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT + "\n\n" + PRODUCT_CATALOG,
      messages: [{ role: "user", content: userMessage }],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "AI response parse error" }),
      };
    }

    const result = JSON.parse(jsonMatch[0]);
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
