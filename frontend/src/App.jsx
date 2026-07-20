import React, {
  useContext
} from "react";

import "./App.css";

import {
  OrchestrationContext
} from "./context/OrchestrationContext";

import Layout from "./components/Layout";

import MetricsCards from "./components/MetricsCards";

import TaskPipeline from "./components/TaskPipeline";

import WorkerPanel from "./components/WorkerPanel";

import TelemetryPanel from "./components/TelemetryPanel";

import Upload from "./components/Upload";

import ClusterActivity from "./components/ClusterActivity";

import QueueOverview from "./components/QueueOverview";

import ResourceMonitor from "./components/ResourceMonitor";

import ExecutionSummary
from "./components/ExecutionSummary";

function App(){

  const {
    socketConnected
  } = useContext(
    OrchestrationContext
  );

  return (

    <Layout>

      {/* =========================
          HEADER
      ========================= */}

      <div className="dashboard-header">

        <div>

          <h1>
            Intelligent Task Scheduling System
          </h1>

          <p>
            Realtime Monitoring • Queue Orchestration • Worker Telemetry • Fault Recovery
          </p>

        </div>

        <div
          className={
            socketConnected
              ? "system-badge"
              : "system-badge system-offline"
          }
        >

          {
            socketConnected
              ? "● System Connected"
              : "● System Offline"
          }

        </div>

      </div>

      {/* =========================
          METRICS
      ========================= */}

      <MetricsCards />

      {/* =========================
          PIPELINE
      ========================= */}

      <TaskPipeline />

      {/* =========================
          UPLOAD
      ========================= */}

      <Upload />

      {/* =========================
          CLUSTER ACTIVITY
      ========================= */}

      <ClusterActivity />

      {/* =========================
          WORKERS
      ========================= */}

      <WorkerPanel />

      {/* =========================
          ANALYTICS
      ========================= */}

      <div className="analytics-grid">

        <QueueOverview />

        <ResourceMonitor />

      </div>

      {/* =========================
          ORCHESTRATION TIMELINE
      ========================= */}

      <div className="bottom-grid">

        <TelemetryPanel />

        <ExecutionSummary />

      </div>

    </Layout>
  );
}

export default App;