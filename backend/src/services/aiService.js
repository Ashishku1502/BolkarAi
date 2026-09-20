const Anthropic = require("@anthropic-ai/sdk");

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Turns a list of matched Business documents into a compact context
 * block for the model. This is the "retrieval" half of the RAG loop -
 * intentionally simple (Mongo text search) for the MVP. Swap this
 * function's caller for a vector search (Pinecone / Atlas Vector
 * Search) later without touching the prompt logic below.
 */
function buildContext(businesses) {
  if (!businesses.length) return "No verified listing was found for this question.";

  return businesses
    .map((b, i) => {
      const facts = b.facts && b.facts.size ? [...b.facts.entries()].map(([k, v]) => `  - ${k}: ${v}`).join("\n") : "  (no structured facts on file)";
      return [
        `[Source ${i + 1}] ${b.name} (${b.category})${b.verified ? " - VERIFIED" : ""}`,
        b.tagline ? `Tagline: ${b.tagline}` : null,
        `Description: ${b.description}`,
        `Facts:\n${facts}`,
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
 * @param {string} question
 * @param {Array} businesses - matched Business mongoose docs
 * @returns {Promise<string>} the answer text
 */
async function answerQuestion(question, businesses) {
  const context = buildContext(businesses);
  const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620";
  const apiKey = process.env.ANTHROPIC_API_KEY || "";

  const isPlaceholderKey = !apiKey || apiKey.includes("your_key") || apiKey.includes("your-key");

  if (!isPlaceholderKey) {
    try {
      const response = await getClient().messages.create({
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

  // Fallback response generator if API key is unconfigured or fails
  if (!businesses || !businesses.length) {
    return "No verified business listing was found matching your request. Try asking about Creta, Hyryder, Hero Splendor, or Ramesh Sharma & Associates.";
  }

  const summaries = businesses.map((b) => {
    const factsList = b.facts && (b.facts instanceof Map ? Array.from(b.facts.entries()) : Object.entries(b.facts))
      .map(([k, v]) => `• **${k}**: ${v}`)
      .join("\n");
    return `### ${b.name} (${b.category})\n${b.description}\n\n**Key Details:**\n${factsList || "No specific specs provided."}\n\n*Source: ${b.name}*`;
  });

  return (
    (isPlaceholderKey ? "> *Note: Add your `ANTHROPIC_API_KEY` to `.env` for AI-synthesized responses.*\n\n" : "") +
    summaries.join("\n\n---\n\n")
  );
}

module.exports = { answerQuestion, buildContext };
