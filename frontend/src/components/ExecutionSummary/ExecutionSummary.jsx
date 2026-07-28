import React, { useContext } from "react";
import { OrchestrationContext } from "../../context/OrchestrationContext";

const ExecutionSummary = () => {
  const { finalResult, metrics, executionStatus, executionSummary } =
    useContext(OrchestrationContext);

  const completed = metrics.completedJobs ?? 0;
  const failed = metrics.failedJobs ?? 0;
  const active = metrics.processingQueue ?? 0;
  const totalTasks =
    completed + failed + (metrics.pendingQueue ?? 0) + active;

  const status = (executionStatus || "IDLE")
    .toString()
    .toUpperCase();

  const getStatusLabel = () => {
    if (status === "FAILED") return "FAILED";
    if (status === "PARTIAL_SUCCESS" || status === "PARTIAL")
      return "PARTIAL SUCCESS";
    if (status === "RETRYING") return "RETRYING";
    if (status === "PROCESSING") return "PROCESSING";
    if (status === "QUEUED") return "QUEUED";
    if (status === "COMPLETED" || status === "SUCCESS")
      return "SUCCESS";

    return status;
  };

  const getStatusClass = () => {
    if (status === "FAILED") return "summary-failed";
    if (status === "PARTIAL_SUCCESS" || status === "PARTIAL")
      return "summary-partial";
    if (status === "RETRYING") return "summary-retrying";
    if (status === "PROCESSING") return "summary-processing";
    if (status === "QUEUED") return "summary-queued";

    return "summary-success";
  };

  const getWaitingMessage = () => {
    if (status === "RETRYING")
      return "Retrying failed task...";

    if (status === "PROCESSING")
      return "Workload processing in progress...";

    if (status === "QUEUED")
      return "Workload waiting in queue...";

    if (status === "UPLOADING")
      return "Workload upload in progress...";

    return "Waiting for workload completion...";
  };

  // Convert backend UTC timestamp to Indian Standard Time
  const formatISTTime = (timestamp) => {
    if (!timestamp) return "—";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return `${date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })} IST`;
  };

  const formatExecutionSummary = () => {
    if (!executionSummary) {
      return finalResult || null;
    }

    const lines = [
      "WORKLOAD EXECUTION SUMMARY",
      "",
      `File: ${executionSummary.fileName || "—"}`,
      `Workload Type: ${
        executionSummary.taskType?.toUpperCase() || "—"
      }`,
      `Priority: ${
        executionSummary.priority?.toUpperCase() || "—"
      }`,
      `Total Chunks: ${
        executionSummary.totalChunks ?? "—"
      }`,
      `Completed Chunks: ${
        executionSummary.completedChunks ?? "—"
      }`,
      `Failed Chunks: ${
        executionSummary.failedChunks ?? "—"
      }`,
      `Workers Used: ${
        executionSummary.workersUsedCount ?? "—"
      }`,
      `Execution Mode: ${
        executionSummary.executionMode || "—"
      }`,
      `Retries: ${
        executionSummary.retries ?? 0
      }`,
      `Final Status: ${getStatusLabel()}`,
      `Completed At: ${formatISTTime(
        executionSummary.completedAt
      )}`,
    ];

    return lines.join("\n");
  };

  const resultText = formatExecutionSummary();
  const hasResult = Boolean(resultText);

  return (
    <div className="panel execution-summary">
      <div className="panel-header">
        <h2>Workload Execution Summary</h2>
      </div>

      {!hasResult ? (
        <div className="empty-workers">
          {getWaitingMessage()}
        </div>
      ) : (
        <>
          <div
            className={`summary-status ${getStatusClass()}`}
          >
            {getStatusLabel()}
          </div>

          <div className="pipeline-stats">
            <div className="pipeline-stat-card">
              <span>COMPLETED</span>
              <strong>{completed}</strong>
            </div>

            <div className="pipeline-stat-card">
              <span>FAILED</span>
              <strong>{failed}</strong>
            </div>

            <div className="pipeline-stat-card">
              <span>ACTIVE</span>
              <strong>{active}</strong>
            </div>

            <div className="pipeline-stat-card">
              <span>PROGRESS TASKS</span>
              <strong>{totalTasks}</strong>
            </div>
          </div>

          <div className="summary-result-box">
            <pre className="summary-result-text">
              {resultText}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default ExecutionSummary;