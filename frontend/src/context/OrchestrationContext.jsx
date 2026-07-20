import React, {
  createContext,
  useEffect,
  useState
} from "react";

import socket from "../services/socket";

import {
  getMetrics,
  getLogs
} from "../services/api";

export const OrchestrationContext =
  createContext();

export const OrchestrationProvider = ({
  children
}) => {

  /* =========================
     GLOBAL STATE
  ========================= */

  const [workers, setWorkers] =
    useState([]);

  const [metrics, setMetrics] =
    useState({});

  const [logs, setLogs] =
    useState([]);

  const [
    metricsHistory,
    setMetricsHistory
  ] = useState([]);

  const [
    activeTasks,
    setActiveTasks
  ] = useState([]);

  const [
    pipelineStage,
    setPipelineStage
  ] = useState("IDLE");

  const [
    socketConnected,
    setSocketConnected
  ] = useState(
    socket.connected
  );

  const [
    finalResult,
    setFinalResult
  ] = useState(null);

  const [
    executionStatus,
    setExecutionStatus
  ] = useState("IDLE");

  /* =========================
     FETCH INITIAL METRICS
  ========================= */

  async function fetchInitialMetrics(){

    try{

      const data =
        await getMetrics();

      setMetrics(
        data || {}
      );

    }catch(err){

      console.error(
        "Metrics fetch failed:",
        err.message
      );
    }
  }

  /* =========================
     FETCH INITIAL LOGS
  ========================= */

  async function fetchInitialLogs(){

    try{

      const data =
        await getLogs();

      setLogs(

        (data || [])
          .slice(-50)
          .reverse()
          .map(
            (log) => ({

              time:
                log.timestamp

                  ? new Date(
                      log.timestamp
                    )
                      .toLocaleTimeString()

                  : new Date()
                      .toLocaleTimeString(),

              type:
                log.type ||
                "INFO",

              message:
                log.message ||
                ""

            })
          )
      );

    }catch(err){

      console.error(
        "Logs fetch failed:",
        err.message
      );
    }
  }

  /* =========================
     LOG HANDLER
  ========================= */

  function pushLog(
    log
  ){

    setLogs(
      (prev) => [

        {

          time:
            log.timestamp

              ? new Date(
                  log.timestamp
                )
                  .toLocaleTimeString()

              : new Date()
                  .toLocaleTimeString(),

          type:
            log.type ||
            "INFO",

          message:
            log.message ||
            ""

        },

        ...prev.slice(
          0,
          48
        )
      ]
    );
  }

  /* =========================
     SOCKET EVENTS
  ========================= */

  useEffect(
    () => {

      fetchInitialMetrics();

      fetchInitialLogs();

      /* =========================
         CONNECTION
      ========================= */

      const handleConnect =
        () => {

          setSocketConnected(
            true
          );

          pushLog({

            type:
              "SOCKET",

            message:
              "Socket connected"

          });
        };

      const handleDisconnect =
        () => {

          setSocketConnected(
            false
          );

          pushLog({

            type:
              "SOCKET",

            message:
              "Socket disconnected"

          });
        };

      /* =========================
         WORKER UPDATE
      ========================= */

      const handleWorkerUpdate =
        (data) => {

          if(
            !data?.workerId
          ){
            return;
          }

          setWorkers(
            (prev) => {

              const index =
                prev.findIndex(
                  (worker) =>

                    worker.workerId ===
                    data.workerId
                );

              if(
                index !== -1
              ){

                const updated =
                  [...prev];

                updated[index] = {

                  ...updated[index],

                  ...data

                };

                return updated;
              }

              return [

                ...prev,

                data

              ];
            }
          );
        };

      /* =========================
         METRICS UPDATE
      ========================= */

      const handleMetricsUpdate =
        (data) => {

          if(
            !data
          ){
            return;
          }

          setMetrics(
            data
          );

          setMetricsHistory(
            (prev) => [

              ...prev.slice(
                -99
              ),

              {

                time:
                  new Date()
                    .toLocaleTimeString(),

                pending:
                  data.pendingQueue ||
                  0,

                processing:
                  data.processingQueue ||
                  0,

                throughput:
                  data.throughput ||
                  0,

                workers:
                  data.activeWorkers ||
                  0

              }
            ]
          );
        };

      /* =========================
         FILE CLASSIFIED
      ========================= */

      const handleFileClassified =
        () => {

          setPipelineStage(
            "QUEUE"
          );

          setExecutionStatus(
            "QUEUED"
          );
        };

      /* =========================
         TASK ASSIGNED
      ========================= */

      const handleTaskAssigned =
        (data) => {

          if(
            !data?.jobId
          ){
            return;
          }

          setPipelineStage(
            "SCHEDULING"
          );

          setExecutionStatus(
            "PROCESSING"
          );

          setActiveTasks(
            (prev) => {

              const exists =
                prev.some(
                  (task) =>

                    task.jobId ===
                    data.jobId
                );

              if(
                exists
              ){

                return prev.map(
                  (task) =>

                    task.jobId ===
                    data.jobId

                      ? {

                          ...task,

                          workerId:
                            data.workerId ||
                            task.workerId,

                          status:
                            "ACTIVE"

                        }

                      : task
                );
              }

              return [

                {

                  jobId:
                    data.jobId,

                  workerId:
                    data.workerId,

                  taskType:
                    data.taskType ||
                    "UNKNOWN",

                  priority:
                    data.priority ||
                    "NORMAL",

                  progress:
                    0,

                  status:
                    "ACTIVE",

                  retryCount:
                    0

                },

                ...prev.slice(
                  0,
                  13
                )
              ];
            }
          );
        };

      /* =========================
         TASK PROGRESS
      ========================= */

      const handleProgress =
        (data) => {

          if(
            !data?.jobId
          ){
            return;
          }

          setPipelineStage(
            "PROCESSING"
          );

          setExecutionStatus(
            "PROCESSING"
          );

          setActiveTasks(
            (prev) =>

              prev.map(
                (task) =>

                  task.jobId ===
                  data.jobId

                    ? {

                        ...task,

                        progress:
                          Math.max(

                            task.progress ||
                            0,

                            data.percent ||
                            0
                          ),

                        status:
                          "PROCESSING"

                      }

                    : task
              )
          );
        };

      /* =========================
         TASK RETRY
      ========================= */

      const handleTaskRetry =
        (data) => {

          if(
            !data?.jobId
          ){
            return;
          }

          setPipelineStage(
            "QUEUE"
          );

          setExecutionStatus(
            "RETRYING"
          );

          setActiveTasks(
            (prev) =>

              prev.map(
                (task) =>

                  task.jobId ===
                  data.jobId

                    ? {

                        ...task,

                        status:
                          "RETRYING",

                        retryCount:
                          data.retryCount ||
                          (
                            (
                              task.retryCount ||
                              0
                            ) + 1
                          ),

                        maxRetries:
                          data.maxRetries ||
                          3

                      }

                    : task
              )
          );
        };

      /* =========================
         TASK COMPLETED
      ========================= */

      const handleTaskCompleted =
        (data) => {

          if(
            !data?.jobId
          ){
            return;
          }

          setActiveTasks(
            (prev) =>

              prev.map(
                (task) =>

                  task.jobId ===
                  data.jobId

                    ? {

                        ...task,

                        progress:
                          100,

                        status:
                          "COMPLETED"

                      }

                    : task
              )
          );

          setTimeout(
            () => {

              setActiveTasks(
                (prev) => {

                  const remaining =
                    prev.filter(
                      (task) =>

                        task.jobId !==
                        data.jobId
                    );

                 if(
  remaining.length ===
  0
){

  setPipelineStage(
    (currentStage) =>

      currentStage ===
      "COMPLETED"

        ? "COMPLETED"

        : "RESULT"
  );
}

                  return remaining;
                }
              );

            },

            3000
          );
        };

      /* =========================
         TASK FAILED
      ========================= */

      const handleTaskFailed =
        (data) => {

          if(
            !data?.jobId
          ){
            return;
          }

          /*
            Do not immediately set
            pipeline to IDLE.

            Backend may retry the task.
          */

          setExecutionStatus(
            "FAILED"
          );

          setActiveTasks(
            (prev) =>

              prev.map(
                (task) =>

                  task.jobId ===
                  data.jobId

                    ? {

                        ...task,

                        status:
                          "FAILED",

                        error:
                          data.error ||
                          "Task failed"

                      }

                    : task
              )
          );
        };

      /* =========================
         FINAL RESULT
      ========================= */

      const handleFinalResult =
        (data) => {

          setFinalResult(

            data?.result ||

            "Processing completed."
          );

          /*
            Backend may provide
            status in final-result.

            Fallback is COMPLETED.
          */

          const status =
            data?.status ||
            "COMPLETED";

          setExecutionStatus(
            status
              .toString()
              .toUpperCase()
          );

          setPipelineStage(
            "COMPLETED"
          );

          setActiveTasks(
            []
          );
        };

      /* =========================
         CENTRALIZED LOGS
      ========================= */

      const handleLog =
        (log) => {

          pushLog(
            log
          );
        };

      /* =========================
         REGISTER EVENTS
      ========================= */

      socket.on(
        "connect",
        handleConnect
      );

      socket.on(
        "disconnect",
        handleDisconnect
      );

      socket.on(
        "worker-load-update",
        handleWorkerUpdate
      );

      socket.on(
        "metrics-update",
        handleMetricsUpdate
      );

      socket.on(
        "file-classified",
        handleFileClassified
      );

      socket.on(
        "task-assigned",
        handleTaskAssigned
      );

      socket.on(
        "progress",
        handleProgress
      );

      socket.on(
        "task-retry",
        handleTaskRetry
      );

      socket.on(
        "task-completed",
        handleTaskCompleted
      );

      socket.on(
        "task-failed",
        handleTaskFailed
      );

      socket.on(
        "final-result",
        handleFinalResult
      );

      socket.on(
        "orchestration-log",
        handleLog
      );

      /*
        Socket may already be connected
        before this effect registers.
      */

      if(
        socket.connected
      ){

        setSocketConnected(
          true
        );
      }

      /* =========================
         CLEANUP
      ========================= */

      return () => {

        socket.off(
          "connect",
          handleConnect
        );

        socket.off(
          "disconnect",
          handleDisconnect
        );

        socket.off(
          "worker-load-update",
          handleWorkerUpdate
        );

        socket.off(
          "metrics-update",
          handleMetricsUpdate
        );

        socket.off(
          "file-classified",
          handleFileClassified
        );

        socket.off(
          "task-assigned",
          handleTaskAssigned
        );

        socket.off(
          "progress",
          handleProgress
        );

        socket.off(
          "task-retry",
          handleTaskRetry
        );

        socket.off(
          "task-completed",
          handleTaskCompleted
        );

        socket.off(
          "task-failed",
          handleTaskFailed
        );

        socket.off(
          "final-result",
          handleFinalResult
        );

        socket.off(
          "orchestration-log",
          handleLog
        );
      };

    },

    []
  );

  /* =========================
     CONTEXT PROVIDER
  ========================= */

  return (

    <OrchestrationContext.Provider

      value={{

        workers,

        metrics,

        logs,

        metricsHistory,

        activeTasks,

        pipelineStage,

        setPipelineStage,

        socketConnected,

        finalResult,

        setFinalResult,

        executionStatus,

        setExecutionStatus

      }}
    >

      {children}

    </OrchestrationContext.Provider>
  );
};