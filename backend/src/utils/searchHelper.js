const Business = require("../models/Business");

const STOP_WORDS = new Set([
  "a", "an", "the", "tell", "me", "about", "what", "is", "are", "how", "much", "does", "do",
  "cost", "price", "find", "show", "can", "you", "explain", "versus", "near", "in", "of", "for", "with", "best"
]);

/**
 * Escapes regex special characters to prevent SyntaxError on user inputs containing ?, +, (, ), $, etc.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Perform hybrid text & regex search with fallback matching for robust RAG retrieval
 */
async function searchBusinesses(queryText, limit = 5) {
  const cleanQuery = (queryText || "").trim();
  if (!cleanQuery) return [];

  // 1. Try $text search
  try {
    const textMatches = await Business.find(
      { $text: { $search: cleanQuery } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    if (textMatches && textMatches.length > 0) {
      return textMatches;
    }
  } catch (err) {
    console.warn("[search] $text search failed or index building, using regex fallback:", err.message);
  }

  // 2. Keyword extraction & regex matching fallback
  const keywords = cleanQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  if (keywords.length > 0) {
    try {
      const escapedKeywordsPattern = keywords.map(escapeRegex).join("|");
      const regexMatches = await Business.find({
        $or: [
          { name: { $regex: escapedKeywordsPattern, $options: "i" } },
          { category: { $regex: escapedKeywordsPattern, $options: "i" } },
          { tags: { $in: keywords.map((k) => new RegExp(escapeRegex(k), "i")) } },
          { description: { $regex: escapedKeywordsPattern, $options: "i" } },
        ],
      }).limit(limit);

      if (regexMatches && regexMatches.length > 0) {
        return regexMatches;
      }
    } catch (regexErr) {
      console.warn("[search] regex fallback failed:", regexErr.message);
    }
  }

  // 3. Fallback: Return catalog listings if catalog is small
  try {
    return await Business.find({}).limit(limit);
  } catch (allErr) {
    return [];
  }
}

module.exports = { searchBusinesses, escapeRegex };

