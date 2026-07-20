import React, {
  useContext
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

const TaskPipeline = () => {

  const {

    metrics,

    activeTasks,

    pipelineStage,

    executionStatus

  } = useContext(
    OrchestrationContext
  );

  /* =========================
     PIPELINE STAGES
  ========================= */

  const stageOrder = [

    "IDLE",

    "UPLOAD",

    "QUEUE",

    "SCHEDULING",

    "PROCESSING",

    "RESULT",

    "COMPLETED"

  ];

  const currentStage =

    pipelineStage ||

    "IDLE";

  const currentStageIndex =

    stageOrder.indexOf(
      currentStage
    );

  const stages =

    stageOrder.map(
      (
        label,
        index
      ) => ({

        label,

        active:

          currentStageIndex >= 0 &&

          index <=
          currentStageIndex

      })
    );

  /* =========================
     EXECUTION STATUS
  ========================= */

  const status =

    (
      executionStatus ||
      "IDLE"
    )
      .toString()
      .toUpperCase();

  const getStatusText =
    () => {

      if(
        status ===
        "RETRYING"
      ){

        return "Retry mechanism active";
      }

      if(
        status ===
        "FAILED"
      ){

        return "Task failure detected";
      }

      if(
        status ===
        "PARTIAL_SUCCESS"
      ){

        return "Completed with partial failures";
      }

      if(
        status ===
        "COMPLETED" ||
        status ===
        "SUCCESS"
      ){

        return "Workload completed";
      }

      if(
        status ===
        "PROCESSING"
      ){

        return "Distributed processing active";
      }

      if(
        status ===
        "QUEUED"
      ){

        return "Tasks waiting for scheduling";
      }

      if(
        status ===
        "UPLOADING"
      ){

        return "Preparing workload";
      }

      return "Waiting for workload";
    };

  /* =========================
     RETRY INFORMATION
  ========================= */

  const retryingTask =

    activeTasks.find(
      (task) =>

        task.status ===
        "RETRYING"
    );

  /* =========================
     RENDER
  ========================= */

  return (

    <div className="panel">

      <div className="panel-header">

        <h2>
          Task Processing Pipeline
        </h2>

      </div>

      {/* =========================
          PIPELINE
      ========================= */}

      <div className="pipeline-container">

        {
          stages.map(
            (
              stage,
              index
            ) => (

              <React.Fragment
                key={
                  stage.label
                }
              >

                <div

                  className={`pipeline-stage ${
                    stage.active

                      ? "pipeline-active"

                      : "pipeline-idle"
                  }`}
                >

                  <div className="pipeline-circle">

                    {index + 1}

                  </div>

                  <span>

                    {stage.label}

                  </span>

                </div>

                {
                  index !==
                  stages.length - 1 && (

                    <div

                      className={`pipeline-line ${
                        stage.active

                          ? "pipeline-line-active"

                          : ""
                      }`}
                    />

                  )
                }

              </React.Fragment>

            )
          )
        }

      </div>

      {/* =========================
          CURRENT STATE
      ========================= */}

      <div className="pipeline-current-stage">

        Current Stage:{" "}

        <strong>

          {currentStage}

        </strong>

        {" • "}

        <span>

          {getStatusText()}

        </span>

        {
          retryingTask && (

            <span>

              {" • "}

              Retry{" "}

              {
                retryingTask.retryCount ||
                1
              }

              /

              {
                retryingTask.maxRetries ||
                3
              }

            </span>

          )
        }

      </div>

      {/* =========================
          LIVE STATS
      ========================= */}

      <div className="pipeline-stats">

        <div className="pipeline-stat-card">

          <span>
            ACTIVE TASKS
          </span>

          <strong>

            {
              activeTasks.length
            }

          </strong>

        </div>

        <div className="pipeline-stat-card">

          <span>
            QUEUED
          </span>

          <strong>

            {
              metrics.pendingQueue ||
              0
            }

          </strong>

        </div>

        <div className="pipeline-stat-card">

          <span>
            ACTIVE PROCESSING
          </span>

          <strong>

            {
              metrics.processingQueue ||
              0
            }

          </strong>

        </div>

        <div className="pipeline-stat-card">

          <span>
            COMPLETED
          </span>

          <strong>

            {
              metrics.completedJobs ||
              0
            }

          </strong>

        </div>

      </div>

    </div>
  );
};

export default TaskPipeline;