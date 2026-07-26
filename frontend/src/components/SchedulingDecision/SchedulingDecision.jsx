import React, {
  useContext
} from "react";

import "./SchedulingDecision.css";

import {
  OrchestrationContext
} from "../../context/OrchestrationContext";


/* =========================================
   FORMAT SELECTION REASON
========================================= */

const formatReason =
  (reason) => {

    return (
      reason
        ?.replace(
          /-/g,
          " "
        )
        .replace(
          /\b\w/g,
          (char) =>
            char.toUpperCase()
        ) ||
      "Scheduler score"
    );

  };


/* =========================================
   SHORT WORKER ID
========================================= */

const shortWorkerId =
  (workerId) => {

    if (
      !workerId
    ) {

      return "—";

    }


    return workerId.length > 14

      ? `${workerId.slice(
          0,
          8
        )}...`

      : workerId;

  };


/* =========================================
   SHORT TASK / CHUNK ID
========================================= */

const shortTaskId =
  (jobId) => {

    if (
      !jobId
    ) {

      return "—";

    }


    return jobId.length > 18

      ? `${jobId.slice(
          0,
          14
        )}...`

      : jobId;

  };


const SchedulingDecision = () => {

  const {
    schedulingDecisions,
    currentGroupId
  } = useContext(
    OrchestrationContext
  );


  /* =========================================
     CURRENT WORKLOAD DECISIONS ONLY
  ========================================= */

  const currentDecisions =
    currentGroupId

      ? (
          schedulingDecisions ||
          []
        ).filter(
          (
            decision
          ) =>
            decision.groupId ===
            currentGroupId
        )

      : [];


  const totalAssignments =
    currentDecisions.length;


  const uniqueWorkers =
    new Set(
      currentDecisions
        .map(
          (
            decision
          ) =>
            decision.workerId
        )
        .filter(
          Boolean
        )
    ).size;


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section
      className="panel scheduling-decision-panel"
    >


      {/* HEADER */}

      <div className="scheduling-header">


        <div className="scheduling-heading">

          <h2>
            Scheduling Decision / Execution Trace
          </h2>

          <p className="scheduling-subtitle">
            Real-time worker selection evidence from the scheduler
          </p>

        </div>


        <div className="scheduling-header-right">


          {
            totalAssignments > 0 && (

              <div className="scheduling-summary">

                <span>

                  <strong>
                    {totalAssignments}
                  </strong>

                  Assignments

                </span>


                <span>

                  <strong>
                    {uniqueWorkers}
                  </strong>

                  Workers

                </span>

              </div>

            )
          }


          <div className="scheduling-live-badge">

            <span className="scheduling-live-dot" />

            LIVE

          </div>


        </div>


      </div>


      {/* NO DECISIONS YET */}

      {

        currentDecisions.length ===
        0 ? (

          <div className="scheduling-empty">


            <div className="scheduling-empty-icon">

              ⚡

            </div>


            <div>

              <strong>
                No scheduling decisions yet
              </strong>

              <p>
                Upload a workload to see real-time worker
                selection and execution decisions.
              </p>

            </div>


          </div>

        ) : (


          /* DECISION TABLE */

          <div className="scheduling-table-wrapper">

            <table className="scheduling-table">


              <thead>

                <tr>

                  <th>
                    Task / Chunk
                  </th>

                  <th>
                    Worker
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Load
                  </th>

                  <th>
                    Latency
                  </th>

                  <th>
                    Selection Reason
                  </th>

                  <th>
                    Assigned
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {

                  currentDecisions.map(
                    (
                      decision
                    ) => (

                      <tr
                        key={
                          decision.jobId
                        }
                      >


                        {/* TASK / CHUNK */}

                        <td>

                          <div className="decision-task">

                            <strong
                              title={
                                decision.jobId
                              }
                            >

                              {
                                shortTaskId(
                                  decision.jobId
                                )
                              }

                            </strong>


                            <span>

                              {
                                decision.taskType ||
                                "generic"
                              }

                              {" • "}

                              {
                                decision.priority ||
                                "normal"
                              }

                            </span>

                          </div>

                        </td>


                        {/* WORKER */}

                        <td>

                          <span
                            className="decision-worker-id"
                            title={
                              decision.workerId
                            }
                          >

                            {
                              shortWorkerId(
                                decision.workerId
                              )
                            }

                          </span>

                        </td>


                        {/* WORKER TYPE */}

                        <td>

                          <span
                            className={
                              `worker-type-badge ${
                                decision.workerType ||
                                ""
                              }`
                            }
                          >

                            {
                              decision.workerType
                                ?.toUpperCase() ||
                              "—"
                            }

                          </span>

                        </td>


                        {/* LOAD */}

                        <td>

                          <span className="decision-number">

                            {
                              decision.load ??
                              0
                            }

                          </span>

                        </td>


                        {/* LATENCY */}

                        <td>

                          <span className="decision-number">

                            {
                              Math.round(
                                decision.avgLatency ??
                                0
                              )
                            }

                            ms

                          </span>

                        </td>


                        {/* SELECTION REASON */}

                        <td>

                          <div className="decision-reasons">

                            {

                              (
                                decision.selectedBecause ||
                                []
                              ).length > 0 ? (

                                (
                                  decision.selectedBecause ||
                                  []
                                ).map(
                                  (
                                    reason,
                                    index
                                  ) => (

                                    <span
                                      key={
                                        `${reason}-${index}`
                                      }
                                      className="decision-reason"
                                    >

                                      <span className="decision-check">
                                        ✓
                                      </span>

                                      {
                                        formatReason(
                                          reason
                                        )
                                      }

                                    </span>

                                  )
                                )

                              ) : (

                                <span className="decision-reason">

                                  <span className="decision-check">
                                    ✓
                                  </span>

                                  Scheduler score

                                </span>

                              )

                            }

                          </div>

                        </td>


                        {/* ASSIGNED TIME */}

                        <td>

                          <span className="decision-time">

                            {
                              decision.assignedAt

                                ? new Date(
                                    decision.assignedAt
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour:
                                        "2-digit",

                                      minute:
                                        "2-digit",

                                      second:
                                        "2-digit"
                                    }
                                  )

                                : "—"
                            }

                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              `decision-status ${
                                decision.status
                                  ?.toLowerCase() ||
                                "assigned"
                              }`
                            }
                          >

                            {
                              decision.status ||
                              "ASSIGNED"
                            }

                          </span>

                        </td>


                      </tr>

                    )
                  )

                }

              </tbody>


            </table>

          </div>

        )

      }


    </section>

  );

};


export default SchedulingDecision;