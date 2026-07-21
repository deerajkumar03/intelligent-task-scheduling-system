const { Redis } = require("ioredis");

require("dotenv").config();

const connection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",

  port: Number(
    process.env.REDIS_PORT || 6379
  ),

  password:
    process.env.REDIS_PASSWORD || undefined,

  tls:
    process.env.REDIS_TLS === "true"
      ? {}
      : undefined,

  maxRetriesPerRequest: null,

  enableReadyCheck: false,

  retryStrategy: (times) => {
    return Math.min(times * 100, 3000);
  },
});

connection.on("connect", () => {
  console.log("✅ Redis connected");
});

connection.on("error", (err) => {
  console.log(
    "❌ Redis Error:",
    err.message
  );
});

connection.on("reconnecting", () => {
  console.log("♻️ Redis reconnecting...");
});

module.exports = connection;