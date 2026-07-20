\# Intelligent Task Scheduling System with Real-Time Monitoring



A distributed task orchestration and scheduling system designed to intelligently classify heterogeneous workloads, distribute tasks across specialized workers, monitor execution in real time, handle worker failures, and dynamically scale worker capacity based on workload demand.



The system provides a real-time monitoring dashboard that visualizes task execution, worker health, queue activity, system resources, scheduling decisions, telemetry events, and execution statistics.



\---



\## Overview



Traditional task-processing systems may assign workloads without considering worker specialization, current load, health, or execution performance.



This project implements an intelligent distributed scheduling approach where incoming workloads are classified and routed to suitable workers based on multiple runtime factors.



The system supports different workload types such as:



\- Text

\- PDF

\- Image

\- Audio

\- Video



Large workloads can be divided into smaller chunks and distributed across multiple workers for parallel processing.



The scheduler considers factors such as:



\- Worker specialization

\- Current worker load

\- Worker health

\- Average execution latency

\- Task priority

\- Historical worker performance



The system also provides real-time monitoring using Socket.IO, allowing the frontend dashboard to reflect task and worker activity as it happens.



\---



\## Key Features



\### Intelligent Task Scheduling



The scheduler evaluates available workers and selects a suitable worker based on runtime scheduling metrics rather than assigning tasks blindly.



Scheduling decisions consider:



\- Worker type and specialization

\- Current workload

\- Worker health status

\- Average latency

\- Task priority

\- Historical performance



Scheduling decisions are also exposed through telemetry so that worker selection can be observed from the monitoring dashboard.



\### Specialized Worker Pool



The system maintains specialized worker categories for different workload characteristics.



\*\*CPU Workers\*\*



Used primarily for CPU-oriented workloads such as:



\- PDF processing

\- Image processing

\- Compute-intensive tasks



\*\*I/O Workers\*\*



Used primarily for I/O-oriented workloads such as:



\- Audio processing

\- Video processing

\- File-intensive operations



This separation allows the scheduler to route workloads to workers better suited for their execution characteristics.



\### Chunk-Based Parallel Processing



Large workloads can be divided into multiple chunks.



The chunks are scheduled independently and can be distributed across available workers, enabling parallel execution.



Typical workflow:



```text

Large Workload

&#x20;     |

&#x20;     v

Workload Classification

&#x20;     |

&#x20;     v

File Chunking

&#x20;     |

&#x20;     v

Intelligent Scheduler

&#x20;     |

&#x20;     +------> Worker 1

&#x20;     |

&#x20;     +------> Worker 2

&#x20;     |

&#x20;     +------> Worker 3

&#x20;     |

&#x20;     v

Result Aggregation

&#x20;     |

&#x20;     v

Completed Task

```



Temporary chunks are cleaned after successful workload completion.



\### Priority-Aware Scheduling



Tasks can be submitted with different priority levels.



Supported priorities include:



\- Low

\- Normal

\- High

\- Critical



Priority information is incorporated into the scheduling process to influence task execution decisions.



\### Dynamic Worker Scaling



The system includes dynamic worker management for handling increased workload demand.



When workload pressure reaches configured conditions, additional workers can be spawned dynamically.



Dynamic workers:



1\. Start when additional processing capacity is required.

2\. Connect to the scheduling system.

3\. Register with the scheduler.

4\. Process assigned workloads.

5\. Remain available while required.

6\. Terminate after an idle timeout when additional capacity is no longer necessary.



This provides a lightweight demonstration of workload-based horizontal worker scaling.



\### Fault Handling and Retry Mechanism



The system includes retry handling for worker execution failures.



If a worker fails while processing a task:



1\. The failure is detected.

2\. The task execution attempt is recorded.

3\. The task can be reassigned to another suitable worker.

4\. Execution is retried according to the configured retry policy.

5\. The task is marked as permanently failed if retry limits are exhausted.



This improves resilience against temporary worker failures.



\### Distributed Queue Management



Redis and BullMQ are used for asynchronous task queue management.



The queue layer supports:



\- Task queuing

\- Worker-based processing

\- Queue event monitoring

\- Asynchronous execution

\- Failure handling

\- Retry workflows



\### Real-Time Monitoring



Socket.IO is used to stream runtime events between the backend and frontend.



The monitoring dashboard provides visibility into:



\- Task progress

\- Worker activity

\- Worker health

\- Worker CPU usage

\- Worker memory usage

\- Queue status

\- Scheduling decisions

\- Task completion

\- Failures and retries

\- Cluster activity

\- System telemetry



\---



\## Monitoring Dashboard



The React dashboard contains multiple monitoring components.



\### Metrics Cards



Displays high-level system metrics and workload statistics.



\### Task Pipeline



Visualizes the current workload as it moves through different orchestration stages.



Example:



```text

Upload

&#x20; |

&#x20; v

Classification

&#x20; |

&#x20; v

Chunking

&#x20; |

&#x20; v

Scheduling

&#x20; |

&#x20; v

Processing

&#x20; |

&#x20; v

Aggregation

&#x20; |

&#x20; v

Completed

```



