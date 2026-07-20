const {

  QueueEvents

} = require(
  "bullmq"
);

const connection =
  require("../config/redis");

/* =========================
   QUEUE EVENTS
========================= */

const queueEvents =
  new QueueEvents(

    "intelligent-task-queue",

    {
      connection
    }
  );

queueEvents.on(
  "error",

  (err) => {

    console.error(
      `❌ QueueEvents Error: ${err.message}`
    );
  }
);

/* =========================
   EXPORT
========================= */

module.exports =
  queueEvents;