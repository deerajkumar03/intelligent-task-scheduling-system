require("dotenv").config();

const { fork } =
  require("child_process");

const path =
  require("path");

/* =========================
   CONFIG
========================= */

const MAX_DYNAMIC_WORKERS =
  Number(
    process.env.MAX_DYNAMIC_WORKERS ||
    4
  );

const IDLE_TIMEOUT =
  Number(
    process.env.DYNAMIC_WORKER_IDLE_TIMEOUT ||
    60000
  );

const SPAWN_COOLDOWN =
  Number(
    process.env.DYNAMIC_WORKER_SPAWN_COOLDOWN ||
    10000
  );
const DYNAMIC_WORKER_QUEUE_THRESHOLD =
  Number(
    process.env.DYNAMIC_WORKER_QUEUE_THRESHOLD ||
    8
  );
/* =========================
   STATE
========================= */

const dynamicWorkers =
  new Map();

let lastSpawnTime = 0;

let cleanupInterval = null;

/* =========================
   WORKER FILE
========================= */

const workerScript =
  path.join(
    __dirname,
    "../workers/worker.js"
  );

/* =========================
   SPAWN WORKER
========================= */

function spawnWorker(
  type = "cpu"
){

  const now =
    Date.now();

  if(
    dynamicWorkers.size >=
    MAX_DYNAMIC_WORKERS
  ){

    return null;
  }

  if(
    now - lastSpawnTime <
    SPAWN_COOLDOWN
  ){

    return null;
  }

  const worker =
    fork(
      workerScript,
      [],
      {
        env: {
          ...process.env,

          WORKER_TYPE:
            type,

          DYNAMIC_WORKER:
            "true"
        }
      }
    );

  const workerInfo = {

    process:
      worker,

    pid:
      worker.pid,

    type,

    spawnedAt:
      now,

    lastUsed:
      now,

    active:
      true
  };

  dynamicWorkers.set(
    worker.pid,
    workerInfo
  );

  lastSpawnTime =
    now;

  console.log(
    `⚡ Dynamic ${type.toUpperCase()} worker spawned | PID=${worker.pid}`
  );

  worker.on(
    "exit",

    (code, signal) => {

      dynamicWorkers.delete(
        worker.pid
      );

      console.log(
        `🛑 Dynamic worker exited | PID=${worker.pid} | CODE=${code} | SIGNAL=${signal}`
      );
    }
  );

  worker.on(
    "error",

    (err) => {

      dynamicWorkers.delete(
        worker.pid
      );

      console.error(
        `❌ Dynamic Worker Error | PID=${worker.pid} | ${err.message}`
      );
    }
  );

  return worker.pid;
}

/* =========================
   TOUCH WORKER
========================= */

function touchWorker(
  pid
){

  const worker =
    dynamicWorkers.get(
      Number(pid)
    );

  if(!worker){
    return;
  }

  worker.lastUsed =
    Date.now();
}

/* =========================
   TERMINATE WORKER
========================= */

function terminateWorker(
  pid
){

  const worker =
    dynamicWorkers.get(
      Number(pid)
    );

  if(!worker){
    return;
  }

  try{

    worker.process.kill(
      "SIGTERM"
    );

  }catch(err){

    console.error(
      `❌ Dynamic Worker Termination Error | PID=${pid} | ${err.message}`
    );
  }
}

/* =========================
   LOAD BALANCING
========================= */

function balanceWorkers(
  queueSize,
  workerType = "cpu"
){

 if(
  queueSize <
  DYNAMIC_WORKER_QUEUE_THRESHOLD
){
  return null;
}

  return spawnWorker(
    workerType
  );
}

/* =========================
   CLEANUP IDLE WORKERS
========================= */

function cleanupWorkers(){

  const now =
    Date.now();

  dynamicWorkers.forEach(
    (worker, pid) => {

      const idleTime =
        now -
        worker.lastUsed;

      if(
  idleTime >
  IDLE_TIMEOUT
){

  console.log(
    `🕒 Dynamic worker idle timeout | PID=${pid}`
  );

  terminateWorker(
    pid
  );
}
    }
  );
}

/* =========================
   START MANAGER
========================= */

function startDynamicWorkerManager(){

  if(cleanupInterval){
    return;
  }

  cleanupInterval =
    setInterval(
      cleanupWorkers,
      15000
    );
}

/* =========================
   STOP MANAGER
========================= */

async function stopDynamicWorkerManager(){

  if(cleanupInterval){

    clearInterval(
      cleanupInterval
    );

    cleanupInterval =
      null;
  }

  const workers =
    Array.from(
      dynamicWorkers.values()
    );

  for(
    const worker of workers
  ){

    try{

      worker.process.kill(
        "SIGTERM"
      );

    }catch(err){

      console.error(
        `❌ Dynamic Worker Shutdown Error | PID=${worker.pid} | ${err.message}`
      );
    }
  }

  dynamicWorkers.clear();
}

/* =========================
   METRICS
========================= */

function getDynamicMetrics(){

  return {

    activeTemporaryWorkers:
      dynamicWorkers.size,

    maxTemporaryWorkers:
      MAX_DYNAMIC_WORKERS,

    workers:

      Array.from(
        dynamicWorkers.values()
      ).map(
        (worker) => ({

          pid:
            worker.pid,

          type:
            worker.type,

          uptime:
            Date.now() -
            worker.spawnedAt,

          idleTime:
            Date.now() -
            worker.lastUsed
        })
      )
  };
}

/* =========================
   EXPORTS
========================= */

module.exports = {

  spawnWorker,

  terminateWorker,

  touchWorker,

  balanceWorkers,

  getDynamicMetrics,

  startDynamicWorkerManager,

  stopDynamicWorkerManager
};