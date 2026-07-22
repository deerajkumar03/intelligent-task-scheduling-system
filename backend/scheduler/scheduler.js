const Task =
  require("../models/Task");

const redis =
  require("../config/redis");

const WorkerMetrics =
  require("../models/WorkerMetrics");

const {
  logEvent
} = require(
  "../utils/eventLogger"
);

/* =========================
   WORKER REGISTRY
========================= */

let workers = {};

/* =========================
   ASSIGNMENT LOCK
========================= */

const assignedJobs =
  new Set();

/* =========================
   PRIORITY MAP
========================= */

const PRIORITY_MAP = {

  critical: 4,

  high: 3,

  normal: 2,

  low: 1
};


/* =========================
   GLOBAL METRICS
========================= */
const completionTimestamps = [];
let metrics = {

  totalJobs: 0,

  completedJobs: 0,

  failedJobs: 0,

  retries: 0,

  totalResponseTime: 0,

  throughput: 0,

  pendingQueue: 0,

  processingQueue: 0
};

/* =========================
   REDIS SYNC
========================= */

async function syncWorkerState(
  workerId
){

  try{

    const worker =
      workers[workerId];

    if(!worker){
      return;
    }

    await redis.hset(

      "scheduler:workers",

      workerId,

      JSON.stringify(worker)
    );

  }catch(err){

    console.log(
      `❌ Redis Sync Error: ${err.message}`
    );
  }
}

/* =========================
   REGISTER WORKER
========================= */

async function registerWorker(

  workerId,
  socketId,
  type = "cpu"

){

const existingWorker =
  workers[workerId];

workers[workerId] = {

  id:
    workerId,

  socketId,

  type,

  load:
    existingWorker?.load || 0,

  avgTime:
    existingWorker?.avgTime || 0,

  jobsCompleted:
    existingWorker?.jobsCompleted || 0,

  failures:
    existingWorker?.failures || 0,

  taskHistory:
    existingWorker?.taskHistory || {},

  active: true,

  lastSeen:
    Date.now(),

  lastAssigned:
    existingWorker?.lastAssigned || 0,

  state: "healthy",

  lastFailureTime:
    existingWorker?.lastFailureTime || null
};

  await WorkerMetrics
    .findOneAndUpdate(

      {
        workerId
      },

      {

        workerId,

        workerType:
          type,

       lastHeartbeat:
          new Date()
      },

      {

        upsert: true,

        returnDocument: "after"
      }
    );

  await syncWorkerState(
    workerId
  );

  console.log(
    `✅ Scheduler Registered Worker: ${workerId}`
  );
}

/* =========================
   HEARTBEAT
========================= */
async function heartbeat(
  workerId
){

  if(
    workers[workerId]
  ){

    workers[
      workerId
    ].lastSeen =
      Date.now();

    await WorkerMetrics
      .findOneAndUpdate(

        {
          workerId
        },

        {

          $set: {

            lastHeartbeat:
              new Date()
          }
        }
      );

    await syncWorkerState(
      workerId
    );
  }
}

/* =========================
   CLEANUP DEAD WORKERS
========================= */

function cleanupWorkers(
  timeout = 180000
){

  const now =
    Date.now();

  for(
    let id in workers
  ){

    const worker =
      workers[id];

    if(!worker){
      continue;
    }

    if(

      now -
      worker.lastSeen >

      timeout

    ){

      console.log(
        `❌ Removing dead worker: ${id}`
      );

      delete workers[id];
redis.hdel(
  "scheduler:workers",
  id
).catch((err) => {

  console.error(
    `❌ Redis Worker Cleanup Error: ${err.message}`
  );
});
    }
  }
}

/* =========================
   TASK TYPE ROUTING
========================= */

function preferredWorkerType(
  taskType
){

  switch(taskType){

    case "text":

    case "image":

    case "pdf":

      return "cpu";

    case "audio":

    case "video":

      return "io";

    default:

      return "cpu";
  }
}

/* =========================
   WORKER STATE
========================= */

function evaluateWorkerState(
  worker
){

  if(

    Date.now() -
    worker.lastSeen >

    180000

  ){

    worker.state =
      "offline";

    return;
  }

  if(

    worker.lastFailureTime &&

    (
      Date.now() -
      worker.lastFailureTime
    ) < 30000

  ){

    worker.state =
      "recovering";

    return;
  }

  if(
  worker.load >= 3
  ){

    worker.state =
      "overloaded";

    return;
  }

  worker.state =
    "healthy";
}

/* =========================
   SCHEDULING SCORE
========================= */

