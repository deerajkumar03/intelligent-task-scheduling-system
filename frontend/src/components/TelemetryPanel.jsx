import React,
{
  useContext
} from "react";

import {
  OrchestrationContext
} from "../context/OrchestrationContext";

const TelemetryPanel = () => {

  const {
    logs
  } = useContext(
    OrchestrationContext
  );

 const getTypeClass = (
  type = ""
)=> {

   const text =
  type.toLowerCase();

    if (
      text.includes("failed")
    ){

      return "telemetry-error";
    }

    if (
      text.includes("retry")
    ){

      return "telemetry-warning";
    }

    if (
      text.includes("assigned")
    ){

      return "telemetry-info";
    }

    if (
      text.includes("completed")
    ){

      return "telemetry-success";
    }

    return "telemetry-default";
  };

  return (

    <div className="panel telemetry-panel">

      <div className="panel-header">

        <h2>
          Live Orchestration Timeline
        </h2>

      </div>

    <div className="telemetry-box">

  {

    logs.length === 0 ? (

      <div className="empty-workers">

        Waiting for orchestration events...

      </div>

    ) : (

     logs.map(
  (
    log,
    index
  ) => (

              <div
                className={`telemetry-event ${
                 getTypeClass(
                  log.type
                 )
                }`}
        key={`${index}-${log.time}`}
              >

                <div className="telemetry-left">

                  <div className="telemetry-dot" />

                </div>

                <div className="telemetry-content">

                  <div className="telemetry-top">

                    <span className="telemetry-time">

                      {log.time}

                    </span>

                  </div>

                 {
  log.type && (

    <span className="telemetry-type">

      {log.type}

    </span>

  )
}
                  <p>

                    {log.message}

                  </p>

                </div>

              </div>
            )
          )
        )
        }

      </div>

    </div>
  );
};

export default TelemetryPanel;