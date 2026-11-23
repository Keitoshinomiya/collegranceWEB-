/**
 * AI診断（2026-11-22 作り替え）
 *
 * 出口をお試し1.5mLの3本にそろえ、「なぜこの香りか」をお客さまの答えと結んで返す。
 *   - 候補は data/samples.json に載っている（＝サイトで買える）お試しだけ。売れ筋の順では渡さない
 *   - 理由の材料は data/diagnosis-scents.json に書いてあることだけ（AIの知識で香りを語らせない）
 *   - 3本の役割: closest＝いちばん近い / similar＝同じ系統で少しちがう / adventure＝少しだけ冒険
 *   - AIが失敗しても、香りの特徴の近さで3本を選んで必ず返す
 *
 * 入力: { answers, retry?: { reason, excludeIds } }
 * 出力: { headline, picks:[{role, productId, why:[{key, point}], caution}], fullbottleId?,
 *         recommendations:[…]（LINE保存・計測用に前の形も残す）, source: 'ai' | 'fallback' }
 */
const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

/* Netlify の関数は10秒で切られる。AIが遅い時は8.5秒であきらめて、下の「AIを使わない選び方」で必ず返す */
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 8500, maxRetries: 0 });

/* 外から何度も呼ばれないようにする（自社サイトと確認用の画面だけ・同じ所から1時間に30回まで） */
const ALLOWED_ORIGIN_RE = /^https:\/\/((www\.)?collegrance\.com|[a-z0-9-]+--[a-z0-9-]+\.netlify\.app)$|^http:\/\/localhost(:\d+)?$/;
const RATE_MAX = 30, RATE_WINDOW_MS = 60 * 60 * 1000;
const rateStore = new Map();
function rateOk(ip) {
  const now = Date.now();
  if (rateStore.size > 2000) for (const [k, v] of rateStore) if (v.resetAt < now) rateStore.delete(k);
  const r = rateStore.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (r.resetAt < now) { r.count = 0; r.resetAt = now + RATE_WINDOW_MS; }
  r.count += 1; rateStore.set(ip, r);
  return r.count <= RATE_MAX;
}
const MODEL = process.env.DIAG_MODEL || "claude-sonnet-5-5";
const EFFORT = process.env.DIAG_EFFORT || "low";
/* 待ち時間を短くするため、考える時間は既定で切る（Haiku 5.5 は disabled、Sonnet 5.5 は between_tools と書く） */
const THINKING = process.env.DIAG_THINKING === "on" ? null
  : (/sonnet-5-5/.test(MODEL) ? { type: "between_tools" } : (/haiku-5-5/.test(MODEL) ? { type: "disabled" } : null));

