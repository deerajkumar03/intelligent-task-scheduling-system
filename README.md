# Intelligent Task Scheduling System with Real-Time Monitoring

A distributed task orchestration system designed to intelligently schedule heterogeneous workloads across specialized workers while providing real-time visibility into task execution, worker health, queue activity, resource utilization, and scheduling decisions.

The system uses a metric-based scheduling strategy to select suitable workers based on specialization, current load, health status, execution latency, and task priority. It also supports chunk-based parallel processing, failure recovery, retry mechanisms, dynamic worker scaling, and real-time telemetry.

---

## Overview

Modern task-processing systems often need to handle workloads with different computational and I/O characteristics. Assigning every task without considering worker specialization or runtime conditions can lead to inefficient resource utilization and poor workload distribution.

The **Intelligent Task Scheduling System with Real-Time Monitoring** addresses this problem through a distributed orchestration architecture that:

- Classifies incoming workloads.
- Routes tasks to specialized CPU or I/O workers.
- Considers worker load, health, and execution latency during scheduling.
- Supports priority-aware task scheduling.
- Splits suitable workloads into chunks for parallel execution.
- Handles worker execution failures through retries and reassignment.
- Dynamically adds worker capacity when configured workload conditions are reached.
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
| CPU Worker | PDF, Image, Compute-oriented workloads |
| I/O Worker | Audio, Video, File-intensive workloads |

The default PM2 configuration starts:

- 2 CPU workers
- 2 I/O workers

This allows workloads to be routed to workers that are better suited to their processing requirements.

### Chunk-Based Parallel Processing

Large workloads can be divided into smaller chunks and scheduled independently.

Multiple chunks can be distributed across available workers, enabling parallel processing and improved workload distribution.

After all required chunks are processed, the system completes the parent task and cleans temporary chunk data.

### Priority-Aware Scheduling

Tasks can be submitted with different priority levels:

- Low
- Normal
- High
- Critical

Priority information is incorporated into the scheduling process and influences task scheduling decisions.

### Fault Handling and Retry Mechanism

The system includes fault-handling logic for worker execution failures.

When an execution attempt fails:

1. The execution failure is detected.
2. The failed attempt is recorded.
3. The task can be reassigned to another suitable worker.
4. Execution is retried according to the configured retry policy.
5. The task is marked as permanently failed if the retry limit is exhausted.

This provides resilience against temporary worker execution failures.

### Dynamic Worker Scaling

The system includes a dynamic worker management mechanism for responding to increased workload demand.

When the configured queue threshold is reached, additional worker capacity can be created dynamically, subject to the configured scaling limits and cooldown period.

A dynamically created worker:

1. Is spawned by the dynamic worker manager.
2. Connects to the backend.
3. Registers with the scheduler.
4. Becomes available for task execution.
5. Processes assigned workloads.
6. Remains active while required.
7. Is terminated after exceeding the configured idle timeout.

The current development configuration uses:

```text
Dynamic Worker Queue Threshold: 8
Maximum Dynamic Workers: 4
Dynamic Worker Idle Timeout: 120000 ms
Dynamic Worker Spawn Cooldown: 10000 ms
```

This demonstrates workload-driven worker scaling within the orchestration system.

### Distributed Queue Management

The project uses **Redis** and **BullMQ** for asynchronous task queue management.

The queue infrastructure supports:

- Task queuing
- Asynchronous processing
- Distributed worker execution
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
- Execution failures
- Retry activity
- Cluster activity
- Runtime telemetry

---

## System Architecture

```text
+-----------------------------+
|       React Frontend        |
|    Monitoring Dashboard     |
|       Port: 3000            |
+--------------+--------------+
               |
         HTTP / Socket.IO
               |
               v
+-----------------------------+
|      Node.js / Express      |
|        Backend Server       |
|         Port: 5000          |
+--------------+--------------+
               |
       +-------+-------+
       |               |
       v               v
+-------------+   +-------------+
|  Scheduler  |   |  Telemetry  |
+------+------+   +-------------+
       |
       v
+-----------------------------+
|        Redis / BullMQ       |
|          Task Queue         |
|          Port: 6379         |
+--------------+--------------+
               |
        +------+------+
        |             |
        v             v
+--------------+ +--------------+
| CPU Workers  | | I/O Workers  |
| PDF / Image  | |Audio / Video |
+------+-------+ +------+-------+
       |                |
       +--------+-------+
                |
                v
+-----------------------------+
| Task Completion and Result  |
|          Handling           |
+--------------+--------------+
               |
               v
+-----------------------------+
|           MongoDB           |
|   Tasks and Worker Metrics  |
|         Port: 27017         |
+-----------------------------+
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
- WSL / Ubuntu for the current Redis development setup on Windows

Install PM2 globally if required:

```bash
npm install -g pm2
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/deerajkumar03/intelligent-task-scheduling-system.git
```

Navigate to the project directory:

```bash
cd intelligent-task-scheduling-system
```

### 2. Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
```

