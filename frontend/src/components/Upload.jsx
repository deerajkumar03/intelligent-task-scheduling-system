import React, {
  useContext,
  useEffect,
  useState
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

import {
  uploadWorkload
} from "../services/api";

import socket from "../services/socket";

const Upload = () => {

  const {

    setPipelineStage,

    setFinalResult,

    setExecutionStatus

  } = useContext(
    OrchestrationContext
  );

  const [
    file,
    setFile
  ] = useState(null);

  const [
    priority,
    setPriority
  ] = useState("normal");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    uploadState,
    setUploadState
  ] = useState(null);

  const [
    progress,
    setProgress
  ] = useState(0);

  /* =========================
     SOCKET EVENTS
  ========================= */

  useEffect(
    () => {

      /* =========================
         FILE CLASSIFIED
      ========================= */

      const handleFileClassified =
        (data) => {

          setPipelineStage(
            "QUEUE"
          );

          setExecutionStatus(
            "QUEUED"
          );

          setUploadState(

            `Detected ${
              (
                data?.taskType ||
                "generic"
              ).toUpperCase()
            } workload • ${
              data?.totalTasks ||
              0
            } task(s)`
          );

          setProgress(
            10
          );
        };

      /* =========================
         TASK ASSIGNED
      ========================= */

      const handleTaskAssigned =
        () => {

          setUploadState(
            "Tasks scheduled to distributed workers..."
          );

          setProgress(
            (prev) =>
              Math.max(
                prev,
                20
              )
          );
        };

      /* =========================
         PROCESSING PROGRESS
      ========================= */

      const handleProgress =
        (data) => {

          setPipelineStage(
            "PROCESSING"
          );

          setExecutionStatus(
            "PROCESSING"
          );

          setUploadState(
            "Distributed processing in progress..."
          );

          setProgress(
            (prev) =>

              Math.max(

                prev,

                Math.min(
                  95,
                  data?.percent ||
                  0
                )
              )
          );
        };

      /* =========================
         RETRY
      ========================= */

      const handleTaskRetry =
        (data) => {

          setExecutionStatus(
            "RETRYING"
          );

          setUploadState(

            `Task retry ${
              data?.retryCount ||
              1
            }/${
              data?.maxRetries ||
              3
            } in progress...`
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

          setProgress(
            100
          );

          setLoading(
            false
          );

          setFile(
            null
          );

          const status =
            (
              data?.status ||
              "completed"
            )
              .toString()
              .toUpperCase();

          setExecutionStatus(
            status
          );

          if(
            status ===
            "FAILED"
          ){

            setUploadState(
              "Workload processing failed."
            );

          }else if(
            status ===
            "PARTIAL_SUCCESS"
          ){

            setUploadState(
              "Workload completed with partial failures."
            );

          }else{

            setUploadState(
              "Workload processing completed successfully."
            );
          }

          setPipelineStage(
            "COMPLETED"
          );
        };

      /* =========================
         REGISTER EVENTS
      ========================= */

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
        "final-result",
        handleFinalResult
      );

      /* =========================
         CLEANUP
      ========================= */

      return () => {

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
          "final-result",
          handleFinalResult
        );
      };

    },

    [
      setPipelineStage,
      setFinalResult,
      setExecutionStatus
    ]
  );

  /* =========================
     FILE SELECTION
  ========================= */

  const handleFileChange =
    (selectedFile) => {

      if(
        !selectedFile
      ){
        return;
      }

      setFile(
        selectedFile
      );

      setUploadState(
        null
      );

      setProgress(
        0
      );
    };

  /* =========================
     FILE UPLOAD
  ========================= */

  const handleUpload =
    async () => {

      if(
        !file
      ){

        alert(
          "Select a file first"
        );

        return;
      }

      try{

        setLoading(
          true
        );

        setProgress(
          0
        );

        setFinalResult(
          null
        );

        setExecutionStatus(
          "UPLOADING"
        );

        setUploadState(
          "Uploading and preparing workload..."
        );

        setPipelineStage(
          "UPLOAD"
        );

        /*
          REST request handles:
          file upload + task generation.

          Actual task processing continues
          through Socket.IO events.
        */

        const response =
          await uploadWorkload(
            file,
            priority
          );

        setUploadState(

          `Scheduling ${
            response?.totalTasks ||
            0
          } distributed task(s)`
        );

        setProgress(
          (prev) =>
            Math.max(
              prev,
              10
            )
        );

      }catch(err){

        console.error(
          "Upload Error:",
          err
        );

        const message =

          err?.response
            ?.data
            ?.error ||

          err.message ||

          "Unknown upload error";

        setUploadState(
          `Upload failed: ${message}`
        );

        setExecutionStatus(
          "FAILED"
        );

        setPipelineStage(
          "IDLE"
        );

        setLoading(
          false
        );
      }
    };

  /* =========================
     RENDER
  ========================= */

  return (

    <div className="panel upload-panel">

      <div className="panel-header">

        <h2>
          Upload Workload
        </h2>

      </div>

      <div className="upload-box">

        {/* =========================
            FILE INPUT
        ========================= */}

        <label className="upload-dropzone">

          <div className="upload-icon">
            ⬆
          </div>

          <h3>

            {
              file

                ? file.name

                : "Select Workload File"
            }

          </h3>

          <p>

            {
              file

                ? "File selected and ready for processing"

                : "PDF • Image • Audio • Video • TXT"
            }

          </p>

          <input

            type="file"

            hidden

            disabled={
              loading
            }

            onChange={
              (e) =>

                handleFileChange(
                  e.target
                    .files?.[0]
                )
            }

          />

        </label>

        {/* =========================
            FILE DETAILS
        ========================= */}

        {
          file && (

            <div className="upload-file-info">

              <p>

                📄 {file.name}

              </p>

              <p>

                📦 Size:{" "}

                {
                  file.size >=
                  1024 * 1024

                    ? `${(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(
                        2
                      )} MB`

                    : `${(
                        file.size /
                        1024
                      ).toFixed(
                        2
                      )} KB`
                }

              </p>

            </div>
          )
        }

        {/* =========================
            PRIORITY
        ========================= */}

        <div className="upload-control-label">

          Task Priority

        </div>

        <div className="priority-grid">

          <div

            className={`priority-card ${
              priority ===
              "low"

                ? "priority-low active-priority"

                : ""
            }`}

            onClick={
              () => {

                if(
                  !loading
                ){

                  setPriority(
                    "low"
                  );
                }
              }
            }
          >

            🟢 LOW

          </div>

          <div

            className={`priority-card ${
              priority ===
              "normal"

                ? "priority-normal active-priority"

                : ""
            }`}

            onClick={
              () => {

                if(
                  !loading
                ){

                  setPriority(
                    "normal"
                  );
                }
              }
            }
          >

            🔵 NORMAL

          </div>

          <div

            className={`priority-card ${
              priority ===
              "high"

                ? "priority-high active-priority"

                : ""
            }`}

            onClick={
              () => {

                if(
                  !loading
                ){

                  setPriority(
                    "high"
                  );
                }
              }
            }
          >

            🟡 HIGH

          </div>

          <div

            className={`priority-card ${
              priority ===
              "critical"

                ? "priority-critical active-priority"

                : ""
            }`}

            onClick={
              () => {

                if(
                  !loading
                ){

                  setPriority(
                    "critical"
                  );
                }
              }
            }
          >

            🔴 CRITICAL

          </div>

        </div>

        {/* =========================
            START BUTTON
        ========================= */}

        <button

          className="upload-btn"

          onClick={
            handleUpload
          }

          disabled={
            loading ||
            !file
          }
        >

          {
            loading

              ? "Distributed Processing..."

              : "Start Distributed Processing"
          }

        </button>

        {/* =========================
            STATUS
        ========================= */}

        {
          uploadState && (

            <div className="upload-status">

              {uploadState}

            </div>
          )
        }

        {/* =========================
            PROGRESS
        ========================= */}

        {
          loading && (

            <div className="upload-progress-wrapper">

              <div className="upload-progress-bar">

                <div

                  className="upload-progress-fill"

                  style={{
                    width:
                      `${progress}%`
                  }}

                />

              </div>

              <span>

                {progress}%

              </span>

            </div>
          )
        }

      </div>

    </div>
  );
};

export default Upload;