function loadJson(rel) {
  const candidates = [
    path.join(__dirname, "../../", rel),
    path.join(__dirname, rel),
    path.join(process.cwd(), rel),
    path.join("/var/task", rel),
  ];
  const p = candidates.find((c) => fs.existsSync(c));
  if (!p) throw new Error(rel + " not found");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/* ── 候補（お試しで買える香り） ── */
let SCENTS = []; // {id, brand, name, nameJa, conc, price, family, notes, line, sweet, fresh, deep, last}
let BY_ID = new Map();
let LOAD_ERROR = "";
try {
  const products = loadJson("products.json");
  const samples = loadJson("data/samples.json");
  const prof = loadJson("data/diagnosis-scents.json").scents;
  Object.keys(samples.items || {}).forEach((k) => {
    const it = samples.items[k];
    const p = products.find((x) => String(x.id) === String(k));
    const f = prof[String(k)];
    if (!p || !f || it.soldOut || p.inStock === false || !p.samplePrice) return;
    SCENTS.push({
      id: String(k), brand: p.brand, name: p.name, nameJa: p.nameJa || p.name,
      conc: p.concentration || "", price: p.samplePrice,
      family: f.family, notes: f.notes, line: f.line,
      sweet: f.sweet, fresh: f.fresh, deep: f.deep, last: f.last,
    });
  });
  SCENTS.sort((a, b) => Number(a.id) - Number(b.id));
  SCENTS.forEach((s) => BY_ID.set(s.id, s));
} catch (e) {
  LOAD_ERROR = e.message;
  console.error("Diagnosis data load error:", e.message);
}

const CATALOG = SCENTS.map((s) =>
  `id=${s.id}｜${s.nameJa}（${s.brand}）｜系統: ${s.family}｜香りの中身（つけてすぐ→まん中→最後）: ${s.notes.join("→")}｜ひとこと: ${s.line}｜甘さ${s.sweet} 爽やかさ${s.fresh} 深み${s.deep} 持続${s.last}`
).join("\n");

/* お客さまの答えのうち、理由に使ってよい項目（画面ではお客さまの言葉のまま出す） */
const ANSWER_LABELS = {
  smell: "いい匂いと感じる身近な匂い",
  impression: "香りでどう見られたいか",
  distance: "香水との距離感",
  strength: "香りの強さ",
  season: "季節",
  previousProduct: "前に試した香り",
  previousFeeling: "その感想",
  nextWish: "次の希望",
  freeText: "コメント",
};

const SYSTEM_PROMPT = `あなたは香水のお試し専門店 COLLEGRANCE の店員です。お客さまの答えを読んで、お試し1.5mLを3本選び、なぜその香りなのかを、お客さまが自分の答えと見比べて納得できるように説明します。

このお店のお客さまの多くは香水にくわしくありません。結果の画面では、お客さまの答えた言葉の横に、あなたが書いた理由が1行ずつ並びます。お客さまはそれを読んで「たしかに自分はこう答えた、だからこの香りなのか」と確かめます。理由があいまいだったり、どの香りにも言える言葉だったりすると、「自分のために選んでくれた」とは感じてもらえず、買ってもらえません。

# 候補（この中からだけ選ぶ）
各行は、id｜名前｜系統｜香りの中身｜ひとこと｜4つの数字（各1〜5。甘さ・爽やかさ・深み・持続）です。
${CATALOG}

# 選び方
3本にはそれぞれ役割があります。
- closest: お客さまの答えにいちばん近い1本。
- similar: closest と同じ方向で、少しだけちがう1本。
- adventure: 答えから少しだけ外れた1本。ただしお客さまが苦手と言ったものには踏み込みません。強い香りが苦手な方に、甘さや深みが4以上の香りを冒険として出すのは行き過ぎです。
答えに合う香りを素直に選んでください。有名かどうか、よく売れているかどうかは考えません。同じ3本を誰にでも出すことになっていないか、選ぶ前に答えを読み直してください。
前に試した香りがある方には、その香り自体は選びません（お客さまはもう知っているので）。感想が「好みではなかった」なら、その香りと数字が近いものも避けます。

# 理由の書き方（why）
- key には、その理由が応えているお客さまの答えの項目を1つ入れます。
- point には、その答えに応える香りの事実を1文で書きます。使ってよいのは、候補の行に書いてあること（香りの中身・ひとこと・系統・4つの数字が表す性質）だけです。あなたが知っているその香水の評判や歴史、行に書いていない香りの成分は書きません。まちがった説明をひとつでも読むと、お客さまは全部を疑います。
- 数字はそのまま見せず、言葉にします（爽やかさ5→「とても爽やか」、持続2→「香りは長く残りません」など）。
- 当てはまる答えだけを書きます。1本につき1〜3個。こじつけになるなら1個で構いません。
- 香りの事実と結びつかない答え（季節や強さなど）に、むりに理由をつけません。「どの季節にも合います」のような、どの香りにも言える文は書かないでください。
- adventure では、答えから外れている点を隠さず、「あえてここを外した」ことが伝わるように書きます。
- 香水の専門用語は使いません（トップノート、シアージュ、ウッディ、などは「つけてすぐ」「香りの広がり」「木の香り」のように言いかえる）。

# 合わないかもしれない点（caution）
1本につき1文。良いことしか言わない店員より、合わない点も先に言う店員のほうが信じてもらえますし、届いてからのがっかりも減ります。このお客さまの答えと照らして、気になりそうな点を候補の行の事実から正直に書きます（例：お茶の香りを望む方に、お茶が入っていない香りを出すなら、そう書く）。おどかす書き方はしません。

# headline
3本をどういう考えで選んだかを、お客さまの答えにふれて1文（40字以内）で。「〜な香りを中心に選びました」のように。

# 書き方
です・ます調で、やさしい言葉で、短く。「香り」と書き、「匂い」とは書きません（お客さまの答えを引用する場合を除く）。記号や絵文字、％の数字は使いません。`;

function buildSchema(answerKeys) {
  return {
    type: "object",
    properties: {
      headline: { type: "string" },
      picks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["closest", "similar", "adventure"] },
            productId: { type: "string", enum: SCENTS.map((s) => s.id) },
            why: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string", enum: answerKeys },
                  point: { type: "string" },
                },
                required: ["key", "point"],
                additionalProperties: false,
              },
            },
            caution: { type: "string" },
          },
          required: ["role", "productId", "why", "caution"],
          additionalProperties: false,
        },
      },
    },
    required: ["headline", "picks"],
    additionalProperties: false,
  };
}

