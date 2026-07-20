import React, {
  useContext
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

const WorkerPanel = () => {

  const {
    workers
  } = useContext(
    OrchestrationContext
  );

  /* =========================
     WORKER STATE
  ========================= */

  function getWorkerState(
    worker
  ){

    const status =
      (
        worker.status ||
        "healthy"
      ).toLowerCase();

    switch(
      status
    ){

      case "overloaded":

        return {
          label:
            "OVERLOADED",

          className:
            "status-overloaded"
        };

      case "degraded":

        return {
          label:
            "DEGRADED",

          className:
            "status-degraded"
        };

      case "recovering":

        return {
          label:
            "RECOVERING",

          className:
            "status-recovering"
        };

      case "offline":

        return {
          label:
            "OFFLINE",

          className:
            "status-offline"
        };

      default:

        return {
          label:
            "HEALTHY",

          className:
            "status-healthy"
        };
    }
  }

  /* =========================
     HEARTBEAT FORMAT
  ========================= */

  function getHeartbeat(
    lastHeartbeat
  ){

    if(
      !lastHeartbeat
    ){

      return "--";
    }

    const timestamp =
      new Date(
        lastHeartbeat
      ).getTime();

    if(
      Number.isNaN(
        timestamp
      )
    ){

      return "--";
    }

    const seconds =
      Math.max(

        0,

        Math.floor(

          (
            Date.now() -
            timestamp
          ) / 1000
        )
      );

    return `${seconds}s ago`;
  }

  /* =========================
     RENDER
  ========================= */

  return (

    <div className="panel">

      <div className="panel-header">

        <h2>
          Distributed Worker Pool
        </h2>

      </div>

      <div className="workers-grid">

        {
          workers.length ===
          0 ? (

            <div className="empty-workers">

              <p>
                No active workers available
              </p>

              <span>
                Waiting for worker registration...
              </span>

            </div>

          ) : (

            workers.map(
              (
                worker
              ) => {

                const state =
                  getWorkerState(
                    worker
                  );

                const workerType =
                  (
                    worker.workerType ||
                    "cpu"
                  ).toLowerCase();

                return (

                  <div

                    className={`worker-card ${
                      workerType ===
                      "io"

                        ? "io-worker"

                        : "cpu-worker"
                    }`}

                    key={
                      worker.workerId
                    }
                  >

                    {/* =========================
                        HEADER
                    ========================= */}

                    <div className="worker-header">

                      <div>

                        <h3>

                          {
                            workerType
                              .toUpperCase()
                          }_WORKER

                        </h3>

                        <p className="worker-id">

                          ID:{" "}

                          {
                            worker.workerId
                              ?.slice(
                                0,
                                8
                              ) ||
                            "UNKNOWN"
                          }

                        </p>

                      </div>

                      <span

                        className={`worker-status ${state.className}`}
                      >

                        {state.label}

                      </span>

                    </div>

                    {/* =========================
                        WORKER METRICS
                    ========================= */}

                    <div className="worker-metrics">

                      <div className="worker-metric">

                        <span>
                          CPU
                        </span>

                        <strong>

                          {
                            worker.cpu ||
                            0
                          }%

                        </strong>

                      </div>

                      <div className="worker-metric">

                        <span>
                          RAM
                        </span>

                        <strong>

                          {
                            worker.ram ||
                            0
                          }%

                        </strong>

                      </div>

                      <div className="worker-metric">

                        <span>
                          ACTIVE JOBS
                        </span>

                        <strong>

                          {
                            worker.activeJobs ||
                            0
                          }

                        </strong>

                      </div>

                      <div className="worker-metric">

                        <span>
                          COMPLETED
                        </span>

                        <strong>

                          {
                            worker.completedJobs ||
                            0
                          }

                        </strong>

                      </div>

                      <div className="worker-metric">

                        <span>
                          FAILED ATTEMPTS
                        </span>

                        <strong>

                          {
                            worker.failedJobs ||
                            0
                          }

                        </strong>

                      </div>

                      <div className="worker-metric">

                        <span>
                          LATENCY
                        </span>

                        <strong>

                          {
                            Math.round(
                              worker.avgLatency ||
                              0
                            )
                          }ms

                        </strong>

                      </div>

                      <div className="worker-metric">

                        <span>
                          HEALTH
                        </span>

                        <strong>

                          {
                            (
                              worker.status ||
                              "healthy"
                            )
                              .toUpperCase()
                          }

                        </strong>

                      </div>

                      <div className="worker-metric">

                        <span>
                          HEARTBEAT
                        </span>

                        <strong>

                          {
                            getHeartbeat(
                              worker.lastHeartbeat
                            )
                          }

                        </strong>

                      </div>

                    </div>

                    {/* =========================
                        CPU UTILIZATION BAR
                    ========================= */}

                    <div className="health-bar">

                      <div

                        className="health-fill"

                        style={{

                          width:
                            `${Math.min(
                              100,
                              Math.max(
                                0,
                                worker.cpu ||
                                0
                              )
                            )}%`

                        }}
                      />

                    </div>

                  </div>
                );
              }
            )
          )
        }

      </div>

    </div>
  );
};

export default WorkerPanel;