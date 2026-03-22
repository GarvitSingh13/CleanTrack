import React, { useEffect, useState } from "react";
import Loader from "./Loader";

function UserDashboard({ onBack }) {

  const [complaints, setComplaints] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getBadge = (credits = 0) => {
    if (credits >= 100) return { title: "City Guardian 👑", color: "#eab308", bg: "rgba(234, 179, 8, 0.1)" };
    if (credits >= 50) return { title: "Waste Warrior 🛡️", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" };
    return { title: "Eco Starter 🌱", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" };
  };

  const fetchMyComplaints = async () => {
    try {

      const token = localStorage.getItem("userToken");

      const res = await fetch("http://localhost:5000/api/complaints/my", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      setComplaints(data);
      setLoading(false);

    } catch (err) {
      console.error("Failed to load complaints", err);
      setLoading(false);
    }
  };

  const fetchMyProfile = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
    fetchMyProfile();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="user-dashboard">
      
      <div className="dashboard-header" style={{ marginBottom: "20px" }}>
        <div className="dashboard-title">
          <h2>My Complaints & Impact</h2>
          <p>Track your reports and environmental contribution</p>
        </div>
        <button onClick={onBack} className="role-btn admin-btn" style={{ padding: "10px 20px" }}>
          ← Back
        </button>
      </div>

      {userData && (
        <div className="stat-card gamification-card" style={{ marginBottom: "30px", background: "linear-gradient(135deg, rgba(34,197,94,0.05), rgba(20,184,166,0.05))", border: "1px solid rgba(34,197,94,0.2)"}}>
          <div>
            <h3 className="dashboard-section-title" style={{ fontSize: "18px", marginTop: "0" }}>My Environmental Impact</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span className="stat-number" style={{ color: "var(--primary-color)", fontSize: "36px" }}>{userData.greenCredits || 0}</span>
                <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--primary-color)" }}>Green Credits</span>
              </div>
              <div style={{ padding: "6px 14px", borderRadius: "12px", background: getBadge(userData.greenCredits).bg, color: getBadge(userData.greenCredits).color, fontWeight: "700", fontSize: "15px", display: "inline-block" }}>
                {getBadge(userData.greenCredits).title}
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-color)", marginTop: "12px", opacity: 0.7 }}>
              Earn +10 credits for every valid garbage complaint reported! Clean cities start with you.
            </p>
          </div>
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="stat-card" style={{ justifyContent: "center", padding: "40px" }}>
          <p style={{ fontSize: "18px" }}>You haven't submitted any complaints yet. 😊</p>
        </div>
      ) : (
        <div className="complaints-list">
          {complaints.map((c) => (
            <div 
              key={c._id} 
              className={`complaint-card ${
                c.priority === "Very High" ? "very-high-priority-card" : 
                c.priority === "High" ? "high-priority-card" : ""
              }`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ fontSize: "18px", marginBottom: "8px" }}>{c.description}</h4>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className={`status-badge ${c.status === "Resolved" ? "status-resolved" : "status-pending"}`}>
                      {c.status}
                    </span>
                    {c.priority === "Very High" && (
                      <span className="status-badge priority-very-high" style={{ animation: "pulse 1.5s infinite" }}>
                        CRITICAL
                      </span>
                    )}
                    {c.priority === "High" && (
                      <span className="status-badge priority-high">
                        HIGH
                      </span>
                    )}
                  </div>
                </div>
                <span className="card-date">
                  {new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <p className="label-text">Location</p>
                  <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-color)" }}>{c.address}</p>
                </div>
                <div className="map-preview">
                  <iframe
                    title="location-map"
                    width="100%"
                    height="120"
                    style={{ border: 0, borderRadius: "16px" }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${c.latitude},${c.longitude}&z=15&output=embed`}
                  ></iframe>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;