function usableKeys(answers) {
  return Object.keys(ANSWER_LABELS).filter((k) => {
    const v = answers[k];
    if (typeof v !== "string" || !v.trim()) return false;
    if (k === "smell" && /わからない/.test(v)) return false;
    if (k === "freeText" && /^（.*の記事を読んで/.test(v.trim())) return false; // 記事からの自動メモだけの時
    /* はじめての方の「強さ」「季節」は画面が自動で入れた値で、ご本人の答えではないので理由に使わない */
    if (!answers.isRepeater && (k === "strength" || k === "season")) return false;
    if (k === "nextWish") return false; // 次の希望は選ぶ手がかりにだけ使う（香りの事実と結びつけにくく、こじつけになる）
    return true;
  });
}

function buildUserMessage(answers, keys, retry) {
  const lines = keys.map((k) => `- ${k}（${ANSWER_LABELS[k]}）: ${String(answers[k]).slice(0, 400)}`);
  if (answers.scentType && answers.scentType !== "おまかせ（定番）") lines.push(`- （参考）系統でいうと: ${answers.scentType}`);
  if (answers.gender) lines.push(`- （参考）性別: ${answers.gender}`);
  if (answers.age) lines.push(`- （参考）年代: ${answers.age}`);
  if (answers.nextWish) lines.push(`- （参考）次の希望: ${answers.nextWish}${/フルボトル/.test(answers.nextWish) ? "（フルボトルは画面で別にご案内するので、ここでは次に試すお試し3本を選ぶ）" : ""}`);
  let msg = `${answers.isRepeater ? "前に当店のお試しを使ったことのあるお客さまです。" : "はじめてのお客さまです。"}\n\nお客さまの答え:\n${lines.join("\n")}\n\n（参考）の行は選ぶ時の手がかりにだけ使い、why の key には使いません。`;
  if (retry && retry.reason) {
    msg += `\n\nこのお客さまには一度3本をお見せしましたが、「${String(retry.reason).slice(0, 60)}」とのことでした。前にお見せした香り（id: ${(retry.excludeIds || []).join(", ")}）は選ばず、この声に応える3本を選び直してください。headline では、声を受けて選び直したことにふれてください。`;
  }
  return msg + "\n\n3本（closest, similar, adventure を1本ずつ）を選んでください。";
}

/* ── AIを使わない選び方（AIが失敗した時と、足りない分の補い） ── */
const TYPE_TARGET = {
  "シトラス・フレッシュ": { sweet: 1, fresh: 5, deep: 1 },
  "ティー・グリーン": { sweet: 2, fresh: 4, deep: 2 },
  "ムスク・クリーン": { sweet: 2, fresh: 4, deep: 2 },
  "フローラル": { sweet: 3, fresh: 3, deep: 2 },
  "ウッディ・スパイシー": { sweet: 2, fresh: 2, deep: 4 },
  "スイート・グルマン": { sweet: 4, fresh: 2, deep: 4 },
};
function dist(a, b) {
  return Math.abs(a.sweet - b.sweet) + Math.abs(a.fresh - b.fresh) + Math.abs(a.deep - b.deep);
}
function nearest(target, excludeIds, n) {
  return SCENTS.filter((s) => !excludeIds.has(s.id))
    .map((s) => ({ s, d: dist(s, target) }))
    .sort((x, y) => x.d - y.d || Number(x.s.id) - Number(y.s.id))
    .slice(0, n).map((x) => x.s);
}
function findPrevious(answers) {
  const prev = String(answers.previousProduct || "");
  if (!prev) return null;
  return SCENTS.find((s) => prev.includes(s.name) || prev.includes(s.nameJa)) || null;
}
function fallbackPick(answers, excludeIds, slot) {
  const prev = findPrevious(answers);
  let target = TYPE_TARGET[answers.scentType] || (prev ? prev : { sweet: 2, fresh: 4, deep: 2 });
  if (/苦手|ほのか/.test(String(answers.distance || "") + String(answers.strength || ""))) {
    target = { sweet: Math.min(target.sweet, 2), fresh: Math.max(target.fresh, 4), deep: Math.min(target.deep, 2) };
  }
  if (slot === "adventure") target = { sweet: target.sweet + 1, fresh: target.fresh - 1, deep: target.deep + 1 };
  const s = nearest(target, excludeIds, 1)[0];
  if (!s) return null;
  return {
    role: slot, productId: s.id, why: [], caution: "",
    plain: `${s.line}です。`, isFallback: true,
  };
}

function cleanText(t, max) {
  return String(t || "").replace(/\s+/g, " ").replace(/匂い/g, "香り").trim().slice(0, max);
}

