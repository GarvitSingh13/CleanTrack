import React, { useState, useEffect } from "react";
import AdminKeyModal from "./AdminKeyModal";

function RoleSelection({ setRole }) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [reportsResolved, setReportsResolved] = useState(1284);

  useEffect(() => {
    const interval = setInterval(() => {
      setReportsResolved(prev => prev + Math.floor(Math.random() * 2));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

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
            className="role-btn"
            onClick={() => {
              localStorage.removeItem("userToken");
              setRole("user");
            }}
          >
            <span className="btn-icon" role="img" aria-label="recycle">♻️</span> Report Garbage
          </button>

          <button
            className="role-btn admin-btn"
            onClick={() => {
              localStorage.removeItem("collectorToken");
              setRole("collector");
            }}
            style={{ backgroundColor: "#2563eb" }}
          >
            <span className="btn-icon" role="img" aria-label="truck">🚛</span> Waste Collector
          </button>

          <button
            className="role-btn admin-btn"
            onClick={() => setShowAdminModal(true)}
          >
            <span className="btn-icon" role="img" aria-label="shield">🛡️</span> Admin Dashboard
          </button>

        </div>

        <div className="live-stats-footer">
          <div className="stat-pulse"></div>
          <span><strong>{reportsResolved.toLocaleString()}</strong> total garbage issues resolved by our community in real-time</span>
        </div>

      </div>

      {showAdminModal && (
        <AdminKeyModal
          onClose={() => setShowAdminModal(false)}
          onSuccess={() => {
            setShowAdminModal(false);
            localStorage.removeItem("adminToken");
            setRole("admin");
          }}
        />
      )}

    </div>
  );
}

export default RoleSelection;