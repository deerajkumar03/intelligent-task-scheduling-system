import React, { useContext, useEffect, useState } from "react";
import { OrchestrationContext } from "../../context/OrchestrationContext";
import { uploadWorkload } from "../../services/api";
import socket from "../../services/socket";

const Upload = () => {
  const { setPipelineStage, setFinalResult, setExecutionStatus } = useContext(
    OrchestrationContext
  );

  const [file, setFile] = useState(null);
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleFileClassified = (data) => {
      setPipelineStage("QUEUE");
      setExecutionStatus("QUEUED");
      setUploadState(
        `Detected ${(data?.taskType || "generic").toUpperCase()} workload • ${data?.totalTasks || 0} task(s)`
      );
      setProgress(10);
    };

    const handleTaskAssigned = () => {
      setUploadState("Tasks scheduled to distributed workers...");
      setProgress((prev) => Math.max(prev, 20));
    };

    const handleProgress = (data) => {
      setPipelineStage("PROCESSING");
      setExecutionStatus("PROCESSING");
      setUploadState("Distributed processing in progress...");
      setProgress((prev) => Math.max(prev, Math.min(95, data?.percent || 0)));
    };

    const handleTaskRetry = (data) => {
      setExecutionStatus("RETRYING");
      setUploadState(
        `Task retry ${data?.retryCount || 1}/${data?.maxRetries || 3} in progress...`
      );
    };

    const handleFinalResult = (data) => {
      setFinalResult(data?.result || "Processing completed.");
      setProgress(100);
      setLoading(false);
      setFile(null);

      const status = (data?.status || "completed").toString().toUpperCase();
      setExecutionStatus(status);

      if (status === "FAILED") {
        setUploadState("Workload processing failed.");
      } else if (status === "PARTIAL_SUCCESS") {
        setUploadState("Workload completed with partial failures.");
      } else {
        setUploadState("Workload processing completed successfully.");
      }

      setPipelineStage("COMPLETED");
    };

    socket.on("file-classified", handleFileClassified);
    socket.on("task-assigned", handleTaskAssigned);
    socket.on("progress", handleProgress);
    socket.on("task-retry", handleTaskRetry);
    socket.on("final-result", handleFinalResult);

    return () => {
      socket.off("file-classified", handleFileClassified);
      socket.off("task-assigned", handleTaskAssigned);
      socket.off("progress", handleProgress);
      socket.off("task-retry", handleTaskRetry);
      socket.off("final-result", handleFinalResult);
    };
  }, [setPipelineStage, setFinalResult, setExecutionStatus]);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadState(null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setProgress(0);
      setFinalResult(null);
      setExecutionStatus("UPLOADING");
      setUploadState("Uploading and preparing workload...");
      setPipelineStage("UPLOAD");

      const response = await uploadWorkload(file, priority);
      setUploadState(`Scheduling ${response?.totalTasks || 0} distributed task(s)`);
      setProgress((prev) => Math.max(prev, 10));
    } catch (err) {
      console.error("Upload Error:", err);
      const message =
        err?.response?.data?.error || err.message || "Unknown upload error";

      setUploadState(`Upload failed: ${message}`);
      setExecutionStatus("FAILED");
      setPipelineStage("IDLE");
      setLoading(false);
    }
  };

  return (
    <div className="panel upload-panel">
      <div className="panel-header">
        <h2>Upload Workload</h2>
      </div>

      <div className="upload-box">
        <label className="upload-dropzone">
          <div className="upload-icon">⬆</div>
          <h3>{file ? file.name : "Select Workload File"}</h3>
          <p>
            {file
              ? "File selected and ready for processing"
              : "PDF • Image • Audio • Video • TXT"}
          </p>
          <input
            type="file"
            hidden
            disabled={loading}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </label>

        {file && (
          <div className="upload-file-info">
            <p>📄 {file.name}</p>
            <p>
              📦 Size:{" "}
              {file.size >= 1024 * 1024
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : `${(file.size / 1024).toFixed(2)} KB`}
            </p>
          </div>
        )}

        <div className="upload-control-label">Task Priority</div>

        <div className="priority-grid">
          <div
            className={`priority-card ${
              priority === "low" ? "priority-low active-priority" : ""
            }`}
            onClick={() => !loading && setPriority("low")}
          >
            🟢 LOW
          </div>
          <div
            className={`priority-card ${
              priority === "normal" ? "priority-normal active-priority" : ""
            }`}
            onClick={() => !loading && setPriority("normal")}
          >
            🔵 NORMAL
          </div>
          <div
            className={`priority-card ${
              priority === "high" ? "priority-high active-priority" : ""
            }`}
            onClick={() => !loading && setPriority("high")}
          >
            🟡 HIGH
          </div>
          <div
            className={`priority-card ${
              priority === "critical" ? "priority-critical active-priority" : ""
            }`}
            onClick={() => !loading && setPriority("critical")}
          >
            🔴 CRITICAL
          </div>
        </div>

        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? "Distributed Processing..." : "Start Distributed Processing"}
        </button>

        {uploadState && <div className="upload-status">{uploadState}</div>}

        {loading && (
          <div className="upload-progress-wrapper">
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