\### Worker Panel



Displays registered workers and their runtime information, including:



\- Worker ID

\- Worker type

\- Health status

\- Current load

\- CPU utilization

\- Memory utilization

\- Jobs processed

\- Failure information

\- Average latency

\- Heartbeat status



\### Queue Overview



Provides visibility into current queue activity and pending workload information.



\### Cluster Activity



Visualizes historical cluster activity, including processing and workload trends.



\### Resource Monitor



Displays system resource information reported by workers.



\### Telemetry Panel



Shows real-time orchestration and scheduling events generated by the backend.



\### Execution Summary



Provides execution-related metrics and statistics collected during system operation.



\---



\## System Architecture



```text

&#x20;                        +----------------------+

&#x20;                        |     React Frontend   |

&#x20;                        | Monitoring Dashboard |

&#x20;                        +----------+-----------+

&#x20;                                   |

&#x20;                            HTTP / Socket.IO

&#x20;                                   |

&#x20;                                   v

&#x20;                        +----------------------+

&#x20;                        |   Node.js + Express  |

&#x20;                        |    Backend Server    |

&#x20;                        +----------+-----------+

&#x20;                                   |

&#x20;                    +--------------+--------------+

&#x20;                    |                             |

&#x20;                    v                             v

&#x20;           +------------------+          +------------------+

&#x20;           | Intelligent      |          | Real-Time        |

&#x20;           | Scheduler        |          | Telemetry        |

&#x20;           +--------+---------+          +------------------+

&#x20;                    |

&#x20;                    v

&#x20;           +------------------+

&#x20;           | Redis + BullMQ   |

&#x20;           | Task Queue       |

&#x20;           +--------+---------+

&#x20;                    |

&#x20;         +----------+----------+

&#x20;         |                     |

&#x20;         v                     v

&#x20;+----------------+    +----------------+

&#x20;|  CPU Workers   |    |  I/O Workers   |

&#x20;| PDF / Image    |    | Audio / Video  |

&#x20;+----------------+    +----------------+

&#x20;         |                     |

&#x20;         +----------+----------+

&#x20;                    |

&#x20;                    v

&#x20;           +------------------+

&#x20;           | Result Handling  |

&#x20;           | \& Aggregation    |

&#x20;           +--------+---------+

&#x20;                    |

&#x20;                    v

&#x20;           +------------------+

&#x20;           |     MongoDB      |

&#x20;           | Task / Metrics   |

&#x20;           +------------------+

```



\---



\## Workload Execution Flow



```text

User Upload

&#x20;   |

&#x20;   v

File Validation

&#x20;   |

&#x20;   v

Workload Classification

&#x20;   |

&#x20;   v

Task Creation

&#x20;   |

&#x20;   v

Chunking (if required)

&#x20;   |

&#x20;   v

Priority Assignment

&#x20;   |

&#x20;   v

Intelligent Scheduler

&#x20;   |

&#x20;   v

Worker Selection

&#x20;   |

&#x20;   v

Redis / BullMQ Queue

&#x20;   |

&#x20;   v

Distributed Worker Execution

&#x20;   |

&#x20;   +---- Failure ----> Retry / Reassignment

&#x20;   |

&#x20;   v

Chunk Completion

&#x20;   |

&#x20;   v

Result Aggregation

&#x20;   |

&#x20;   v

Task Completion

&#x20;   |

&#x20;   v

Temporary File Cleanup

&#x20;   |

&#x20;   v

Real-Time Dashboard Update

```



\---



\## Technology Stack



\### Backend



\- Node.js

\- Express.js

\- MongoDB

\- Mongoose

\- Redis

\- BullMQ

\- Socket.IO

\- Multer

\- UUID

\- PM2



\### Frontend



\- React

\- Axios

\- Socket.IO Client

\- Recharts

\- Framer Motion

\- Lucide React



\### Infrastructure and Runtime



\- Redis for queue infrastructure

\- MongoDB for persistence

\- PM2 for worker process management

\- Socket.IO for real-time communication



\---



\## Project Structure



