import React from "react";

import {
  FaChartLine,
  FaServer,
  FaMicrochip,
  FaTasks,
  FaWaveSquare,
  FaBell
} from "react-icons/fa";

const Layout = ({
  children
}) => {

  return (

    <div className="layout">

      <aside className="sidebar">

        <div className="logo">

          <h2>IDOE</h2>

          <span>
            Orchestration Engine
          </span>

        </div>

        <nav>

          <div className="nav-item active">
            <FaChartLine />
            Dashboard
          </div>

          <div className="nav-item">
            <FaTasks />
            Pipeline
          </div>

          <div className="nav-item">
            <FaMicrochip />
            Workers
          </div>

          <div className="nav-item">
            <FaServer />
            Cluster
          </div>

          <div className="nav-item">
            <FaWaveSquare />
            Telemetry
          </div>

          <div className="nav-item">
            <FaBell />
            Alerts
          </div>

        </nav>

      </aside>

      <main className="main-content">

        {children}

      </main>

    </div>
  );
};

export default Layout;