function calculateScore(

  worker,
  taskType,
  priorityWeight = 1

){

  evaluateWorkerState(
    worker
  );

  const loadPenalty =
    worker.load * 10;

  const latencyPenalty =
    worker.avgTime * 0.02;

  const failurePenalty =
    worker.failures * 15;

  const specializationBoost =

    worker.type ===
    preferredWorkerType(taskType)

      ? -40
      : 20;

  const historicalBoost =

    (
      worker.taskHistory[
        taskType
      ] || 0
    ) * -2;

  const priorityBoost =
    priorityWeight * -8;

  const statePenaltyMap = {

    healthy: 0,

    recovering: 20,

    overloaded: 40,

    offline: 1000
  };

  const statePenalty =

    statePenaltyMap[
      worker.state
    ] || 0;

  return (

    loadPenalty +

    latencyPenalty +

    failurePenalty +

    specializationBoost +

    historicalBoost +

    priorityBoost +

    statePenalty
  );
}

/* =========================
   DECISION EXPLAINER
========================= */

function explainDecision(

  worker,
  taskType,
  priorityWeight

){

  return {

    workerId:
      worker.id,

    workerType:
      worker.type,

    taskType,

    load:
      worker.load,

    avgLatency:
      worker.avgTime
        .toFixed(2),

    priorityBoost:
      priorityWeight,

    selectedBecause: [

      worker.type ===
      preferredWorkerType(taskType)

        ? "specialized-worker"
        : "fallback-worker",

      worker.load < 3
        ? "low-load"
        : "high-load",

      worker.state === "healthy"
        ? "healthy-worker"
        : worker.state
    ]
  };
}

/* =========================
   SELECT BEST WORKER
========================= */

function selectBestWorker(

  taskType = "text",
  priorityWeight = 1

){

  let availableWorkers =
    Object.values(
      workers
    );

  if(
    availableWorkers.length === 0
  ){

    return null;
  }

  let candidateWorkers =

    availableWorkers.filter(
      (worker) => {

        if(

          taskType === "video" ||

          taskType === "audio"

        ){

          return (
            worker.type === "io"
          );
        }

        if(

          taskType === "text" ||

          taskType === "image" ||

          taskType === "pdf"

        ){

          return (
            worker.type === "cpu"
          );
        }

        return true;
      }
    );

  if(
    candidateWorkers.length === 0
  ){

    candidateWorkers =
      availableWorkers;
  }

  candidateWorkers
    .forEach((worker) => {

      worker.score =
        calculateScore(

          worker,

          taskType,

          priorityWeight
        );
    });

  candidateWorkers.sort(
    (a, b) =>
      a.score -
      b.score
  );

  return candidateWorkers[0];
}

/* =========================
   ASSIGN JOB
========================= */

async function assignJob(
  job
){

  cleanupWorkers();

  if(
    assignedJobs.has(job.id)
  ){

    console.log(
      `⚠️ Duplicate blocked: ${job.id}`
    );

    return null;
  }

  const taskType =

    job.data.taskType ||
    "text";

  const taskPriority =

    job.priority ||
    "normal";

  const priorityWeight =

    PRIORITY_MAP[
      taskPriority
    ] || 1;

  const worker =
    selectBestWorker(

      taskType,

      priorityWeight
    );

  if(!worker){

    console.log(
      `❌ No available worker`
    );

    return null;
  }

  const decisionTelemetry =

    explainDecision(

      worker,

      taskType,

      priorityWeight
    );

  assignedJobs.add(
    job.id
  );

  worker.load++;

  worker.lastAssigned =
    Date.now();

  metrics.processingQueue++;

  metrics.totalJobs++;

  console.log(
    `🚀 Assigning ${job.id} → ${worker.id}`
  );

  console.log(
    "🧠 Decision:",
    decisionTelemetry
  );

  await Task
  .findOneAndUpdate(

    {
      jobId:
        job.id
    },

    {
      status:
        "processing",

      assigned:
        true,

      assignedWorker:
        worker.id,

      startedAt:
        new Date()
    }
  );

  await logEvent(

    "assignment",

    `Task ${job.id} assigned to ${worker.id}`,

    {

      taskId:
        job.id,

      workerId:
        worker.id,

      taskType
    }
  );

  await syncWorkerState(
    worker.id
  );

  return worker;
}

/* =========================
   JOB COMPLETED
========================= */

