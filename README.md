# Intelligent Task Scheduling System with Real-Time Monitoring

A distributed task orchestration system designed to schedule heterogeneous workloads across specialized workers while providing real-time visibility into task execution, worker health, queue activity, resource utilization, and scheduling decisions.

The system uses a metric-based scheduling strategy to select suitable workers based on specialization, current load, health status, execution latency, and task priority. It also supports chunk-based parallel processing, failure recovery, retry mechanisms, and dynamic worker scaling.

---

## Overview

Modern task-processing systems often need to handle workloads with different computational and I/O characteristics. Assigning every task to workers without considering their specialization or runtime condition can lead to inefficient resource utilization and poor execution performance.

The **Intelligent Task Scheduling System with Real-Time Monitoring** addresses this problem through a distributed orchestration architecture that:

- Classifies incoming workloads.
- Routes tasks to specialized CPU or I/O workers.
- Considers worker load, health, and latency during scheduling.
- Splits suitable workloads into chunks for parallel execution.
- Handles worker execution failures through retries and reassignment.
- Dynamically adds worker capacity when required.
- Provides real-time monitoring through an interactive dashboard.

The system currently supports workloads including **PDF, image, audio, and video files**.

---

## Key Features

### Intelligent Metric-Based Scheduling

The scheduler evaluates available workers before assigning a task.

Worker selection considers:

- Worker specialization
- Current worker load
- Worker health status
- Average execution latency
- Task priority
- Runtime performance information

Scheduling decisions are exposed through telemetry, making worker selection observable through the monitoring dashboard.

### Specialized Worker Pool

The system separates workers based on workload characteristics.

| Worker Type | Typical Workloads |
| --- | --- |
| CPU Worker | PDF, Image, Compute-oriented tasks |
| I/O Worker | Audio, Video, File-intensive tasks |

This allows workloads to be routed to workers better suited to their processing requirements.

### Chunk-Based Parallel Processing

Large workloads can be divided into smaller chunks and scheduled independently.

Multiple chunks can be distributed across available workers, allowing parallel processing and improved workload distribution.

After all required chunks are processed, the system completes the parent task and cleans temporary chunk data.

### Priority-Aware Scheduling

Tasks can be submitted with different priority levels:

- Low
- Normal
- High
- Critical

Priority information is incorporated into the scheduling process and influences task execution decisions.

### Fault Handling and Retry Mechanism

The system includes fault-handling logic for worker execution failures.

When an execution attempt fails:

1. The failure is detected.
2. The failed attempt is recorded.
3. The task can be reassigned to another suitable worker.
4. Execution is retried according to the configured retry policy.
5. The task is marked as permanently failed if the retry limit is exhausted.

This provides resilience against temporary worker failures.

### Dynamic Worker Scaling

The system includes a dynamic worker management mechanism for handling increased workload demand.

When configured workload conditions are reached, additional workers can be spawned dynamically. These workers connect to the system, register with the scheduler, and become available for task execution.

When a dynamically created worker remains idle beyond the configured timeout, it is automatically terminated.

This demonstrates workload-driven worker scaling within the orchestration system.

### Distributed Queue Management

The project uses **Redis** and **BullMQ** for asynchronous task queue management.

The queue infrastructure supports:

- Task queuing
- Asynchronous processing
- Worker execution
- Queue event monitoring
- Failure handling
- Retry workflows

### Real-Time Monitoring and Telemetry

The system uses **Socket.IO** to provide real-time communication between the backend and monitoring dashboard.

The dashboard provides visibility into:

- Task execution progress
- Worker activity
- Worker health
- Worker load
- CPU utilization
- Memory utilization
- Queue activity
- Scheduling decisions
- Task completion
- Failures and retries
- Cluster activity
- Runtime telemetry

---

## System Architecture

