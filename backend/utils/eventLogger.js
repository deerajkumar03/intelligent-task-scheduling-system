const redis =
  require("../config/redis");

/* =========================
   EVENT LOGGER
========================= */

async function logEvent(

  type,

  message,

  metadata = {}

) {

  try {

    const event = {

      type,

      message,

      metadata,

      timestamp:
        new Date()
          .toISOString()
    };

    await redis.lpush(

      "orchestration:event-history",

      JSON.stringify(event)
    );

    /* =========================
       LIMIT HISTORY
    ========================= */

    await redis.ltrim(

      "orchestration:event-history",

      0,

      499
    );

  } catch (err) {

    console.error(
  "❌ Event Logger Error:",
  err
);
  }
}

/* =========================
   EXPORT
========================= */

module.exports = {

  logEvent
};