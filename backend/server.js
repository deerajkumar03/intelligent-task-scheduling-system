require("dotenv").config();

const express =
  require("express");

const cors =
  require("cors");

const http =
  require("http");

const multer =
  require("multer");

const fs =
  require("fs");

const path =
  require("path");

const crypto =
  require("crypto");

const { Server } =
  require("socket.io");

const { Worker } =
  require("bullmq");

const connection =
  require("./config/redis");

const connectDB =
  require("./config/db");

const DYNAMIC_WORKER_QUEUE_THRESHOLD =
  Number(
    process.env.DYNAMIC_WORKER_QUEUE_THRESHOLD ||
    8
  );

const Task =
  require("./models/Task");

const taskQueue =
  require("./queues/taskQueue");

const queueEvents =
  require("./queues/queueEvents");

const {

  balanceWorkers,
  getDynamicMetrics,
  startDynamicWorkerManager,
  stopDynamicWorkerManager

} = require(
  "./utils/dynamicWorkerManager"
);

const {

  registerWorker,
  heartbeat,
  assignJob,
  jobCompleted,
  jobFailed,
  retryTracked,
  releaseOrphanedJob,
  getMetrics,
  unregisterWorker

} = require(
  "./scheduler/scheduler"
);
/* =========================
   TEMP STORAGE
========================= */

const TEMP_DIR =
  path.join(
    __dirname,
    "temp"
  );

const UPLOAD_DIR =
  path.join(
    TEMP_DIR,
    "uploads"
  );

const CHUNK_DIR =
  path.join(
    TEMP_DIR,
    "chunks"
  );

fs.mkdirSync(
  UPLOAD_DIR,
  {
    recursive: true
  }
);

fs.mkdirSync(
  CHUNK_DIR,
  {
    recursive: true
  }
);

/* =========================
   APP INIT
========================= */

const app =
  express();

const allowedOrigins =
  process.env.CLIENT_URL
    ? process.env.CLIENT_URL
        .split(",")
        .map((origin) =>
          origin.trim()
        )
    : ["http://localhost:5173"];

app.use(
  cors({
    origin:
      allowedOrigins,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],

    credentials:
      true
  })
);
app.use(express.json());

const server =
  http.createServer(app);

const io =
  new Server(server, {

    cors: {

      origin:
        allowedOrigins,

      methods: [
        "GET",
        "POST"
      ],

      credentials:
        true
    }
  });

global.io = io;


/* =========================
   GLOBAL STATE
========================= */
const activeWorkers =
  new Map();

const orchestrationLogs =
  [];
const completedGroups =
  new Set();

let totalCompletedJobs = 0;

let metricsInterval = null;

let isShuttingDown = false;

let dynamicScalingInterval = null;

/* =========================
   LOGGING
========================= */

function pushLog(

  type,
  message,
  metadata = {}

){

  const log = {

    id:
      Date.now() +
      Math.random(),

    type,

    message,

    metadata,

    timestamp:
      new Date()
  };

  orchestrationLogs.push(
    log
  );

  if(
    orchestrationLogs.length > 300
  ){

    orchestrationLogs.shift();
  }

  io.emit(
    "orchestration-log",
    log
  );
}
/* =========================
   TEMP FILE CLEANUP
========================= */

async function cleanupWorkloadFiles(
  tasks
){

  const filePaths =
    new Set();

  for(
    const task of tasks
  ){

    if(
      task.data?.chunkPath
    ){

      filePaths.add(
        task.data.chunkPath
      );
    }

    if(
      task.data?.filePath
    ){

      filePaths.add(
        task.data.filePath
      );
    }

    if(
      task.data?.originalFilePath
    ){

      filePaths.add(
        task.data.originalFilePath
      );
    }
  }

  for(
    const filePath of filePaths
  ){

    try{

      await fs.promises.unlink(
        filePath
      );

    }catch(err){

      if(
        err.code !==
        "ENOENT"
      ){

        console.error(
          `❌ File cleanup failed: ${filePath} | ${err.message}`
        );
      }
    }
  }
}
/* =========================
   SOCKET CONNECTION
========================= */

