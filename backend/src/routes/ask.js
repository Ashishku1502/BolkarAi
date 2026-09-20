const express = require("express");
const Business = require("../models/Business");
const { answerQuestion } = require("../services/aiService");

const router = express.Router();

// POST /api/ask  { "question": "Compare Creta vs Hyryder" }
router.post("/", async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question) return res.status(400).json({ error: "question is required" });

  try {
    // Retrieval step: Mongo text search across name/category/tags/description.
    // Top matches become the grounding context for the model. Replace with
    // a vector search (Pinecone / Atlas Vector Search) when the catalog
    // grows past what keyword matching can handle well.
    const matches = await Business.find(
      { $text: { $search: question } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5);

    const answer = await answerQuestion(question, matches);

    res.json({
      answer,
      sources: matches.map((b) => ({ id: b._id, name: b.name, category: b.category, verified: b.verified })),
    });
  } catch (err) {
    console.error("[ask] error:", err.message);
    res.status(500).json({ error: "Something went wrong answering that question. Check the server logs." });
  }
});

module.exports = router;
