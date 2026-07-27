const { Redis } = require("ioredis");

require("dotenv").config();

const connection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",

  port: Number(process.env.REDIS_PORT || 6379),

  username:
    process.env.REDIS_USERNAME || "default",

  password:
    process.env.REDIS_PASSWORD || undefined,

  maxRetriesPerRequest: null,

  enableReadyCheck: false,

  retryStrategy: (times) => {
    return Math.min(times * 100, 3000);
  },
});

connection.on("connect", () => {
  console.log("✅ Redis connected");
});

connection.on("ready", () => {
  console.log("🚀 Redis is ready");
});

connection.on("error", (err) => {
  console.log("❌ Redis Error:", err.message);
});

connection.on("reconnecting", () => {
  console.log("♻️ Redis reconnecting...");
});

module.exports = connection;