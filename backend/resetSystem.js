require("dotenv").config();

const mongoose =
  require("mongoose");

const Task =
  require("./models/Task");

const WorkerMetrics =
  require("./models/WorkerMetrics");

const taskQueue =
  require("./queues/taskQueue");

const connection =
  require("./config/redis");

/* =========================
   RESET SYSTEM
========================= */

async function resetSystem(){

  try{

    /* =========================
       CONNECT MONGODB
    ========================= */

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB connected"
    );

    /* =========================
       CLEAR TASK DATA
    ========================= */

    await Task.deleteMany({});

    console.log(
      "✅ MongoDB tasks cleared"
    );

    /* =========================
       CLEAR WORKER METRICS
    ========================= */

    await WorkerMetrics.deleteMany({});

    console.log(
      "✅ Worker metrics cleared"
    );

    /* =========================
       CLEAR REDIS QUEUE
    ========================= */

    await taskQueue.drain(
      true
    );

    await taskQueue.clean(
      0,
      1000,
      "completed"
    );

    await taskQueue.clean(
      0,
      1000,
      "failed"
    );

    await taskQueue.clean(
      0,
      1000,
      "delayed"
    );

    await taskQueue.clean(
      0,
      1000,
      "wait"
    );

    console.log(
      "✅ Redis queue cleared"
    );

    console.log(
      "🚀 System reset completed successfully"
    );

  }catch(err){

    console.error(
      "❌ System reset failed:",
      err.message
    );

    process.exitCode = 1;

  }finally{

    /* =========================
       CLOSE CONNECTIONS
    ========================= */

    try{

      await taskQueue.close();

    }catch(err){

      console.error(
        "⚠️ Queue close error:",
        err.message
      );
    }

    try{

      if(
        connection.status !==
        "end"
      ){

        await connection.quit();
      }

    }catch(err){

      console.error(
        "⚠️ Redis close error:",
        err.message
      );
    }

    try{

      await mongoose.connection.close();

    }catch(err){

      console.error(
        "⚠️ MongoDB close error:",
        err.message
      );
    }
  }
}

resetSystem();