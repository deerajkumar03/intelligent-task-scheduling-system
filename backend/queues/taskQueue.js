const { Queue } = require("bullmq");

const connection =
  require("../config/redis");

/* =========================
   TASK QUEUE
========================= */

const taskQueue =
  new Queue(

    "intelligent-task-queue",

    {
      connection
    }
  );

/* =========================
   EXPORT
========================= */

module.exports =
  taskQueue;