import React,
{
  useContext
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

const ResourceMonitor = () => {

  const {
    workers,
    metrics
  } = useContext(
    OrchestrationContext
  );

  const avgCpu =

    workers.length > 0

      ? Math.floor(

          workers.reduce(
            (
              total,
              worker
            ) =>

              total +
              (
                worker.cpu || 0
              ),

            0
          ) / workers.length

        )

      : 0;

  const avgRam =

    workers.length > 0

      ? Math.floor(

          workers.reduce(
            (
              total,
              worker
            ) =>

              total +
              (
                worker.ram || 0
              ),

            0
          ) / workers.length

        )

      : 0;

 const throughput =

  Number(
    metrics.throughput || 0
  );
const avgLatency =

  workers.length > 0

    ? Math.floor(

        workers.reduce(
          (total, worker) =>

            total +
            (
              worker.avgLatency || 0
            ),

          0
        ) / workers.length

      )

    : 0;

const resources = [

  {
    label: "CPU",

    value: avgCpu,

    color: "#00f5ff",

    unit: "%"
  },

  {
    label: "RAM",

    value: avgRam,

    color: "#facc15",

    unit: "%"
  },

 {
  label: "JOBS/SEC",

  value: throughput.toFixed(1),

  color: "#22c55e",

  unit: ""
},
  {
  label: "LATENCY",

  value: avgLatency,

  color: "#ef4444",

  unit: "ms"
}
];

  return (

    <div className="panel">

      <div className="panel-header">

        <h2>
           Cluster Resource Monitor
        </h2>

      </div>

      <div className="resource-grid">

        {

          resources.map(
            (
              resource,
              index
            ) => (

              <div
  className="resource-card"
  key={resource.label}
>

                <div
                  className="resource-circle"
                  style={{

                    borderColor:
                      resource.color,

                    boxShadow:
                      `0 0 20px ${resource.color}55`
                  }}
                >

                  <span>

{resource.value}
{resource.unit !== ""
  ? resource.unit
  : ""}
                  </span>

                </div>

                <h3>

                  {resource.label}

                </h3>

              </div>
            )
          )
        }

      </div>

    </div>
  );
};

export default ResourceMonitor;