```text
+---------------------------+
|      React Frontend       |
|   Monitoring Dashboard    |
+-------------+-------------+
              |
        HTTP / Socket.IO
              |
              v
+---------------------------+
|    Node.js / Express      |
|      Backend Server       |
+-------------+-------------+
              |
     +--------+--------+
     |                 |
     v                 v
+------------+   +-------------+
| Scheduler  |   |  Telemetry  |
+-----+------+   +-------------+
      |
      v
+---------------------------+
|      Redis / BullMQ       |
|        Task Queue         |
+-------------+-------------+
              |
       +------+------+
       |             |
       v             v
+-------------+ +-------------+
| CPU Workers | | I/O Workers |
| PDF / Image | |Audio / Video|
+------+------+ +------+------+
       |               |
       +-------+-------+
               |
               v
+---------------------------+
| Task Completion / Result  |
| Handling and Aggregation  |
+-------------+-------------+
              |
              v
+---------------------------+
|          MongoDB          |
|    Tasks and Metrics      |
+---------------------------+
```

---

## Task Execution Workflow

```text
User Upload
    |
    v
File Validation
    |
    v
Workload Classification
    |
    v
Task Creation
    |
    v
Chunking (when required)
    |
    v
Priority Assignment
    |
    v
Intelligent Scheduler
    |
    v
Worker Selection
    |
    v
Redis / BullMQ Queue
    |
    v
Distributed Worker Execution
    |
    +---- Failure ----> Retry / Reassignment
    |
    v
Task / Chunk Completion
    |
    v
Result Handling
    |
    v
Temporary File Cleanup
    |
    v
Real-Time Dashboard Update
```

---

## Monitoring Dashboard

The React-based monitoring dashboard provides a centralized view of the orchestration system.

### Metrics Cards

Displays high-level runtime and workload statistics.

### Task Pipeline

Visualizes the progress of workloads through different processing stages.

### Worker Panel

Displays information about registered workers, including:

- Worker ID
- Worker type
- Health status
- Current load
- CPU utilization
- Memory utilization
- Jobs processed
- Average latency
- Failure information
- Heartbeat status

### Queue Overview

Provides visibility into current queue activity and workload state.

### Cluster Activity

Displays cluster-level processing activity and workload trends.

### Resource Monitor

Shows resource utilization information reported by active workers.

### Telemetry Panel

Displays real-time scheduling and orchestration events generated by the backend.

### Execution Summary

Provides execution-related metrics and task processing statistics.

---

## Technology Stack

### Backend

| Technology | Purpose |
| --- | --- |
| Node.js | Backend runtime |
| Express.js | HTTP server and API layer |
| MongoDB | Task and metrics persistence |
| Mongoose | MongoDB object modeling |
| Redis | Queue infrastructure |
| BullMQ | Distributed task queue management |
| Socket.IO | Real-time communication |
| Multer | File upload handling |
| PM2 | Worker process management |

### Frontend

| Technology | Purpose |
| --- | --- |
| React | Monitoring dashboard |
| Axios | HTTP communication |
| Socket.IO Client | Real-time backend events |
| Recharts | Data visualization |
| Framer Motion | UI animations |
| Lucide React | Interface icons |

---

## Project Structure

