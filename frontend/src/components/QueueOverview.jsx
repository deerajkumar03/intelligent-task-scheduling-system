import React,
{
  useContext
} from "react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

const COLORS = [

  "#3b82f6",

  "#06b6d4",

  "#22c55e",

  "#ef4444"
];

const QueueOverview = () => {

  const {
    metrics
  } = useContext(
    OrchestrationContext
  );
const hasData =

  (metrics.pendingQueue || 0) +
  (metrics.processingQueue || 0) +
  (metrics.completedJobs || 0) +
  (metrics.failedJobs || 0) > 0;

  const data = [

    {
      name: "Queued",

      value:
        metrics.pendingQueue || 0
    },

    {
      name: "Processing",

      value:
        metrics.processingQueue || 0
    },

    {
      name: "Completed",

      value:
        metrics.completedJobs || 0
    },

    {
      name: "Failures",

      value:
        metrics.failedJobs || 0
    }
  ];

  return (

    <div className="panel">

      <div className="panel-header">

        <h2>
          Queue Overview
        </h2>

      </div>

      <div className="queue-chart">

        <ResponsiveContainer
          width="100%"
          height={260}
        >

<PieChart>
  {
  !hasData && (

    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      fill="#94a3b8"
    >
      No Queue Activity
    </text>
  )
}
            <Pie
              data={data}
              dataKey="value"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
            >

              {

                data.map(
                  (
                    entry,
                    index
                  ) => (

                    <Cell
                     key={entry.name}
                      fill={
                        COLORS[index]
                      }
                    />
                  )
                )
              }

            </Pie>

<Tooltip
  formatter={(value) => [
    value,
    "Tasks"
  ]}
/>

<Legend
  wrapperStyle={{
    fontSize: "12px"
  }}
/>
          </PieChart>

        </ResponsiveContainer>
        <div className="queue-summary">

  <div>

    Total Tasks:

    {

      (metrics.pendingQueue || 0) +

      (metrics.processingQueue || 0) +

      (metrics.completedJobs || 0) +

      (metrics.failedJobs || 0)

    }

  </div>

</div>

      </div>

    </div>
  );
};

export default QueueOverview;