io.on(

  "connection",

  (socket) => {

    console.log(
      `Client Connected: ${socket.id}`
    );

    /* =========================
       REGISTER WORKER
    ========================= */

    socket.on(

      "register-worker",

      async (
        workerId,
        type
      ) => {

        if(
          activeWorkers.has(workerId)
        ){

          return;
        }

        activeWorkers.set(

          workerId,

          {

            socketId:
              socket.id,

            type
          }
        );

        await registerWorker(

          workerId,

          socket.id,

          type
        );

        pushLog(

          "WORKER_REGISTERED",

          `Worker ${workerId} registered`,

          {
            workerId,
            type
          }
        );
      }
    );

    /* =========================
       HEARTBEAT
    ========================= */

    socket.on(

      "heartbeat",

      (workerId) => {

        heartbeat(
          workerId
        );
      }
    );

    /* =========================
       WORKER HEALTH
    ========================= */
socket.on(

  "health-update",

  (data) => {

    const worker =
      activeWorkers.get(
        data.workerId
      );
if(worker){

  worker.cpu =
    data.cpu;

  worker.ram =
    data.ram;

  worker.status =
    data.status;

  worker.avgLatency =
    data.avgLatency;

  worker.activeJobs =
    data.activeJobs;

  worker.completedJobs =
    data.completedJobs;

  worker.failedJobs =
    data.failedJobs;

worker.lastHeartbeat =
  data.lastHeartbeat;
}

    io.emit(
      "worker-load-update",
      data
    );
  }
);
    /* =========================
       TASK UPDATE
    ========================= */

   socket.on(

  "task-update",

  async (data) => {

    try{

      const task =
        await Task.findOne({

            jobId:
              data.jobId
          });

        if(!task){
        return;
}

        /* =========================
           PROCESSING
        ========================= */

        if(
          data.status ===
          "processing"
        ){

          task.status =
            "processing";

          task.startedAt =
            new Date();

          await task.save();

          io.emit(
            "task-update",
            data
          );

          return;
        }

        /* =========================
           COMPLETED
        ========================= */

        if(
          data.status ===
          "completed"
        ){

          await Task
            .findOneAndUpdate(

              {
                jobId:
                  data.jobId
              },

              {

                status:
                  "completed",

                completedAt:
                  new Date(),

                responseTime:
                  data.responseTime,

                result:
                  data.result
              }
            );

          await jobCompleted(

            data.workerId,

            data.responseTime,

            data.jobId,

            task.data.taskType
          );

          io.emit(

            "task-completed",

            {

              jobId:
                data.jobId,

              workerId:
                data.workerId
            }
          );

     
          /* =========================
             GROUP PROGRESS
          ========================= */

          if(task.groupId){

            const chunks =
              await Task.find({

                groupId:
                  task.groupId
              });

            const completed =
              chunks.filter(

                (c) =>
                  c.status ===
                  "completed"

              ).length;

            const total =
              chunks.length;

            const percent =
              Math.floor(

                (
                  completed /
                  total
                ) * 100
              );

            io.emit(

              "progress",

              {

                groupId:
                  task.groupId,

                completed,

                total,

                percent
              }
            );
if(

  completed === total &&

  total > 0

){

   if(
  completedGroups.has(
    task.groupId
  )
){

  console.log(

    `⚠ Duplicate completion ignored for ${task.groupId}`
  );

}else{

  completedGroups.add(
    task.groupId
  );

  pushLog(

    "WORKLOAD_COMPLETED",

    `${task.data.taskType.toUpperCase()} workload completed`,

    {

      groupId:
        task.groupId
    }
  );
  
const failedChunks =
  chunks.filter(
    c => c.status === "failed"
  ).length;

const final = `

WORKLOAD EXECUTION SUMMARY

File:
${
  chunks[0]?.data?.fileName ||

  task.data.fileName ||

  "Unknown"
}

Workload Type:
${task.data.taskType.toUpperCase()}

Total Chunks:
${total}

Completed Chunks:
${completed}

Failed Chunks:
${failedChunks}

Processing Mode:
Distributed

Final Status:
${
  failedChunks === 0
    ? "SUCCESS"
    : "PARTIAL SUCCESS"
}

Completed At:
${new Date().toLocaleTimeString()}

`;

              io.emit(

                "final-result",

                {

                  groupId:
                    task.groupId,

                  result:
                    final
                }
              );
              await cleanupWorkloadFiles(
  chunks
);

await Task.deleteMany({

  groupId:
    task.groupId
});

totalCompletedJobs++;

console.log(
  `🧹 Cleaned chunks for ${task.groupId}`
);

setTimeout(

  () => {

    completedGroups.delete(
      task.groupId
    );

  },

  30000
);
}
            }
          }

          return;
        }
/* =========================
   FAILED
========================= */
if(
  data.status ===
  "failed"
){

  const failureReason =
    data.error ||
    "Unknown Error";

  if(
    task.retryCount <
    task.maxRetries
  ){

    await jobFailed(

      data.workerId,

      data.jobId,

      false
    );

    task.retryCount += 1;

    task.status =
      "pending";

    task.assigned =
      false;

    task.assignedWorker =
      null;

    task.failureReason =
      failureReason;

    await task.save();

    retryTracked();

    pushLog(

      "RETRY_SCHEDULED",

      `Retry ${task.retryCount}/${task.maxRetries} for ${task.jobId}`,

      {

        jobId:
          task.jobId,

        workerId:
          data.workerId,

        retryCount:
          task.retryCount,

        maxRetries:
          task.maxRetries,

        failureReason
      }
    );

    io.emit(

      "task-retry",

      {

        jobId:
          task.jobId,

        groupId:
          task.groupId,

        workerId:
          data.workerId,

        retryCount:
          task.retryCount,

        maxRetries:
          task.maxRetries,

        failureReason
      }
    );

    await taskQueue.add(

      "distributed-task",

      {

       job: {

  id:
    task.jobId,

  name:
    task.name,

  data: {

    ...task.data,

    retryCount:
      task.retryCount
  }
},
        priority:
          task.priority,

        type:
          task.type
      },

      {

        attempts: 1,

        removeOnComplete: 50,

        removeOnFail: 20
      }
    );

    return;
  }

  await jobFailed(

    data.workerId,

    data.jobId,

    true
  );

  task.status =
    "failed";

  task.assigned =
    false;

  task.failureReason =
    failureReason;

  await task.save();

  pushLog(

    "TASK_FAILED",

    `Task ${data.jobId} permanently failed`,

    {

      jobId:
        data.jobId,

      groupId:
        task.groupId,

      workerId:
        data.workerId,

      failureReason
    }
  );

  io.emit(

    "task-failed",

    {

      jobId:
        data.jobId,

      groupId:
        task.groupId,

      workerId:
        data.workerId,

      permanent:
        true,

      failureReason
    }
  );

  if(task.groupId){

    const groupTasks =
      await Task.find({

        groupId:
          task.groupId
      });

    const completed =
      groupTasks.filter(

        (groupTask) =>
          groupTask.status ===
          "completed"

      ).length;

    const failed =
      groupTasks.filter(

        (groupTask) =>
          groupTask.status ===
          "failed"

      ).length;

    const total =
      groupTasks.length;

    const finished =
      completed +
      failed;

    const percent =
      Math.floor(

        (
          finished /
          total
        ) * 100
      );

    io.emit(

      "progress",

      {

        groupId:
          task.groupId,

        completed,

        failed,

        total,

        percent
      }
    );

    if(

      finished === total &&

      total > 0 &&

      !completedGroups.has(
        task.groupId
      )

    ){

      completedGroups.add(
        task.groupId
      );

      const finalStatus =

        completed === 0

          ? "FAILED"

          : "PARTIAL SUCCESS";

      pushLog(

        "WORKLOAD_FINISHED",

        `${task.data.taskType.toUpperCase()} workload finished with ${finalStatus}`,

        {

          groupId:
            task.groupId,

          completed,

          failed,

          total
        }
      );

      const final = `

WORKLOAD EXECUTION SUMMARY

File:
${
  groupTasks[0]?.data?.fileName ||
  task.data.fileName ||
  "Unknown"
}

Workload Type:
${task.data.taskType.toUpperCase()}

Total Chunks:
${total}

Completed Chunks:
${completed}

Failed Chunks:
${failed}

Processing Mode:
Distributed

Final Status:
${finalStatus}

Completed At:
${new Date().toLocaleTimeString()}

`;

      io.emit(

        "final-result",

        {

          groupId:
            task.groupId,

          status:
            finalStatus,

          result:
            final
        }
      );

     await cleanupWorkloadFiles(
  groupTasks
);

await Task.deleteMany({

  groupId:
    task.groupId
});

totalCompletedJobs++;

      setTimeout(

        () => {

          completedGroups.delete(
            task.groupId
          );

        },

        30000
      );
    }
  }

  return;
}

        } // end try

        catch(err){

          console.error(
            `❌ Task update error: ${err.message}`
          );

          pushLog(

            "TASK_UPDATE_ERROR",

            `Task update failed: ${err.message}`,

            {
              jobId:
                data?.jobId || null
            }
          );
        }

      }
    );
    /* =========================
   DISCONNECT
========================= */

socket.on(

  "disconnect",

  async () => {

    for(
      let [
        workerId,
        worker
      ] of activeWorkers.entries()
    ){

      if(
        worker.socketId ===
        socket.id
      ){

        activeWorkers.delete(
          workerId
        );

        pushLog(

          "WORKER_DISCONNECTED",

          `Worker ${workerId} disconnected`,

          {
            workerId
          }
        );

        try{

          /*
            Find tasks that were being processed
            by the disconnected worker.
          */

          const staleTasks =
            await Task.find({

              assignedWorker:
                workerId,

              status:
                "processing"
            });

          for(
            const task of staleTasks
          ){

            /*
              Release scheduler assignment lock
              before putting the task back
              into BullMQ.
            */

            await releaseOrphanedJob(

              workerId,

              task.jobId
            );

            const nextRetryCount =

              (task.retryCount || 0) + 1;

            /*
              Stop retrying when the task
              has exhausted max retries.
            */

            if(
              nextRetryCount >
              task.maxRetries
            ){

              task.status =
                "failed";

              task.assigned =
                false;

              task.assignedWorker =
                null;

              task.retryCount =
                nextRetryCount;

              task.failureReason =
                "Worker disconnected — max retries exceeded";

              await task.save();

              pushLog(

                "TASK_FAILED",

                `Task ${task.jobId} failed after worker disconnect`,

                {
                  jobId:
                    task.jobId,

                  workerId,

                  retryCount:
                    nextRetryCount
                }
              );

              io.emit(

                "task-update",

                {
                  jobId:
                    task.jobId,

                  status:
                    "failed",

                  error:
                    task.failureReason
                }
              );

              continue;
            }

            /*
              Reset orphaned task so another
              healthy worker can process it.
            */

            task.status =
              "pending";

            task.assigned =
              false;

            task.assignedWorker =
              null;

            task.retryCount =
              nextRetryCount;

            task.failureReason =
              "Worker disconnected — task scheduled for recovery";

            await task.save();

            retryTracked();

            pushLog(

              "TASK_RECOVERY_SCHEDULED",

              `Recovering task ${task.jobId} after worker ${workerId} disconnected`,

              {
                jobId:
                  task.jobId,

                workerId,

                retryCount:
                  nextRetryCount,

                maxRetries:
                  task.maxRetries
              }
            );

            io.emit(

              "task-update",

              {
                jobId:
                  task.jobId,

                status:
                  "pending",

                retryCount:
                  nextRetryCount
              }
            );

            /*
              Re-enter the existing BullMQ
              scheduling pipeline.
            */

            await taskQueue.add(

              "distributed-task",

              {
                job: {

                  id:
                    task.jobId,

                  name:
                    task.name,

                  data: {

                    ...task.data,

                    retryCount:
                      nextRetryCount
                  }
                },

                priority:
                  task.priority,

                type:
                  task.type
              },

              {
                attempts: 1,

                removeOnComplete:
                  50,

                removeOnFail:
                  20
              }
            );
          }

          /*
            Remove disconnected worker only
            after orphaned task locks have
            been released.
          */

          await unregisterWorker(
            workerId
          );

        }catch(err){

          console.error(

            `❌ Worker disconnect recovery error: ${err.message}`
          );

          pushLog(

            "TASK_RECOVERY_ERROR",

            `Failed to recover tasks from worker ${workerId}`,

            {
              workerId,

              error:
                err.message
            }
          );

          /*
            Worker must still be removed
            even if task recovery fails.
          */

          await unregisterWorker(
            workerId
          );
        }

        break;
      }
    }
  }
);
  }
);
/* =========================
   FILE TYPE DETECTOR
========================= */

