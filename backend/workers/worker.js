require("dotenv").config();

const mongoose =
  require("mongoose");

const os =
  require("os");

const fs =
  require("fs");

const { io } =
  require("socket.io-client");

const { v4: uuidv4 } =
  require("uuid");

const Task =
  require("../models/Task");

/* =========================
   WORKER CONFIG
========================= */

const WORKER_TYPE =
  process.env.WORKER_TYPE ||
  "cpu";

const workerId =
  uuidv4();

const MAX_ACTIVE_JOBS =
  Number(
    process.env.MAX_ACTIVE_JOBS ||
    3
  );

/* =========================
   WORKER STATE
========================= */

let activeJobs = 0;

let completedJobs = 0;

let failedJobs = 0;

let totalLatency = 0;

let healthInterval = null;

let isShuttingDown = false;
/* =========================
   SOCKET
========================= */

const socket =
  io(

    process.env.SERVER_URL ||

    "http://localhost:5000",

    {

      reconnection: true,

  reconnectionAttempts:
    Infinity,

  reconnectionDelay:
    1000,

  reconnectionDelayMax:
    5000,

  timeout:
    10000
    }
  );

/* =========================
   CONNECT
========================= */

socket.on(

  "connect",

  () => {

    console.log(

      `✅ Worker connected: ${workerId} (${WORKER_TYPE})`
    );

    socket.emit(

      "register-worker",

      workerId,

      WORKER_TYPE
    );
  }
);

/* =========================
   DISCONNECT
========================= */

socket.on(

  "disconnect",

  (reason) => {

    console.log(

      `❌ Worker disconnected: ${reason}`
    );
  }
);

/* =========================
   HEALTH REPORT
========================= */

function sendHealth(){

  if(!socket.connected){
    return;
  }const cpuUsage =
  activeJobs > 0

    ? Math.min(
        100,
        activeJobs * 35
      )

    : 5;
/* =========================
   WORKER MEMORY USAGE
========================= */
const totalMem =
  os.totalmem();

const usedMem =
  totalMem -
  os.freemem();

const ramUsage =
  Number(
    (
      (usedMem / totalMem) *
      100
    ).toFixed(2)
  );

/* =========================
   AVG LATENCY
========================= */
const avgLatency =

  completedJobs > 0

    ? Number(

        (
          totalLatency /
          completedJobs
        ).toFixed(1)

      )

    : 0;
  socket.emit(

    "heartbeat",

    workerId
  );
let status = "healthy";

if(
  activeJobs >=
  MAX_ACTIVE_JOBS
){

  status =
    "overloaded";
}
else if(
  activeJobs > 0
){

  status =
    "degraded";
}
  socket.emit(

    "health-update",

    {

      workerId,

      workerType:
        WORKER_TYPE,

      cpu:
        cpuUsage,

      ram:
        ramUsage,

      activeJobs,

      completedJobs,

      failedJobs,

      avgLatency,

      status,

      lastHeartbeat:
  Date.now()
    }
  );
}

/* =========================
   FAILURE SIMULATION
========================= */
function shouldFail(job){

  /* =========================
     DETERMINISTIC FAILURE TESTING
  ========================= */

  if(
    process.env.ENABLE_FAILURE_TESTING ===
    "true"
  ){

    const mode =
      process.env.FAILURE_TEST_MODE;

    if(
      mode ===
      "retry-success"
    ){

      const retryCount =
        Number(
          job?.data?.retryCount ||
          0
        );

      return retryCount === 0;
    }

    if(
      mode ===
      "permanent-failure"
    ){

      return true;
    }
  }

  /* =========================
     RANDOM FAILURE SIMULATION
  ========================= */

  if(
    process.env.ENABLE_FAILURE_SIMULATION !==
    "true"
  ){

    return false;
  }

  const failureRate =
    Number(
      process.env.FAILURE_RATE ||
      0.15
    );

  return (
    Math.random() <
    failureRate
  );
}
/* =========================
   TASK DELAY
========================= */
/* =========================
   CONTROLLED PROCESSING DELAY
========================= */