async function jobCompleted(

  workerId,

  time,

  jobId = null,

  taskType = "text"

){

  const worker =
    workers[workerId];

  if(!worker){
    return;
  }

  worker.load =
    Math.max(
      0,
      worker.load - 1
    );

  worker.jobsCompleted++;

  worker.avgTime = (

    (

      worker.avgTime *

      (
        worker.jobsCompleted - 1
      )

    ) + time

  ) / worker.jobsCompleted;

  if(
    !worker.taskHistory[
      taskType
    ]
  ){

    worker.taskHistory[
      taskType
    ] = 0;
  }

  worker.taskHistory[
    taskType
  ]++;

  metrics.processingQueue =
    Math.max(
      0,
      metrics.processingQueue - 1
    );

 metrics.completedJobs++;

metrics.totalResponseTime +=
  time;
  completionTimestamps.push(
  Date.now()
);

while(

  completionTimestamps.length >

  0 &&

  Date.now() -
  completionTimestamps[0]

  > 60000

){

  completionTimestamps.shift();
}

metrics.throughput =

  completionTimestamps.length / 60;
  if(jobId){

    assignedJobs.delete(
      jobId
    );
  }

  await WorkerMetrics
    .findOneAndUpdate(

      {
        workerId
      },

      {

        $inc: {

          completedJobs: 1
        },

        $set: {

          avgLatency:
            worker.avgTime,

           status: worker.state,

         lastHeartbeat:
            new Date()
        }
      }
    );

  await syncWorkerState(
    workerId
  );

  console.log(
    `✅ Worker ${workerId} completed`
  );

  await logEvent(

    "completion",

    `Worker ${workerId} completed ${jobId}`,

    {

      workerId,

      jobId,

      taskType
    }
  );
}

/* =========================
   JOB FAILED
========================= */
async function jobFailed(

  workerId,
  jobId = null,
  permanent = false

){

  const worker =
    workers[workerId];

  if(!worker){
    return;
  }

  worker.failures++;

  worker.lastFailureTime =
    Date.now();

  worker.load =
    Math.max(
      0,
      worker.load - 1
    );

  metrics.processingQueue =
    Math.max(
      0,
      metrics.processingQueue - 1
    );

  /*
    failedJobs counts only tasks
    that exhausted all retries.
  */

  if(permanent){

    metrics.failedJobs++;
  }

  if(jobId){

    assignedJobs.delete(
      jobId
    );
  }

  await WorkerMetrics
    .findOneAndUpdate(

      {
        workerId
      },

      {

       $inc: {

  failedJobs:
    permanent ? 1 : 0
},

$set: {

  status:
    "recovering",

  lastHeartbeat:
    new Date()
}
      }
    );

  await syncWorkerState(
    workerId
  );

  console.log(

    permanent

      ? `❌ Worker ${workerId} permanently failed ${jobId}`

      : `⚠ Worker ${workerId} execution attempt failed ${jobId}`
  );

  await logEvent(

    permanent

      ? "permanent-failure"

      : "attempt-failure",

    permanent

      ? `Task ${jobId} permanently failed`

      : `Task ${jobId} attempt failed`,

    {

      workerId,

      jobId,

      permanent
    }
  );
}

/* =========================
   RETRY TRACKING
========================= */

function retryTracked(){

  metrics.retries++;
}

/* =========================
   GET METRICS
========================= */

function getMetrics(){

  const successRate =

    metrics.totalJobs > 0

      ? (

          (
            metrics.completedJobs /
            metrics.totalJobs
          ) * 100

        ).toFixed(2)

      : 0;

  const avgResponseTime =

    metrics.completedJobs > 0

      ? (

          metrics.totalResponseTime /
          metrics.completedJobs

        ).toFixed(2)

      : 0;

  return {

    totalJobs:
      metrics.totalJobs,

    completedJobs:
      metrics.completedJobs,

    failedJobs:
      metrics.failedJobs,

    retries:
      metrics.retries,

    throughput:
      Number(
        metrics.throughput
      ).toFixed(2),

    successRate,

    avgResponseTime,

    activeWorkers:
      Object.keys(
        workers
      ).length,

    workers
  };
}

/* =========================
   RELEASE ORPHANED JOB
========================= */

async function releaseOrphanedJob(
  workerId,
  jobId
){

  if(jobId){

    assignedJobs.delete(
      jobId
    );
  }

  const worker =
    workers[workerId];

  if(worker){

    worker.load =
      Math.max(
        0,
        worker.load - 1
      );

    await syncWorkerState(
      workerId
    );
  }

  metrics.processingQueue =
    Math.max(
      0,
      metrics.processingQueue - 1
    );

  console.log(
    `♻ Released orphaned task ${jobId} from worker ${workerId}`
  );
}
async function unregisterWorker(
  workerId
){

  if(
    workers[workerId]
  ){

    delete workers[
      workerId
    ];
  }

  try{

    await redis.hdel(
      "scheduler:workers",
      workerId
    );

  }catch(err){

    console.error(
      `❌ Redis Worker Unregister Error: ${err.message}`
    );
  }
}
/* =========================
   EXPORTS
========================= */

module.exports = {

  registerWorker,

  unregisterWorker,

  heartbeat,

  assignJob,

  jobCompleted,

  jobFailed,

  retryTracked,

  releaseOrphanedJob,

  getMetrics
};