Install the required dependencies:

```bash
npm install
```

### 3. Install Frontend Dependencies

Navigate to the frontend directory:

```bash
cd ../frontend
```

Install the required dependencies:

```bash
npm install
```

---

## Environment Configuration

Create a `.env` file inside the `backend` directory using `.env.example` as a reference.

Example local development configuration:

```env
MONGO_URI=mongodb://127.0.0.1:27017/intelligenttaskScheduler

PORT=5000

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

NODE_ENV=development

SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

MAX_ACTIVE_JOBS=3

MAX_DYNAMIC_WORKERS=4
DYNAMIC_WORKER_QUEUE_THRESHOLD=8
DYNAMIC_WORKER_IDLE_TIMEOUT=120000
DYNAMIC_WORKER_SPAWN_COOLDOWN=10000

ENABLE_FAILURE_SIMULATION=false
FAILURE_RATE=0.15
```

### Configuration Details

| Variable | Description |
| --- | --- |
| `MONGO_URI` | Local MongoDB connection URI |
| `PORT` | Backend server port |
| `REDIS_HOST` | Redis server host |
| `REDIS_PORT` | Redis server port |
| `NODE_ENV` | Application runtime environment |
| `SERVER_URL` | Backend server URL |
| `CLIENT_URL` | React frontend URL allowed by the backend |
| `MAX_ACTIVE_JOBS` | Maximum configured number of active jobs |
| `MAX_DYNAMIC_WORKERS` | Maximum number of dynamically created workers |
| `DYNAMIC_WORKER_QUEUE_THRESHOLD` | Queue threshold used to trigger dynamic worker scaling |
| `DYNAMIC_WORKER_IDLE_TIMEOUT` | Idle duration in milliseconds before a dynamic worker is terminated |
| `DYNAMIC_WORKER_SPAWN_COOLDOWN` | Minimum delay between dynamic worker spawn operations |
| `ENABLE_FAILURE_SIMULATION` | Enables or disables simulated worker failures for testing |
| `FAILURE_RATE` | Failure probability used when failure simulation is enabled |

> The actual `.env` file is excluded from Git tracking. Do not commit credentials, secrets, or sensitive environment configuration to the repository.

---

## Running the Complete System

The application requires **MongoDB, Redis, the backend server, worker processes, and the React frontend** to operate together.

The following procedure represents the current local Windows development environment.

### Step 1: Ensure MongoDB Is Running

The backend uses a local MongoDB instance:

```text
mongodb://127.0.0.1:27017/intelligenttaskScheduler
```

Ensure the MongoDB service is running before starting the backend.

The database `intelligenttaskScheduler` is used by the application for persistence.

---

### Step 2: Verify Redis Using Ubuntu / WSL

Redis is used by BullMQ for queue management.

Open the Ubuntu/WSL terminal.

Connect to the Redis server:

```bash
redis-cli
```

Verify the connection:

```text
127.0.0.1:6379> ping
PONG
```

A `PONG` response confirms that Redis is running and accessible.

If Redis is not running, start the Redis server first:

```bash
redis-server
```

Keep Redis running while using the application.

The Ubuntu/WSL terminal can remain open or minimized while the rest of the application is running.

---

### Step 3: Start the Backend Server

Open a new terminal and navigate to the backend directory:

```bash
cd backend
```

Start the backend:

```bash
node server.js
```

A successful startup should display messages similar to:

```text
Redis connected
MongoDB connected
Intelligent Task Scheduler running on port 5000
```

Keep this terminal running.

---

### Step 4: Start the Worker Processes

Open another terminal and navigate to the backend directory:

```bash
cd backend
```

Start the configured workers using PM2:

```bash
pm2 start ecosystem.config.js
```

The default PM2 configuration starts:

```text
2 CPU Workers
2 I/O Workers
```

Verify the worker processes:

```bash
pm2 list
```

