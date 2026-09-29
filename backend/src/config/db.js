const mongoose = require("mongoose");
const path = require("path");
const os = require("os");

let isConnecting = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (isConnecting) {
    while (mongoose.connection.readyState !== 1 && isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  isConnecting = true;
  mongoose.set("strictQuery", true);

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bolkar-ai";

  // Try the configured MONGODB_URI first
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[db] connected -> ${mongoose.connection.name}`);
    isConnecting = false;
    return;
  } catch (err) {
    console.log(`[db] Primary connection to ${uri} failed: ${err.message}`);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[db] Primary connection failed and we are in production. Cannot fallback to in-memory DB.");
    isConnecting = false;
    throw new Error(`Database connection failed: ${uri}`);
  }

  // Fallback to MongoMemoryServer for local dev / testing if local MongoDB daemon is not running
  console.log("[db] Starting in-memory MongoDB server...");
  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create({
      binary: {
        downloadDir: path.join(os.tmpdir(), "mongodb-binaries"),
      },
      instance: {
        launchTimeout: 60000,
      },
    });
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log(`[db] connected to in-memory MongoDB -> ${mongoose.connection.name}`);
  } catch (memErr) {
    console.error("[db] failed to start in-memory MongoDB:", memErr.message);
    isConnecting = false;
    throw memErr;
  }

  isConnecting = false;
}

module.exports = connectDB;
