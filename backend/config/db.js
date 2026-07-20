require("dotenv")
  .config();

const mongoose =
  require("mongoose");

/* =========================
   CONNECT DATABASE
========================= */

const connectDB =
  async () => {

    try {

    await mongoose.connect(

  process.env.MONGO_URI,

  {

    serverSelectionTimeoutMS:
      5000,

    maxPoolSize:
      10
  }
);

      console.log(
        "✅ MongoDB connected"
      );

    } catch (err) {

      console.error(
        "❌ MongoDB error:",
        err.message
      );

      process.exit(1);
    }
  };

/* =========================
   EVENTS
========================= */

mongoose.connection.on(
  "disconnected",

  () => {

    console.log(
      "⚠️ MongoDB disconnected"
    );
  }
);

mongoose.connection.on(
  "reconnected",

  () => {

    console.log(
      "♻️ MongoDB reconnected"
    );
  }
);

/* =========================
   EXPORT
========================= */

module.exports =
  connectDB;