const express = require("express");
const mongoose = require("mongoose");
const Business = require("../models/Business");
const { searchBusinesses } = require("../utils/searchHelper");

const router = express.Router();

// GET /api/business - list all listings with optional category filter & pagination
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) {
      filter.category = new RegExp(req.query.category.trim(), "i");
    }
    if (req.query.verified !== undefined) {
      filter.verified = req.query.verified === "true";
    }

    const [businesses, total] = await Promise.all([
      Business.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Business.countDocuments(filter),
    ]);

    res.json({
      businesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("[business] list error:", err.message);
    res.status(500).json({ error: "Failed to fetch business listings" });
  }
});

// GET /api/business/search?q=creta
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ results: [] });

  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const results = await searchBusinesses(q, limit);
    res.json({ results });
  } catch (err) {
    console.error("[business] search error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/business/:id - get single listing by ID with validation
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid business ID format" });
  }

  try {
    const business = await Business.findById(id);
    if (!business) return res.status(404).json({ error: "Business not found" });
    res.json({ business });
  } catch (err) {
    console.error("[business] fetch by ID error:", err.message);
    res.status(500).json({ error: "Failed to fetch business details" });
  }
});

// POST /api/business - create/claim a listing
router.post("/", async (req, res) => {
  try {
    const { name, category, description } = req.body || {};
    if (!name || !category || !description) {
      return res.status(400).json({ error: "name, category, and description are required fields" });
    }

    const business = await Business.create(req.body);
    res.status(201).json({ business });
  } catch (err) {
    console.error("[business] create error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/business/:id - update a business listing
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid business ID format" });
  }

  try {
    const updated = await Business.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "Business not found" });
    res.json({ business: updated });
  } catch (err) {
    console.error("[business] update error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/business/:id - delete a business listing
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid business ID format" });
  }

  try {
    const deleted = await Business.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Business not found" });
    res.json({ message: "Business deleted successfully", id });
  } catch (err) {
    console.error("[business] delete error:", err.message);
    res.status(500).json({ error: "Failed to delete business" });
  }
});

module.exports = router;

