import React,
{
  useContext
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

const MetricsCards = () => {

  const {
    metrics,
    workers
  } = useContext(
    OrchestrationContext
  );

  const cards = [
{
  title: "Active Workers",

  value:

    metrics.activeWorkers ||

    workers.length ||

    0,

  color: "#00f5ff"
},

    {
      title: "Completed Tasks",

      value:
        metrics.completedJobs || 0,

      color: "#22c55e"
    },

   {
  title: "Queue Load",

  value:

    (metrics.pendingQueue || 0)

    +

    (metrics.processingQueue || 0),

  color: "#3b82f6"
},

    {
      title: "Failures",

      value:
        metrics.failedJobs || 0,

      color: "#ef4444"
    },

    {
  title: "Retry Events",

  value:
    metrics.retries || 0,

  color: "#facc15"
},

    {
  title: "Jobs/sec",

  value:
   Number(
  metrics.throughput || 0
).toFixed(2),

  color: "#8b5cf6"
}
  ];

  return (

    <div className="metrics-grid">

      {

        cards.map(
          (
            card
          ) => (

            <div
              className="metric-card"
            key={card.title}
            >

              <div
                className="metric-glow"
                style={{
                  background:
                    card.color
                }}
              />

              <h3>

                {card.title}

              </h3>

             <h1>

  {
    typeof card.value === "number"

      ? card.value.toLocaleString()

      : card.value
  }

</h1>

            </div>
          )
        )
      }

    </div>
  );
};

export default MetricsCards;