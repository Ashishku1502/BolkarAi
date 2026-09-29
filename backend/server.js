require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const { seedIfEmpty } = require("./src/seed/seedData");
const Business = require("./src/models/Business");
const businessRoutes = require("./src/routes/business");
const askRoutes = require("./src/routes/ask");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

let initPromise = null;
function ensureDBInit() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDB();
      await seedIfEmpty();
    })();
  }
  return initPromise;
}

// Middleware to ensure DB connection & seeding
app.use(async (req, res, next) => {
  try {
    await ensureDBInit();
    next();
  } catch (err) {
    console.error("[server] DB connection error:", err.message);
    res.status(500).json({ error: "Database initialization failed" });
  }
});

// System health and metadata routes
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.get("/api/info", async (req, res) => {
  try {
    const businessCount = await Business.countDocuments();
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("your_key"));

    res.json({
      name: "Bolkar AI Backend",
      version: "0.1.0",
      status: "online",
      dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      businessCount,
      aiProviders: {
        gemini: hasGeminiKey,
        anthropic: hasAnthropicKey,
        fallbackMode: !hasGeminiKey && !hasAnthropicKey,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch system info" });
  }
});

app.use("/api/business", businessRoutes);
app.use("/api/ask", askRoutes);

// Generic error handler
app.use((err, req, res, next) => {
  console.error("[server] Uncaught exception:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(async () => {
      await seedIfEmpty();
      app.listen(PORT, () => console.log(`[server] Bolkar AI backend listening on :${PORT}`));
    })
    .catch((err) => {
      console.error("[server] failed to start:", err.message);
    });
}

module.exports = app;

