const express = require("express");
const Business = require("../models/Business");
const { answerQuestion } = require("../services/aiService");
const { searchBusinesses } = require("../utils/searchHelper");

const router = express.Router();

// POST /api/ask  { "question": "Compare Creta vs Hyryder" }
router.post("/", async (req, res) => {
  const question = (req.body?.question || "").trim();
  if (!question) {
    return res.status(400).json({ error: "question is required in request body" });
  }

  try {
    // Retrieval step: Hybrid $text and keyword regex fallback search.
    const matches = await searchBusinesses(question, 5);

    const answer = await answerQuestion(question, matches);

    res.json({
      question,
      answer,
      sources: matches.map((b) => ({
        id: b._id,
        name: b.name,
        category: b.category,
        verified: b.verified,
      })),
    });
  } catch (err) {
    console.error("[ask] error:", err.message);
    res.status(500).json({ error: "Something went wrong answering that question. Check the server logs." });
  }
});

module.exports = router;

