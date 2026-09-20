const express = require("express");
const Business = require("../models/Business");

const router = express.Router();

// GET /api/business/search?q=creta
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ results: [] });

  const results = await Business.find(
    { $text: { $search: q } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(10);

  res.json({ results });
});

// GET /api/business/:id
router.get("/:id", async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ error: "Business not found" });
  res.json({ business });
});

// POST /api/business - add/claim a listing
router.post("/", async (req, res) => {
  try {
    const business = await Business.create(req.body);
    res.status(201).json({ business });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
