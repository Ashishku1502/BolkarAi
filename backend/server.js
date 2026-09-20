require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { seedIfEmpty } = require("./src/seed/seedData");
const businessRoutes = require("./src/routes/business");
const askRoutes = require("./src/routes/ask");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// Middleware to ensure DB connection & seeding
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await seedIfEmpty();
    next();
  } catch (err) {
    console.error("[server] DB connection error:", err.message);
    res.status(500).json({ error: "Database initialization failed" });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/business", businessRoutes);
app.use("/api/ask", askRoutes);

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
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
