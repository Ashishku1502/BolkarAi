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

  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[db] connected -> ${mongoose.connection.name}`);
      isConnecting = false;
      return;
    } catch (err) {
      console.error("[db] MongoDB connection failed:", err.message);
    }
  }

  // Try local or in-memory MongoDB
  try {
    const localUri = "mongodb://127.0.0.1:27017/bolkar-ai";
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[db] connected local -> ${mongoose.connection.name}`);
  } catch (err) {
    console.log("[db] Local MongoDB not reachable. Starting in-memory MongoDB server...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          downloadDir: path.join(os.tmpdir(), "mongodb-binaries"),
        },
        instanceOpts: [
          {
            launchTimeout: 120000,
          },
        ],
      });
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[db] connected to in-memory MongoDB -> ${mongoose.connection.name}`);
    } catch (memErr) {
      console.error("[db] failed to start in-memory MongoDB:", memErr.message);
      isConnecting = false;
      throw memErr;
    }
  }

  isConnecting = false;
}

module.exports = connectDB;