```text
intelligent_task_scheduler/
|
|-- backend/
|   |
|   |-- config/
|   |   |-- db.js
|   |   `-- redis.js
|   |
|   |-- models/
|   |   |-- Task.js
|   |   `-- WorkerMetrics.js
|   |
|   |-- queues/
|   |   |-- queueEvents.js
|   |   `-- taskQueue.js
|   |
|   |-- scheduler/
|   |   `-- scheduler.js
|   |
|   |-- utils/
|   |   |-- dynamicWorkerManager.js
|   |   `-- eventLogger.js
|   |
|   |-- workers/
|   |   `-- worker.js
|   |
|   |-- server.js
|   |-- resetSystem.js
|   |-- ecosystem.config.js
|   |-- .env.example
|   `-- package.json
|
|-- frontend/
|   |
|   |-- public/
|   |
|   |-- src/
|   |   |
|   |   |-- components/
|   |   |   |-- ClusterActivity.jsx
|   |   |   |-- ExecutionSummary.jsx
|   |   |   |-- Layout.jsx
|   |   |   |-- MetricsCards.jsx
|   |   |   |-- QueueOverview.jsx
|   |   |   |-- ResourceMonitor.jsx
|   |   |   |-- TaskPipeline.jsx
|   |   |   |-- TelemetryPanel.jsx
|   |   |   |-- Upload.jsx
|   |   |   `-- WorkerPanel.jsx
|   |   |
|   |   |-- context/
|   |   |   `-- OrchestrationContext.jsx
|   |   |
|   |   |-- services/
|   |   |   |-- api.js
|   |   |   `-- socket.js
|   |   |
|   |   |-- App.jsx
|   |   |-- App.css
|   |   `-- index.js
|   |
|   `-- package.json
|
|-- .gitignore
`-- README.md
```

---

## Prerequisites

Ensure the following software is installed before running the project:

- Node.js
- npm
- MongoDB
- Redis
- PM2

Install PM2 globally if required:

```bash
npm install -g pm2
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/deerajkumar03/intelligent-task-scheduling-system.git
```

Navigate to the project directory:

```bash
cd intelligent-task-scheduling-system
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example` as the reference and configure the required environment variables.

Start the backend server:

```bash
node server.js
```

### 3. Start Worker Processes

From the backend directory, start the configured worker processes using PM2:

```bash
pm2 start ecosystem.config.js
```

Check worker status:

```bash
pm2 list
```

View worker logs:

```bash
pm2 logs
```

### 4. Start the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the React application:

```bash
npm start
```

The frontend will connect to the backend and display real-time orchestration activity.

---

## Environment Configuration

The repository contains an example environment configuration file:

```text
backend/.env.example
```

Create the local environment file:

```text
backend/.env
```

Configure the required values based on `.env.example`.

> Do not commit `.env` files, credentials, connection strings, or other sensitive configuration values to the repository.

---

## Running the Complete System

A typical local startup sequence is:

1. Start MongoDB.
2. Start Redis.
3. Start the backend server.
4. Start worker processes using PM2.
5. Start the React frontend.
6. Upload a supported workload.
7. Observe scheduling and execution through the monitoring dashboard.

---

## Testing and Validation

The system has been tested with multiple workload types, including:

- PDF files
- Image files
- Video files

The following functionality has been validated during development:

- Workload classification
- CPU and I/O worker routing
- Specialized worker selection
- Load-aware scheduling
- Priority-aware scheduling
- Multi-chunk video processing
- Parallel chunk distribution
- Task completion
- Worker failure detection
- Retry and task reassignment
- Dynamic worker spawning
- Dynamic worker idle termination
- Queue event monitoring
- Real-time telemetry
- Worker resource monitoring
- Temporary chunk cleanup

---

## Example Scheduling Decision

The scheduler generates observable decision information similar to the following:

```text
Worker Type: I/O
Task Type: Video
Current Load: 0
Average Latency: 0.00
Priority Boost: 4

Selected Because:
- Specialized Worker
- Low Load
- Healthy Worker
```

This information is exposed through telemetry to provide visibility into why a particular worker was selected.

---

## Dynamic Worker Lifecycle

```text
Workload Demand Increases
          |
          v
Scaling Condition Detected
          |
          v
Dynamic Worker Spawned
          |
          v
Worker Connects and Registers
          |
          v
Worker Processes Tasks
          |
          v
Worker Becomes Idle
          |
          v
Idle Timeout Reached
          |
          v
Dynamic Worker Terminated
```

---

## Future Enhancements

Potential future improvements include:

- Docker-based containerization
- Kubernetes-based worker orchestration and auto-scaling
- Deployment across multiple physical or cloud machines
- Advanced scheduling algorithms
- Workload prediction using machine learning
- Persistent task result management
- Authentication and authorization
- Role-based dashboard access
- Distributed tracing and enhanced observability
- Prometheus and Grafana integration
- Cloud deployment
- Performance benchmarking under concurrent workloads

---

## Project Scope

This project is an academic distributed task orchestration prototype developed to demonstrate the concepts of:

- Metric-based intelligent scheduling
- Distributed worker coordination
- Specialized workload processing
- Parallel task execution
- Dynamic worker management
- Fault handling and retry mechanisms
- Queue-based asynchronous processing
- Real-time monitoring and telemetry

The project focuses on demonstrating the architecture and behavior of an observable, workload-aware distributed task processing system.

---

## Author

**Deeraj Kumar**

Master of Computer Applications (MCA)  
Major Project

GitHub: `deerajkumar03`

---

## Repository

**Intelligent Task Scheduling System with Real-Time Monitoring**

Repository: `deerajkumar03/intelligent-task-scheduling-system`