async function simulateDelay(taskType) {

  /*
   * Small controlled workload simulation.
   *
   * Purpose:
   * - Keep worker execution visible in the dashboard.
   * - Allow parallel worker activity to be observed.
   * - Avoid unnecessarily slowing deployed workloads.
   *
   * Can be disabled completely with:
   * ENABLE_PROCESSING_DELAY=false
   */

  if (process.env.ENABLE_PROCESSING_DELAY === "true") {
    return;
  }

  const delays = {
    video: 1000,
    audio: 800,
    image: 600,
    pdf: 600,
    text: 400,
    generic: 500
  };

  const delay = delays[taskType] ?? 500;

  await new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

/* =========================
   PROCESS TASK
========================= */

async function processTask(
  job
){
if(
  activeJobs >=
  MAX_ACTIVE_JOBS
){

  console.log(
    `⚠️ Worker ${workerId} at maximum capacity. Task ${job.id} rejected.`
  );

  socket.emit(

    "task-update",

    {

      jobId:
        job.id,

      workerId,

      status:
        "failed",

      error:
        "Worker capacity exceeded"
    }
  );

  return;
}

  const start =
    Date.now();

  activeJobs++;

  try{

    await Task
      .findOneAndUpdate(

        {
          jobId:
            job.id
        },

        {

          status:
            "processing",

          assignedWorker:
            workerId,

          startedAt:
            new Date()
        }
      );

    socket.emit(

      "task-update",

      {

        jobId:
          job.id,

        workerId,

        status:
          "processing"
      }
    );

    const taskType =

      job.data.taskType ||
      "text";

    /* =========================
       FAILURE
    ========================= */

  if(
  shouldFail(job)
){

  throw new Error(
    "Simulated task processing failure"
  );
}

   /* =========================
   VALIDATE FILE / CHUNK
========================= */

const processingPath =

  job.data.chunkPath ||
  job.data.filePath ||
  null;

let fileStats = null;

if(processingPath){

  if(
    !fs.existsSync(
      processingPath
    )
  ){

    throw new Error(
      `Processing file not found: ${processingPath}`
    );
  }

  fileStats =
    await fs.promises.stat(
      processingPath
    );

  if(
    fileStats.size === 0
  ){

    throw new Error(
      "Processing chunk is empty"
    );
  }
}

await simulateDelay(
  taskType
);

    let result = {};

    /* =========================
       TEXT
    ========================= */

    if(
  taskType === "text"
){

  const buffer =
    await fs.promises.readFile(
      processingPath
    );

  const processedText =
    buffer
      .toString("utf8")
      .toUpperCase();

  result = {

    processedChunk:
      processedText,

    chunkIndex:
      job.data.chunkIndex,

    analytics: {

      bytes:
        buffer.length,

      lines:
        processedText
          .split("\n")
          .length,

      words:

        processedText.trim()

          ? processedText
              .trim()
              .split(/\s+/)
              .length

          : 0
    }
  };
}

    /* =========================
       IMAGE
    ========================= */

    else if(
      taskType === "image"
    ){

      result = {

        processedChunk: `
IMAGE ANALYSIS COMPLETE

File:
${job.data.fileName}

Compression:
Completed

Metadata:
Extracted
`
      };
    }

    /* =========================
       AUDIO
    ========================= */
else if(
  taskType === "audio"
){

  result = {

    processedChunk: `
AUDIO CHUNK PROCESSING COMPLETE

File:
${job.data.fileName}

Chunk:
${job.data.chunkIndex + 1}/${job.data.totalChunks}

Chunk Size:
${fileStats ? fileStats.size : 0} bytes

Status:
Completed
`
  };
}
    /* =========================
       VIDEO
    ========================= */
    else if(
  taskType === "video"
){

  result = {

    processedChunk:
      JSON.stringify({

        fileName:
          job.data.fileName,

        chunk:
          job.data.chunkIndex + 1,

        totalChunks:
          job.data.totalChunks,

        chunkSize:
          fileStats
            ? fileStats.size
            : 0,

        processingSource:
          "disk-chunk",

        status:
          "completed"
      })
  };
}
/* =========================
   PDF
========================= */

else if(
  taskType === "pdf"
){

      result = {

        processedChunk: `
PDF PROCESSING COMPLETE

File:
${job.data.fileName}

Text Extraction:
Completed
`
      };
    }

    /* =========================
       DEFAULT
    ========================= */

    else{

      result = {

        processedChunk:
          "Generic processing completed"
      };
    }

    const responseTime =
      Date.now() - start;

    totalLatency +=
      responseTime;

    completedJobs++;
  
    activeJobs =
      Math.max(
        0,
        activeJobs - 1
      );
 sendHealth();
    await Task
      .findOneAndUpdate(

        {
          jobId:
            job.id
        },

        {

          status:
            "completed",

          completedAt:
            new Date(),

          responseTime,

          result
        }
      );
    const completedAt = Date.now();

const executionTimeMs =
  Math.max(
    0,
    completedAt - start
  );

socket.emit(
  "task-update",
  {
    jobId: job.id,
    workerId,
    workerType,
    status: "completed",

    responseTime:
      executionTimeMs,

    executionTimeMs,

    startedAt:
      new Date(start).toISOString(),

    completedAt:
      new Date(completedAt).toISOString(),

    result
  }
);

    console.log(

      `✅ ${workerId} completed ${job.id}`
    );

  }catch(err){

    failedJobs++;

    activeJobs =
      Math.max(
        0,
        activeJobs - 1
      );
  sendHealth();
    socket.emit(

      "task-update",

      {

        jobId:
          job.id,

        workerId,

        status:
          "failed",

        error:
          err.message
      }
    );

   console.error(
  `❌ Worker ${workerId} failed ${job.id}: ${err.message}`
);
  }
}

/* =========================
   START WORKER
========================= */

mongoose
  .connect(
    process.env.MONGO_URI
  )

  .then(() => {

    console.log(

      `✅ Worker MongoDB connected (${workerId})`
    );

    /* =========================
       HEALTH LOOP
    ========================= */

  healthInterval =
  setInterval(

    () => {

      sendHealth();

    },

    15000 // Slowed down from 2000ms to 15000ms to conserve commands
  );
    /* =========================
       TASK LISTENER
    ========================= */

    socket.on(

      "task",

      async (job) => {

        await processTask(
          job
        );
      }
    );
  })

  .catch((err) => {

    console.log(
      err.message
    );
  });

/* =========================
   GRACEFUL SHUTDOWN
========================= */

async function gracefulShutdown(
  signal
){

  if(isShuttingDown){
    return;
  }

  isShuttingDown = true;

  console.log(
    `\n🛑 ${signal} received. Stopping worker ${workerId}...`
  );

  if(healthInterval){

    clearInterval(
      healthInterval
    );
  }

  try{

    socket.disconnect();

    await mongoose.connection.close();

    console.log(
      `✅ Worker ${workerId} stopped safely`
    );

    process.exit(0);

  }catch(err){

    console.error(
      `❌ Worker shutdown error: ${err.message}`
    );

    process.exit(1);
  }
}

process.on(
  "SIGINT",
  () =>
    gracefulShutdown(
      "SIGINT"
    )
);

process.on(
  "SIGTERM",
  () =>
    gracefulShutdown(
      "SIGTERM"
    )
);