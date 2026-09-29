const Anthropic = require("@anthropic-ai/sdk");

let anthropicClient = null;
function getAnthropicClient() {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set.");
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getFactEntries(facts) {
  if (!facts) return [];
  if (facts instanceof Map) return Array.from(facts.entries());
  if (typeof facts === "object") return Object.entries(facts);
  return [];
}

/**
 * Turns a list of matched Business documents into a compact context block.
 */
function buildContext(businesses) {
  if (!businesses || !businesses.length) return "No verified listing was found for this question.";

  return businesses
    .map((b, i) => {
      const entries = getFactEntries(b.facts);
      const factsFormatted = entries.length
        ? entries.map(([k, v]) => `  - ${k}: ${v}`).join("\n")
        : "  (no structured facts on file)";
      return [
        `[Source ${i + 1}] ${b.name} (${b.category})${b.verified ? " - VERIFIED" : ""}`,
        b.tagline ? `Tagline: ${b.tagline}` : null,
        `Description: ${b.description}`,
        `Facts:\n${factsFormatted}`,
        b.website ? `Website: ${b.website}` : null,
        b.phone ? `Phone: ${b.phone}` : null,
        b.address ? `Address: ${b.address}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

const SYSTEM_PROMPT = `You are the Bolkar AI answer engine: "Ask Anything About Any Business."
Answer the user's question using ONLY the verified source listings provided in the context.
Rules:
- If the context does not contain enough information to answer, say so plainly and suggest what to search for instead. Do not invent facts, prices, specs, or contact details.
- When multiple sources are relevant (e.g. a comparison), address each one and be explicit about the differences.
- Keep answers concise and conversational, suitable for a voice or chat interface. Prefer short paragraphs or a short list over long prose.
- Cite which source(s) you used at the end as "Source: <name>".`;

/**
 * Helper to call Gemini REST API if GEMINI_API_KEY / GOOGLE_API_KEY is configured
 */
async function callGeminiAPI(geminiKey, question, context) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  const promptText = `${SYSTEM_PROMPT}\n\nContext (verified listings):\n${context}\n\nQuestion: ${question}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response text");
  return text;
}

/**
 * @param {string} question
 * @param {Array} businesses - matched Business mongoose docs
 * @returns {Promise<string>} the answer text
 */
async function answerQuestion(question, businesses) {
  const context = buildContext(businesses);

  // 1. Try Gemini API if GEMINI_API_KEY / GOOGLE_API_KEY is set
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && !geminiKey.includes("your_key")) {
    try {
      return await callGeminiAPI(geminiKey, question, context);
    } catch (geminiErr) {
      console.warn("[aiService] Gemini API call failed, trying Claude fallback:", geminiErr.message);
    }
  }

  // 2. Try Anthropic API if ANTHROPIC_API_KEY is set
  const anthropicKey = process.env.ANTHROPIC_API_KEY || "";
  const isPlaceholderAnthropic = !anthropicKey || anthropicKey.includes("your_key") || anthropicKey.includes("your-key");

  if (!isPlaceholderAnthropic) {
    try {
      const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
      const response = await getAnthropicClient().messages.create({
        model,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Context (verified listings):\n${context}\n\nQuestion: ${question}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock && textBlock.text) return textBlock.text;
    } catch (err) {
      console.warn("[aiService] Anthropic API call failed, falling back to database summary:", err.message);
    }
  }

  // 3. Fallback database synthesis generator if external AI keys are absent or fail
  if (!businesses || !businesses.length) {
    return "No verified business listing was found matching your request. Try asking about Creta, Hyryder, Hero Splendor, or Ramesh Sharma & Associates.";
  }

  const summaries = businesses.map((b) => {
    const entries = getFactEntries(b.facts);
    const factsList = entries
      .map(([k, v]) => `• **${k}**: ${v}`)
      .join("\n");
    return `### ${b.name} (${b.category})${b.verified ? " - Verified Listing" : ""}\n${b.description}\n\n**Key Details:**\n${factsList || "No specific specs provided."}\n\n*Source: ${b.name}*`;
  });

  return summaries.join("\n\n---\n\n");
}

module.exports = { answerQuestion, buildContext };