exports.handler = async (event) => {
  const H = event.headers || {};
  const origin = H.origin || H.Origin || "";
  const referer = H.referer || H.Referer || "";
  const refOrigin = (referer.match(/^https?:\/\/[^/]+/) || [""])[0];
  const okOrigin = ALLOWED_ORIGIN_RE.test(origin) ? origin : (ALLOWED_ORIGIN_RE.test(refOrigin) ? refOrigin : "");
  const headers = {
    "Access-Control-Allow-Origin": okOrigin || "https://collegrance.com",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  if (!okOrigin) return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  const ip = String(H["x-nf-client-connection-ip"] || H["x-forwarded-for"] || H["client-ip"] || "unknown").split(",")[0].trim();
  if (!rateOk(ip)) return { statusCode: 429, headers, body: JSON.stringify({ error: "too_many" }) };

  try {
    if ((event.body || "").length > 6000) return { statusCode: 400, headers, body: JSON.stringify({ error: "too_long" }) };
    const body = JSON.parse(event.body || "{}");
    const answers = body.answers;
    if (!answers || typeof answers !== "object") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid answers" }) };
    }
    if (SCENTS.length < 3) throw new Error("no scents: " + LOAD_ERROR);

    const retry = body.retry && typeof body.retry === "object" ? {
      reason: String(body.retry.reason || "").slice(0, 60),
      excludeIds: (Array.isArray(body.retry.excludeIds) ? body.retry.excludeIds : []).map(String).filter((id) => BY_ID.has(id)).slice(0, 9),
    } : null;

    const keys = usableKeys(answers);
    const prev = findPrevious(answers);
    const banned = new Set(retry ? retry.excludeIds : []);
    if (prev) banned.add(prev.id);

    let ai = null, usage = null, source = "ai";
    if (keys.length > 0) {
      try {
        const message = await client.messages.create({
          model: MODEL,
          max_tokens: 4000,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: buildUserMessage(answers, keys, retry) }],
          output_config: { effort: EFFORT, format: { type: "json_schema", schema: buildSchema(keys) } },
          ...(THINKING ? { thinking: THINKING } : {}),
        });
        usage = message.usage;
        if (message.stop_reason === "end_turn") {
          const textBlock = message.content.find((b) => b.type === "text");
          if (textBlock) ai = JSON.parse(textBlock.text);
        } else {
          console.warn("[DIAG] stop_reason:", message.stop_reason);
        }
      } catch (e) {
        console.error("[DIAG] AI call failed:", e.status || "", e.message);
      }
    }

    /* ── 確かめて、足りない分を補う ── */
    const picks = [];
    const used = new Set(banned);
    const roles = ["closest", "similar", "adventure"];
    if (ai && Array.isArray(ai.picks)) {
      roles.forEach((role) => {
        const p = ai.picks.find((x) => x && x.role === role && BY_ID.has(String(x.productId)) && !used.has(String(x.productId)));
        if (!p) return;
        used.add(String(p.productId));
        const seen = new Set();
        const why = (Array.isArray(p.why) ? p.why : [])
          .filter((w) => w && keys.includes(w.key) && !seen.has(w.key) && seen.add(w.key) && String(w.point || "").trim())
          .slice(0, 3)
          .map((w) => ({ key: w.key, point: cleanText(w.point, 110) }));
        picks.push({ role, productId: String(p.productId), why, caution: cleanText(p.caution, 120) });
      });
    }
    if (picks.length < 3) source = picks.length === 0 ? "fallback" : "ai_partial";
    roles.forEach((role) => {
      if (picks.find((p) => p.role === role)) return;
      const f = fallbackPick(answers, used, role);
      if (f) { used.add(f.productId); picks.push(f); }
    });
    picks.sort((a, b) => roles.indexOf(a.role) - roles.indexOf(b.role));
    /* 画面で使う香りの材料を添える（ひとこと・中身・4つの数字） */
    picks.forEach((p) => {
      const s = BY_ID.get(p.productId);
      p.line = s.line; p.notes = s.notes; p.family = s.family;
      p.profile = { sweet: s.sweet, fresh: s.fresh, deep: s.deep, last: s.last };
    });

    const result = {
      headline: cleanText(ai && ai.headline, 60) || "答えに近い香りから、3本を選びました",
      picks,
      source,
      scentCount: SCENTS.length,
      /* 前の形（LINE保存・計測・古い画面用） */
      recommendations: picks.map((p, i) => {
        const s = BY_ID.get(p.productId);
        return {
          rank: i + 1, productId: p.productId, name: s.name, brand: s.brand,
          reason: p.why.length ? p.why.map((w) => w.point).join(" ") : (p.plain || s.line),
          scene: "",
        };
      }),
      profileType: "",
      personalMessage: cleanText(ai && ai.headline, 60),
    };
    if (prev && /フルボトル/.test(String(answers.nextWish || ""))) result.fullbottleId = prev.id;
    if (process.env.DIAG_DEBUG) result._usage = usage;

    console.log(`[DIAG] model=${MODEL} source=${source} picks=${picks.map((p) => p.productId).join(",")} keys=${keys.length}${retry ? " retry" : ""}`);
    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    console.error("AI Diagnosis Error:", err.stack || err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "diagnosis_failed" }) };
  }
};
