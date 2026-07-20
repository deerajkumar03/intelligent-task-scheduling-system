import React,
{
  useContext
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

const ClusterActivity = () => {

  const {
    metricsHistory
  } = useContext(
    OrchestrationContext
  );
 const chartData =

  metricsHistory.length > 0

    ? metricsHistory

    : [

        {

          time: "--",

          pending: 0,

          processing: 0,

          throughput: 0,

          workers: 0
        }
      ];
  return (

    <div className="panel cluster-panel">

      <div className="panel-header">

        <h2>
          Cluster Activity
        </h2>

      </div>

     <div className="chart-container">

  <ResponsiveContainer
    width="100%"
    height={420}
  >

    <LineChart
      data={chartData}
    >

  <CartesianGrid
    stroke="#1e293b"
  />

  <XAxis
  dataKey="time"
  stroke="#94a3b8"
  tick={{
    fontSize: 10
  }}
  minTickGap={40}
/>

  <YAxis
  stroke="#94a3b8"
  domain={[0, "auto"]}
  label={{
    value: "Tasks / Workers",
    angle: -90,
    position: "insideLeft"
  }}
/>
<Tooltip
  cursor={{
    stroke:"#3b82f6",
    strokeWidth:1
  }}
  contentStyle={{
    background:"#0f172a",
    border:"1px solid #334155",
    borderRadius:"8px"
  }}
/>
  <Legend
    wrapperStyle={{
      fontSize: "12px"
    }}
  />

  <Line
    type="monotone"
    dataKey="pending"
    name="Pending Queue"
    stroke="#facc15"
    strokeWidth={3}
    dot={false}
    activeDot={{ r: 8 }}
    isAnimationActive={false}
  />

  <Line
    type="monotone"
    dataKey="processing"
    name="Processing"
    stroke="#00f5ff"
    strokeWidth={3}
    dot={false}
    activeDot={{ r: 8 }}
    isAnimationActive={false}
  />

  <Line
  type="monotone"
  dataKey="throughput"
  name="Jobs/sec"
  stroke="#22c55e"
  strokeWidth={3}
  dot={false}
  activeDot={{ r: 8 }}
  isAnimationActive={false}
/>

  <Line
    type="monotone"
    dataKey="workers"
    name="Active Workers"
    stroke="#a855f7"
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 8 }}
    isAnimationActive={false}
  />

</LineChart>

  </ResponsiveContainer>

      </div>

    </div>
  );
};

export default ClusterActivity;