```text

intelligent\_task\_scheduler/

|

+-- backend/

|   |

|   +-- config/

|   |   +-- db.js

|   |   +-- redis.js

|   |

|   +-- models/

|   |   +-- Task.js

|   |   +-- WorkerMetrics.js

|   |

|   +-- queues/

|   |   +-- queueEvents.js

|   |   +-- taskQueue.js

|   |

|   +-- scheduler/

|   |   +-- scheduler.js

|   |

|   +-- utils/

|   |   +-- dynamicWorkerManager.js

|   |   +-- eventLogger.js

|   |

|   +-- workers/

|   |   +-- worker.js

|   |

|   +-- server.js

|   +-- resetSystem.js

|   +-- ecosystem.config.js

|   +-- .env.example

|   +-- package.json

|   +-- package-lock.json

|

+-- frontend/

|   |

|   +-- public/

|   |

|   +-- src/

|   |   |

|   |   +-- components/

|   |   |   +-- ClusterActivity.jsx

|   |   |   +-- ExecutionSummary.jsx

|   |   |   +-- Layout.jsx

|   |   |   +-- MetricsCards.jsx

|   |   |   +-- QueueOverview.jsx

|   |   |   +-- ResourceMonitor.jsx

|   |   |   +-- TaskPipeline.jsx

|   |   |   +-- TelemetryPanel.jsx

|   |   |   +-- Upload.jsx

|   |   |   +-- WorkerPanel.jsx

|   |   |

|   |   +-- context/

|   |   |   +-- OrchestrationContext.jsx

|   |   |

|   |   +-- services/

|   |   |   +-- api.js

|   |   |   +-- socket.js

|   |   |

|   |   +-- App.jsx

|   |   +-- App.css

|   |   +-- index.js

|   |

|   +-- package.json

|   +-- package-lock.json

|

+-- .gitignore

+-- README.md

```



\---



\## Prerequisites



Before running the project, ensure the following are installed:



\- Node.js

\- npm

\- MongoDB

\- Redis

\- PM2



PM2 can be installed globally using:



```bash

npm install -g pm2

```



\---



\## Installation



Clone the repository:



```bash

git clone https://github.com/deerajkumar03/intelligent-task-scheduling-system.git

```



Navigate to the project:



```bash

cd intelligent-task-scheduling-system

```



\### Backend Setup



```bash

cd backend

npm install

```



Create a `.env` file using `.env.example` as the reference and configure the required environment variables.



Start the backend:



```bash

npm start

```



Or:



```bash

node server.js

```



\### Start Worker Processes



Using PM2:



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



\### Frontend Setup



Open another terminal:



```bash

cd frontend

npm install

npm start

```



The React development server will start and connect to the backend services.



\---



\## Environment Configuration



The repository includes:



```text

backend/.env.example

```



Create your local environment file:



```text

backend/.env

```



Configure the values required by the backend according to `.env.example`.



> Never commit the actual `.env` file or production credentials to the repository.



\---



\## Running the System



A typical local startup sequence is:



```text

1\. Start MongoDB

2\. Start Redis

3\. Start backend server

4\. Start PM2 workers

5\. Start React frontend

6\. Upload a workload

7\. Monitor execution through the dashboard

```



\---



\## Testing



The system has been tested with multiple workload types, including:



\- PDF workloads

\- Image workloads

\- Video workloads



Testing verified:



\- Workload classification

\- Specialized worker selection

\- CPU and I/O worker routing

\- Multi-chunk video processing

\- Parallel chunk distribution

\- Load-aware worker selection

\- Task completion

\- Retry and worker failure handling

\- Dynamic worker spawning

\- Dynamic worker idle termination

\- Real-time telemetry

\- Worker monitoring

\- Queue monitoring

\- Temporary chunk cleanup



\---



\## Example Scheduling Decision



A scheduling decision may consider information similar to:



```text

Worker Type: I/O

Task Type: Video

Current Load: 0

Average Latency: 0.00

Priority Boost: 4



Selected Because:

\- Specialized Worker

\- Low Load

\- Healthy Worker

```



This makes scheduling decisions observable rather than treating worker assignment as a black box.



\---



\## Dynamic Worker Lifecycle



```text

Workload Increase

&#x20;     |

&#x20;     v

Scaling Condition Detected

&#x20;     |

&#x20;     v

Spawn Dynamic Worker

&#x20;     |

&#x20;     v

Worker Connects

&#x20;     |

&#x20;     v

Scheduler Registration

&#x20;     |

&#x20;     v

Task Processing

&#x20;     |

&#x20;     v

Worker Becomes Idle

&#x20;     |

&#x20;     v

Idle Timeout

&#x20;     |

&#x20;     v

Worker Termination

```



\---



\## Future Enhancements



Possible future improvements include:



\- Containerized worker deployment using Docker

\- Kubernetes-based automatic scaling

\- Distributed deployment across multiple physical machines

\- Advanced scheduling algorithms

\- Machine-learning-based workload prediction

\- Persistent task result storage

\- Authentication and authorization

\- Role-based dashboard access

\- Improved observability and tracing

\- Prometheus and Grafana integration

\- Cloud deployment

\- Performance benchmarking under high concurrent workloads



\---



\## Project Scope



This project is an academic distributed task orchestration prototype designed to demonstrate:



\- Intelligent metric-based scheduling

\- Distributed worker coordination

\- Parallel task processing

\- Dynamic worker management

\- Fault handling and retries

\- Queue-based asynchronous execution

\- Real-time monitoring and telemetry



It is not intended to replace production-scale distributed orchestration platforms, but demonstrates the core concepts involved in building an observable and workload-aware distributed task processing system.



\---



\## Author



\*\*Deeraj Kumar\*\*



MCA Major Project



GitHub: \[deerajkumar03](https://github.com/deerajkumar03)



\---



\## Repository



\[GitHub Repository](https://github.com/deerajkumar03/intelligent-task-scheduling-system)

