import React, { useContext } from "react";
import "./App.css";

import { OrchestrationContext } from "./context/OrchestrationContext";

import Layout from "./components/Layout/Layout";
import MetricsCards from "./components/MetricsCards/MetricsCards";
import Upload from "./components/Upload/Upload";
import TaskPipeline from "./components/TaskPipeline/TaskPipeline";
import SchedulingDecision from "./components/SchedulingDecision/SchedulingDecision";
import ClusterActivity from "./components/ClusterActivity/ClusterActivity";
import WorkerPanel from "./components/WorkerPanel/WorkerPanel";
import ResourceMonitor from "./components/ResourceMonitor/ResourceMonitor";
import QueueOverview from "./components/QueueOverview/QueueOverview";
import ExecutionSummary from "./components/ExecutionSummary/ExecutionSummary";
import TelemetryPanel from "./components/TelemetryPanel/TelemetryPanel";

function App() {
  const { socketConnected } = useContext(OrchestrationContext);

  return (
    <Layout>
      <div className="dashboard-header">
        <div>
          <h1>Intelligent Task Scheduling System</h1>
          <p>
            Realtime Monitoring • Queue Orchestration • Worker Telemetry • Fault
            Recovery
          </p>
        </div>

        <div
          className={
            socketConnected ? "system-badge" : "system-badge system-offline"
          }
        >
          {socketConnected ? "● System Connected" : "● System Offline"}
        </div>
      </div>

      <MetricsCards />

      <Upload />

      <TaskPipeline />

      <SchedulingDecision />

      <ClusterActivity />

      <WorkerPanel />

      <div className="analytics-grid">
        <QueueOverview />
        <ResourceMonitor />
      </div>

      <div className="bottom-grid">
        <TelemetryPanel />
        <ExecutionSummary />
      </div>
    </Layout>
  );
}

export default App;