function detectTaskType(
  file
){

  const mime =
    file.mimetype;

  if(
    mime.startsWith("image/")
  ){

    return "image";
  }

  if(
    mime.startsWith("audio/")
  ){

    return "audio";
  }

  if(
    mime.startsWith("video/")
  ){

    return "video";
  }
if(

  mime ===
    "text/plain" ||

  mime.includes(
    "json"
  )

){

  return "text";
}
  if(

    mime === "application/pdf"

  ){

    return "pdf";
  }

return "generic";
}

/* =========================
   SPLIT FILE INTO DISK CHUNKS
========================= */
async function splitFileIntoChunks(

  file,
  groupId,
  parts = 4

){

  const fileSize =
    file.size;

  const chunkSize =
    Math.ceil(
      fileSize /
      parts
    );

  const chunks = [];

  for(

    let i = 0;

    i < parts;

    i++

  ){

    const start =
      i *
      chunkSize;

    if(
      start >=
      fileSize
    ){

      break;
    }

    const end =
      Math.min(

        start +
        chunkSize -
        1,

        fileSize -
        1
      );

    const chunkPath =
      path.join(

        CHUNK_DIR,

        `${groupId}-chunk-${i}`
      );

    await new Promise(

      (
        resolve,
        reject
      ) => {

        const readStream =
          fs.createReadStream(

            file.path,

            {
              start,
              end
            }
          );

        const writeStream =
          fs.createWriteStream(
            chunkPath
          );

        readStream.on(
          "error",
          reject
        );

        writeStream.on(
          "error",
          reject
        );

        writeStream.on(
          "finish",
          resolve
        );

        readStream.pipe(
          writeStream
        );
      }
    );

    chunks.push({

      chunkIndex:
        i,

      chunkPath,

      chunkSize:
        end -
        start +
        1
    });
  }

  return chunks;
}
/* =========================
   TASK GENERATOR
========================= */
async function generateTasks(

  file,
  groupId,
  userPriority = null

){
  const taskType =
    detectTaskType(
      file
    );

  const tasks = [];

  /*
    Small image and PDF workloads
    remain single-task workloads.

    Large/text/audio/video workloads
    are split into real disk chunks.
  */

  let totalChunks = 1;

  if(
    taskType === "video"
  ){

    totalChunks = 4;
  }

  else if(
    taskType === "audio"
  ){

    totalChunks = 3;
  }

  else if(
    taskType === "text"
  ){

    totalChunks = 5;
  }

  else if(
    file.size >
    50 *
    1024 *
    1024
  ){

    totalChunks = 4;
  }

  if(
    totalChunks === 1
  ){

    tasks.push({

      id:
        `${groupId}-${taskType}`,

      name:
        `${taskType}-processing`,

      type:

        taskType === "audio" ||
        taskType === "video"

          ? "io"
          : "cpu",

      priority:
        userPriority ||

        (
          taskType === "video"

            ? "critical"

            : "high"
        ),

      taskType,

      data: {

        taskType,

        fileName:
          file.originalname,

        filePath:
          file.path,

        size:
          file.size,

        chunkIndex:
          0,

        totalChunks:
          1
      }
    });

    return {

      taskType,

      tasks
    };
  }

  const chunks =
  await splitFileIntoChunks(

    file,
    groupId,
    totalChunks
  );

  for(
    const chunk of chunks
  ){

    tasks.push({

      id:
        `${groupId}-${taskType}-${chunk.chunkIndex}`,

      name:
        `${taskType}-processing`,

      type:

        taskType === "audio" ||
        taskType === "video"

          ? "io"
          : "cpu",

      priority:
        userPriority ||

        (
          taskType === "video"

            ? "critical"

            : "high"
        ),

      taskType,

      data: {

        taskType,

        fileName:
          file.originalname,

        originalFilePath:
          file.path,

        chunkPath:
          chunk.chunkPath,

        chunkIndex:
          chunk.chunkIndex,

        totalChunks:
          chunks.length,

        chunkSize:
          chunk.chunkSize,

        size:
          file.size
      }
    });
  }

  return {

    taskType,

    tasks
  };
}


