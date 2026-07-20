import React, {
  useContext
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

const ExecutionSummary = () => {

  const {

    finalResult,

    metrics,

    executionStatus

  } = useContext(
    OrchestrationContext
  );

  /* =========================
     EXECUTION COUNTS
  ========================= */

  const completed =
    metrics.completedJobs ||
    0;

  const failed =
    metrics.failedJobs ||
    0;

  const retries =
    metrics.retries ||
    0;

  const totalTasks =
    completed +
    failed;

  /* =========================
     STATUS
  ========================= */

  const status =
    (
      executionStatus ||
      "IDLE"
    )
      .toString()
      .toUpperCase();

  const getStatusLabel =
    () => {

      if(
        status ===
        "FAILED"
      ){

        return "FAILED";
      }

      if(
        status ===
        "PARTIAL_SUCCESS" ||
        status ===
        "PARTIAL"
      ){

        return "PARTIAL SUCCESS";
      }

      if(
        status ===
        "RETRYING"
      ){

        return "RETRYING";
      }

      if(
        status ===
        "PROCESSING"
      ){

        return "PROCESSING";
      }

      if(
        status ===
        "QUEUED"
      ){

        return "QUEUED";
      }

      if(
        status ===
        "COMPLETED" ||
        status ===
        "SUCCESS"
      ){

        return "SUCCESS";
      }

      return status;
    };

  const getStatusClass =
    () => {

      if(
        status ===
        "FAILED"
      ){

        return "summary-failed";
      }

      if(
        status ===
        "PARTIAL_SUCCESS" ||
        status ===
        "PARTIAL"
      ){

        return "summary-partial";
      }

      if(
        status ===
        "RETRYING"
      ){

        return "summary-retrying";
      }

      return "summary-success";
    };

  /* =========================
     RENDER
  ========================= */

  return (

    <div className="panel execution-summary">

      <div className="panel-header">

        <h2>
          Workload Execution Summary
        </h2>

      </div>

      {
        !finalResult ? (

          <div className="empty-workers">

            {
              status ===
              "RETRYING"

                ? "Retrying failed task..."

                : status ===
                  "PROCESSING"

                  ? "Workload processing in progress..."

                  : status ===
                    "QUEUED"

                    ? "Workload waiting in queue..."

                    : "Waiting for workload completion..."
            }

          </div>

        ) : (

          <>

            {/* =========================
                STATUS
            ========================= */}

            <div

              className={`summary-status ${getStatusClass()}`}
            >

              {getStatusLabel()}

            </div>

            {/* =========================
                EXECUTION STATS
            ========================= */}

            <div className="pipeline-stats">

              <div className="pipeline-stat-card">

                <span>
                  COMPLETED
                </span>

                <strong>
                  {completed}
                </strong>

              </div>

              <div className="pipeline-stat-card">

                <span>
                  FAILURES
                </span>

                <strong>
                  {failed}
                </strong>

              </div>

              <div className="pipeline-stat-card">

                <span>
                  RETRIES
                </span>

                <strong>
                  {retries}
                </strong>

              </div>

              <div className="pipeline-stat-card">

                <span>
                  PROCESSED TASKS
                </span>

                <strong>
                  {totalTasks}
                </strong>

              </div>

            </div>

            {/* =========================
                RESULT
            ========================= */}

            <div className="summary-result-box">

              <pre className="summary-result-text">

                {finalResult}

              </pre>

            </div>

          </>

        )
      }

    </div>
  );
};

export default ExecutionSummary;