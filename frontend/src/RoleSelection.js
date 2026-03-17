import React from "react";

function RoleSelection({ setRole }) {

  return (
    <div className="role-page">

      <div className="role-container">

        <h1 className="role-title">CleanTrack</h1>

        <p className="role-subtitle">
          Smart Waste Management Platform
        </p>

        <p className="role-description">
          Empowering citizens to report garbage issues and helping cities stay clean through real-time monitoring and analytics.
        </p>

        <div className="role-buttons">

          <button
            className="resolve-btn role-btn"
            onClick={() => {
              localStorage.removeItem("userToken");
              setRole("user");
            }}
          >
            Report Garbage
          </button>

          <button
            className="resolve-btn role-btn"
            onClick={() => {
              localStorage.removeItem("adminToken");
              setRole("admin");
            }}
          >
            Admin Dashboard
          </button>

        </div>

      </div>

    </div>
  );
}

export default RoleSelection;