/* =========================
   MULTER
========================= */
const allowedMimeTypes =
  new Set([

    "text/plain",
    "application/json",
    "application/pdf",

    "image/jpeg",
    "image/png",
    "image/webp",

    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",

    "video/mp4",
    "video/webm",
    "video/quicktime"
  ]);
const diskStorage =
  multer.diskStorage({

    destination: (

      req,
      file,
      cb

    ) => {

      cb(
        null,
        UPLOAD_DIR
      );
    },

    filename: (

      req,
      file,
      cb

    ) => {

      const uniqueName =
        `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;

      cb(
        null,
        uniqueName
      );
    }
  });

const upload =
  multer({

    storage:
      diskStorage,

    limits: {

      fileSize:
        1024 *
        1024 *
        500
    },
    fileFilter: (

      req,
      file,
      cb

    ) => {

      if(
        allowedMimeTypes.has(
          file.mimetype
        )
      ){

        return cb(
          null,
          true
        );
      }

      cb(

        new Error(
          `Unsupported file type: ${file.mimetype}`
        )
      );
    }
  });

/* =========================
   HEALTH CHECK API
========================= */

app.get(

  "/health",

  (req, res) => {

    res.status(200).json({

      status:
        "ok",

      service:
        "Intelligent Task Scheduler",

      uptime:
        process.uptime(),

      timestamp:
        new Date().toISOString(),

      environment:
        process.env.NODE_ENV ||
        "development"
    });
  }
);

/* =========================
   LOGS API
========================= */

app.get(

  "/logs",

  (req, res) => {

    res.json(
      orchestrationLogs
    );
  }
);

/* =========================
   METRICS API
========================= */

app.get(

  "/metrics",

  async (req, res) => {

    const processing =
      await Task.countDocuments({

        status:
          "processing"
      });

    const pending =
      await Task.countDocuments({

        status:
          "pending"
      });

  

   
  const schedulerMetrics =
  getMetrics();

res.json({

  ...schedulerMetrics,

  ...getDynamicMetrics(),

  activeWorkers:
    activeWorkers.size,

  processingQueue:
    processing,

  pendingQueue:
    pending,

  failedJobs:
    schedulerMetrics.failedJobs,

  completedJobs:
    totalCompletedJobs
});
  }
);

/* =========================
   FILE UPLOAD
========================= */

app.post(

  "/upload",

  upload.single("file"),

  async (req, res) => {

     let groupId = null;
    try{

      if(!req.file){

        return res
          .status(400)
          .json({

            error:
              "No file uploaded"
          });
      }

    groupId =
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;

      const {

        taskType,
        tasks

      } = await generateTasks(

  req.file,

  groupId,

  req.body.priority
);
if(
  tasks.length >=
  DYNAMIC_WORKER_QUEUE_THRESHOLD
){

  const workerType =
    tasks[0]?.type || "cpu";

  const spawnedPid =
    balanceWorkers(
      tasks.length,
      workerType
    );

  if(spawnedPid){

    pushLog(
      "DYNAMIC_WORKER_SPAWNED",
      `Dynamic ${workerType.toUpperCase()} worker spawned`,
      {
        pid: spawnedPid,
        queueSize: tasks.length,
        workerType
      }
    );
  }
}
      pushLog(

        "FILE_UPLOADED",

        `Detected ${taskType} workload`,

        {
          groupId,
          totalTasks:
            tasks.length
        }
      );

      for(
        const task of tasks
      ){

        await Task.create({

          jobId:
            task.id,

          groupId,

          name:
            task.name,

          type:
            task.type,

          priority:
            task.priority,

          taskType:
  task.taskType,

          data:
            task.data,

          status:
            "pending"
        });

        await taskQueue.add(

          "distributed-task",

          {

            job: {

              id:
                task.id,

              name:
                task.name,

 data: {

  ...task.data,

  retryCount:
    0
}
},
            priority:
              task.priority,

            type:
              task.type
          },

         {

  attempts: 1,

  removeOnComplete: 50,

  removeOnFail: 20
}
        );
      }

      res.json({

        success:
          true,

        groupId,

        taskType,

        totalTasks:
          tasks.length
      });

    }catch(err){

  console.error(
    `❌ Upload processing failed: ${err.message}`
  );

  /*
    Remove original uploaded file
    if upload processing fails.
  */

  if(
    req.file?.path
  ){

    try{

      await fs.promises.unlink(
        req.file.path
      );

    }catch(cleanupError){

      if(
        cleanupError.code !==
        "ENOENT"
      ){

        console.error(
          `❌ Upload cleanup failed: ${cleanupError.message}`
        );
      }
    }
  }

  /*
    Remove partially created chunks
    belonging to this workload.
  */

  if(
    typeof groupId !==
    "undefined"
  ){

    try{

      const chunkFiles =
        await fs.promises.readdir(
          CHUNK_DIR
        );

      const matchingChunks =
        chunkFiles.filter(

          (fileName) =>
            fileName.startsWith(
              `${groupId}-chunk-`
            )
        );

      await Promise.all(

        matchingChunks.map(

          (fileName) =>

            fs.promises.unlink(

              path.join(
                CHUNK_DIR,
                fileName
              )
            )
        )
      );

    }catch(cleanupError){

      console.error(
        `❌ Chunk cleanup failed: ${cleanupError.message}`
      );
    }
  }

  res
    .status(500)
    .json({

      error:

        process.env.NODE_ENV ===
        "production"

          ? "File processing failed"

          : err.message
    });
}
  }
);

/* =========================
   SCHEDULER WORKER
========================= */

const schedulerWorker =
  new Worker(

    "intelligent-task-queue",

    async (job) => {

      const jobData =
        job.data;

      const worker =
  await assignJob({

    ...jobData.job,

    priority:
      jobData.priority
  });

      if(!worker){

        throw new Error(
          "No worker available"
        );
      }

      io.to(
        worker.socketId
      ).emit(

        "task",

        jobData.job
      );

      io.emit(

        "task-assigned",

        {

          jobId:
            jobData.job.id,

          workerId:
            worker.id
        }
      );

    
    },

    {
      connection
    }
  );
async function emitMetrics(){

  const schedulerMetrics =
    getMetrics();

  const [
    pendingQueue,
    processingQueue
  ] = await Promise.all([

    Task.countDocuments({
      status: "pending"
    }),

    Task.countDocuments({
      status: "processing"
    })
  ]);

  io.emit(

    "metrics-update",


{

  ...schedulerMetrics,

  ...getDynamicMetrics(),

  activeWorkers:
    activeWorkers.size,

  pendingQueue,

  processingQueue,

  failedJobs:
    schedulerMetrics.failedJobs,

  completedJobs:
    totalCompletedJobs
}
  );
}metricsInterval =
  setInterval(

    () => {

      emitMetrics()
        .catch(console.error);

    },

    1000
  );

/* =========================
   DYNAMIC WORKER SCALING
========================= */

dynamicScalingInterval =
  setInterval(

    async () => {

      try{

        const waiting =
          await taskQueue.getWaitingCount();

        const delayed =
          await taskQueue.getDelayedCount();

        const queueSize =
          waiting +
          delayed;

        if(
  queueSize <
  DYNAMIC_WORKER_QUEUE_THRESHOLD
){
  return;
}

        const pendingTasks =
          await Task.find({

            status:
              "pending"

          })
          .select("type")
          .limit(20)
          .lean();

        const cpuTasks =
          pendingTasks.filter(

            (task) =>
              task.type === "cpu"

          ).length;

        const ioTasks =
          pendingTasks.filter(

            (task) =>
              task.type === "io"

          ).length;

        const workerType =
          ioTasks > cpuTasks
            ? "io"
            : "cpu";

        const spawnedPid =
          balanceWorkers(

            queueSize,
            workerType
          );

        if(spawnedPid){

          pushLog(

            "DYNAMIC_WORKER_SPAWNED",

            `Dynamic ${workerType.toUpperCase()} worker spawned`,

            {

              pid:
                spawnedPid,

              queueSize,

              workerType
            }
          );

          await emitMetrics();
        }

      }catch(err){

        console.error(
          `❌ Dynamic Scaling Error: ${err.message}`
        );
      }

    },

    5000
  );
/* =========================
   QUEUE EVENTS
========================= */

queueEvents.on(

  "waiting",

async ({ jobId }) => {
await emitMetrics();
    io.emit(

      "queue-event",

      {

        type:
          "waiting",

        jobId
      }
    );
  }
);

queueEvents.on(

  "active",

async ({ jobId }) => {
await emitMetrics();
    io.emit(

      "queue-event",

      {

        type:
          "active",

        jobId
      }
    );
  }
);

queueEvents.on(

  "completed",

async ({ jobId }) => {
await emitMetrics();
    io.emit(

      "queue-event",

      {

        type:
          "completed",

        jobId
      }
    );
  }
);

queueEvents.on(

  "failed",

async ({ jobId }) => {
await emitMetrics();
    io.emit(

      "queue-event",

      {

        type:
          "failed",

        jobId
      }
    );
  }
);

/* =========================
   404 HANDLER
========================= */

app.use(

  (req, res) => {

    res.status(404).json({

      error:
        "Route not found"
    });
  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(

  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      err.message
    );

    if(
      err instanceof
      multer.MulterError
    ){

      if(
        err.code ===
        "LIMIT_FILE_SIZE"
      ){

        return res
          .status(413)
          .json({

            error:
              "Uploaded file exceeds the maximum allowed size"
          });
      }

      return res
        .status(400)
        .json({

          error:
            err.message
        });
    }

    if(
      err.message &&
      err.message.startsWith(
        "Unsupported file type:"
      )
    ){

      return res
        .status(415)
        .json({

          error:
            err.message
        });
    }
/*
  Remove partially created
  MongoDB task records
*/


    res
      .status(500)
      .json({

        error:
          process.env.NODE_ENV ===
          "production"

            ? "Internal server error"

            : err.message
      });
  }
);

/* =========================
   START SERVER
========================= */
const PORT =
  Number(
    process.env.PORT ||
    5000
  );

/* =========================
   START APPLICATION
========================= */

async function startServer(){

  try{

    await connectDB();

    startDynamicWorkerManager();

    server.listen(

      PORT,

      () => {

        console.log(
          `🚀 Intelligent Task Scheduler running on port ${PORT}`
        );
      }
    );

  }catch(err){

    console.error(
      `❌ Server startup failed: ${err.message}`
    );

    process.exit(1);
  }
}

startServer();

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
    `\n🛑 ${signal} received. Shutting down safely...`
  );

if(metricsInterval){

  clearInterval(
    metricsInterval
  );
}

if(dynamicScalingInterval){

  clearInterval(
    dynamicScalingInterval
  );
}

  try{

  await stopDynamicWorkerManager();

  await schedulerWorker.close();

  await queueEvents.close();

  await taskQueue.close();

    io.close();

    server.close(

      async () => {

        try{

          if(
            connection.status !==
            "end"
          ){

            await connection.quit();
          }

        }catch(err){

          console.error(
            `❌ Redis shutdown error: ${err.message}`
          );
        }

        console.log(
          "✅ Server shutdown completed"
        );

        process.exit(0);
      }
    );

    setTimeout(

      () => {

        console.error(
          "⚠ Forced shutdown after timeout"
        );

        process.exit(1);
      },

      10000
    ).unref();

  }catch(err){

    console.error(
      `❌ Shutdown error: ${err.message}`
    );

    process.exit(1);
  }
}

process.on(
  "SIGINT",
  () =>
    gracefulShutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () =>
    gracefulShutdown("SIGTERM")
);