The CPU and I/O worker processes should appear with an `online` status.

Worker logs can be inspected using:

```bash
pm2 logs
```

---

### Step 5: Start the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Start the React development server:

```bash
npm start
```

The frontend application runs at:

```text
http://localhost:3000
```

The frontend communicates with the backend running at:

```text
http://localhost:5000
```

---

### Step 6: Test the System

Upload a supported workload through the monitoring dashboard.

The system will:

1. Accept and validate the uploaded workload.
2. Classify the workload type.
3. Create the task.
4. Divide suitable workloads into chunks when required.
5. Apply task priority information.
6. Evaluate available workers.
7. Select a suitable CPU or I/O worker.
8. Process tasks through the distributed worker pool.
9. Display scheduling decisions and execution activity in real time.
10. Handle retries and worker reassignment when execution failures occur.
11. Dynamically create additional workers when configured scaling conditions are reached.
12. Terminate idle dynamic workers after the configured timeout.
13. Complete the task and clean temporary chunk data.

During execution, activity can be monitored through both the backend terminal and the real-time dashboard.

---

## Local Development Runtime

```text
             MongoDB
      127.0.0.1 : 27017
                 |
                 |
                 v
+--------------------------------+
|     Node.js / Express Backend   |
|      http://localhost:5000      |
+---------------+----------------+
                |
                |
        Redis / BullMQ Queue
         127.0.0.1 : 6379
                |
        +-------+-------+
        |               |
        v               v
 +-------------+  +-------------+
 | CPU Workers |  | I/O Workers |
 |    PM2      |  |    PM2      |
 +------+------+  +------+------+
        |                |
        +--------+-------+
                 |
                 v
       Socket.IO Telemetry
                 |
                 v
+--------------------------------+
|        React Frontend          |
|      http://localhost:3000     |
|     Monitoring Dashboard       |
+--------------------------------+
```

---

## Example Scheduling Decision

The scheduler generates observable scheduling information similar to:

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
Queue Workload Increases
          |
          v
Configured Threshold Reached
          |
          v
Scaling Condition Detected
          |
          v
Dynamic Worker Spawned
          |
          v
Worker Connects to Backend
          |
          v
Worker Registers with Scheduler
          |
          v
Worker Becomes Available
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

The current configuration limits the number of dynamically created workers and applies a cooldown between worker spawn operations.

---

## Failure Simulation

The project includes optional failure simulation functionality for testing retry and recovery behavior.

Failure simulation can be enabled using:

```env
ENABLE_FAILURE_SIMULATION=true
```

The configured failure probability is controlled through:

```env
FAILURE_RATE=0.15
```

For normal operation, failure simulation should remain disabled:

```env
ENABLE_FAILURE_SIMULATION=false
```

This functionality is intended for testing the system's failure detection, retry, and worker reassignment behavior.

---

## Testing and Validation

The system has been tested with multiple workload types, including:

- PDF files
- Image files
- Audio workloads
- Video files

The following functionality has been validated during development:

- Workload classification
- CPU and I/O worker routing
- Specialized worker selection
- Load-aware scheduling
- Priority-aware scheduling
- Multi-chunk workload processing
- Parallel chunk distribution
- Task completion
- Worker failure detection
- Retry and task reassignment
- Permanent failure handling after retry exhaustion
- Dynamic worker spawning
- Dynamic worker registration
- Dynamic worker idle termination
- Queue event monitoring
- Real-time telemetry
- Worker resource monitoring
- Temporary chunk cleanup

---

## Future Enhancements

Potential future improvements include:

- Docker-based containerization
- Kubernetes-based worker orchestration
- Kubernetes-based auto-scaling
- Deployment across multiple physical or cloud machines
- Advanced scheduling algorithms
- Machine-learning-based workload prediction
- Persistent task result management
- Authentication and authorization
- Role-based dashboard access
- Distributed tracing
- Prometheus and Grafana integration
- Cloud deployment
- Automated integration testing
- Performance benchmarking under concurrent workloads

---

## Project Scope

This project is an academic distributed task orchestration prototype developed to demonstrate the concepts of:

- Metric-based intelligent scheduling
- Distributed worker coordination
- Specialized workload processing
- Parallel task execution
- Priority-aware scheduling
- Dynamic worker management
- Fault handling and retry mechanisms
- Queue-based asynchronous processing
- Real-time monitoring
- Runtime telemetry
- Worker resource monitoring

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