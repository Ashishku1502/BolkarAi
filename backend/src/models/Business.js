const mongoose = require("mongoose");

/**
 * A Business/Product/Professional profile - the "official AI profile"
 * that Bolkar AI answers questions from. Kept deliberately flexible
 * (facts is a free-form map) so the same schema covers a vehicle model,
 * a lawyer, an insurance policy, or a restaurant without a schema change
 * per category. Tighten this up once real categories are locked in.
 */
const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true }, // e.g. "Automobile", "Lawyer", "Insurance Policy"
    tagline: { type: String, trim: true },
    description: { type: String, required: true },

    // Free-form key facts shown to the AI as grounding context and to
    // users as a spec sheet, e.g. { "Mileage": "50 km/l", "Price": "₹75,000" }
    facts: { type: Map, of: String, default: {} },

    website: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    tags: { type: [String], default: [], index: true },

    verified: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Basic text index so /api/business/search can match name, category, tags
businessSchema.index({ name: "text", category: "text", tags: "text", description: "text" });

module.exports = mongoose.model("Business", businessSchema);
