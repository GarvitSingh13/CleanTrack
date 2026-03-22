import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import React, { useState, useEffect, useMemo } from "react";
import AdminMapDashboard from "./AdminMapDashboard";
import { 
  FaClipboardList, FaClock, FaCheckCircle, FaExclamationTriangle, 
  FaBell
} from "react-icons/fa";


function AdminDashboard({ complaints, refreshComplaints, showToast, adminPage, onBack }) {
  console.log("showToast:", showToast);
  const [filter, setFilter] = useState("ALL");
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    high: 0,
    veryHigh: 0,
  });
  const [loadingId, setLoadingId] = useState(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState({ show: false, complaint: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  const fetchAdminNotifications = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch("http://localhost:5000/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch("http://localhost:5000/api/admin/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAdminNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const clearNotifications = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch("http://localhost:5000/api/admin/notifications/clear-all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const handleNotificationClick = (complaintId) => {
    setHighlightedId(complaintId);
    setShowNotifications(false);
    
    // Scroll to the complaint
    setTimeout(() => {
      const element = document.getElementById(`complaint-${complaintId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    // Remove highlight after 1.5s
    setTimeout(() => {
      setHighlightedId(null);
    }, 2000);
  };

  const handleReview = async (action) => {
    if (action === "Reject" && !rejectionReason.trim()) {
      showToast("Please provide a reason for rejection", "error");
      return;
    }

    setIsReviewing(true);
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(`http://localhost:5000/api/admin/review-proof/${reviewModal.complaint._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason: rejectionReason })
      });

      if (res.ok) {
        showToast(`Proof ${action.toLowerCase()}d successfully`);
        setReviewModal({ show: false, complaint: null });
        setRejectionReason("");
        refreshComplaints();
      } else {
        showToast("Failed to process review", "error");
      }
    } catch (err) {
      console.error("Review failed", err);
      showToast("Error processing review", "error");
    } finally {
      setIsReviewing(false);
    }
  };

  const nudgeCollector = async (id) => {
    const token = localStorage.getItem("adminToken");
    setLoadingId(id);

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/nudge-collector/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send nudge");
      }

      showToast("Nudge sent to collector!");
    } catch (err) {
      console.error("Nudge failed", err);
      showToast(err.message || "Failed to send nudge", "error");
    } finally {
      setLoadingId(null);
    }
  };


  const markUnresolved = async (id) => {
    const token = localStorage.getItem("adminToken");
    setLoadingId(id);

    try {
      const res = await fetch(
        `http://localhost:5000/api/complaints/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "Pending" }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      refreshComplaints();
      showToast("Complaint marked as pending again");

    } catch (err) {
      console.error("Failed to update status", err);
      showToast("Failed to update status", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const updatePriority = async (id, newPriority) => {
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(
        `http://localhost:5000/api/complaints/update-priority/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priority: newPriority }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update priority");
      }

      refreshComplaints();
      showToast("Priority updated successfully");
    } catch (err) {
      console.error("Priority update error:", err);
      alert("Failed to update priority");
    }
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    setLoadingId(id); 

    try {
      const res = await fetch(
        `http://localhost:5000/api/complaints/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      refreshComplaints();
      showToast("Complaint deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete complaint", "error");
    } finally {
      setLoadingId(null); 
    }
  };

  const resolveAllComplaints = async () => {
    if (!window.confirm("Mark all pending complaints as resolved?")) {
      return;
    }

    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/resolve-all",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Resolve all failed");
      }

      refreshComplaints();
      showToast("All pending complaints marked as resolved");

    } catch (err) {
      console.error("Resolve all error:", err);
      showToast("Failed to resolve complaints", "error");
    }
  };

  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    c => c.status?.toLowerCase() === "pending"
  ).length;

  const resolvedComplaints = complaints.filter(
    c => c.status?.toLowerCase() === "resolved"
  ).length;

  const highPriorityComplaints = complaints.filter(
    c => c.priority === "High"
  ).length;

  const veryHighPriorityComplaints = complaints.filter(
    c => c.priority === "Very High"
  ).length;

  const locationCounts = {};

  complaints.forEach((c) => {
    const locationKey = `${c.latitude}, ${c.longitude}`;
    locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
  });

  const uniqueLocations = Object.keys(locationCounts).length;

  let topLocation = "N/A";
  let maxCount = 0;

  for (const location in locationCounts) {
    if (locationCounts[location] > maxCount) {
      maxCount = locationCounts[location];
      topLocation = location;
    }
  }

  useEffect(() => {

    if (adminPage !== "dashboard") return;

    let start = 0;
    const duration = 500;
    const increment = 20;
    const steps = duration / increment;

    const totalStep = totalComplaints / steps;
    const pendingStep = pendingComplaints / steps;
    const resolvedStep = resolvedComplaints / steps;
    const highStep = highPriorityComplaints / steps;
    const veryHighStep = veryHighPriorityComplaints / steps;

    const interval = setInterval(() => {
      start++;

      setAnimatedStats({
        total: Math.min(Math.floor(totalStep * start), totalComplaints),
        pending: Math.min(Math.floor(pendingStep * start), pendingComplaints),
        resolved: Math.min(Math.floor(resolvedStep * start), resolvedComplaints),
        high: Math.min(Math.floor(highStep * start), highPriorityComplaints),
        veryHigh: Math.min(Math.floor(veryHighStep * start), veryHighPriorityComplaints),
      });

      if (start >= steps) clearInterval(interval);

    }, increment);

    return () => clearInterval(interval);

  }, [totalComplaints, pendingComplaints, resolvedComplaints, highPriorityComplaints, veryHighPriorityComplaints, adminPage]);

  const filteredComplaints = complaints
    .filter((c) => {
      if (filter === "ALL") return true;
      return c.status === filter;
    })
    .sort((a, b) => {
      const pMap = { "Very High": 3, "High": 2, "Normal": 1 };
      const pA = pMap[a.priority] || 0;
      const pB = pMap[b.priority] || 0;
      
      if (pA !== pB) return pB - pA;

      if (a.status === "Pending" && b.status === "Resolved") return -1;
      if (a.status === "Resolved" && b.status === "Pending") return 1;

      return 0;
    });

  const deleteAllComplaints = async () => {
    if (!window.confirm("⚠️ This will delete ALL complaints. Are you sure?")) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    setDeleteAllLoading(true); // ✅ start loading

    try {
      const res = await fetch(
        "http://localhost:5000/api/complaints/delete-all",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Delete all failed");
      }

      refreshComplaints();
      showToast("All complaints deleted");
    } catch (err) {
      console.error("Delete all error:", err);
      showToast("Failed to delete all complaints", "error");
    } finally {
      setDeleteAllLoading(false); // ✅ stop loading
    }
  };

  const exportToCSV = () => {
    if (!complaints.length) return;

    const headers = [
      "Description",
      "Status",
      "Priority",
      "Latitude",
      "Longitude",
      "Created At"
    ];

    const rows = complaints.map(c => [
      `"${c.description}"`,
      c.status,
      c.priority || "Normal",
      c.latitude,
      c.longitude,
      new Date(c.createdAt).toLocaleString()
    ]);

    const csvContent =
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "complaints_report.csv";
    link.click();
  };

  const chartData = useMemo(() => [
    { name: "Pending", value: pendingComplaints },
    { name: "Resolved", value: resolvedComplaints },
    { name: "High", value: highPriorityComplaints },
    { name: "Critical", value: veryHighPriorityComplaints }
  ], [pendingComplaints, resolvedComplaints, highPriorityComplaints, veryHighPriorityComplaints]);

  let hotspot = null;

  if (complaints.length > 1) {
    const threshold = 0.002; 

    for (let i = 0; i < complaints.length; i++) {
      let count = 1;

      for (let j = i + 1; j < complaints.length; j++) {
        const latDiff = Math.abs(complaints[i].latitude - complaints[j].latitude);
        const lonDiff = Math.abs(complaints[i].longitude - complaints[j].longitude);

        if (latDiff < threshold && lonDiff < threshold) {
          count++;
        }
      }

      if (count >= 3) {
        hotspot = {
          address: complaints[i].address,
          count: count
        };
        break;
      }
    }
  }

  const weeklyData = useMemo(() => {
    const today = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const formatted = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short"
      });

      const count = complaints.filter(c => {
        const complaintDate = new Date(c.createdAt);
        return complaintDate.toDateString() === d.toDateString();
      }).length;

      days.push({
        date: formatted,
        complaints: count
      });
    }

    return days;
  }, [complaints]);

  return (
    <div>

      {adminPage === "dashboard" && (
        <>
      <div className="dashboard-header" style={{ position: "relative" }}>
        <div className="dashboard-title">
          <h2>Admin Dashboard</h2>
          <p>Monitor complaints, track hotspots, and manage waste reports</p>
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {/* Admin Notifications */}
          <div style={{ position: "relative" }}>
            <button 
              className="role-btn admin-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAllAsRead();
              }}
              style={{ 
                padding: "10px", 
                borderRadius: "50%", 
                width: "45px", 
                height: "45px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                position: "relative"
              }}
            >
              <FaBell />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ 
                  position: "absolute", 
                  top: "-5px", 
                  right: "-5px", 
                  background: "#ef4444", 
                  color: "white", 
                  borderRadius: "50%", 
                  width: "18px", 
                  height: "18px", 
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  border: "2px solid var(--body-bg)"
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="stat-card" style={{ 
                position: "absolute", 
                top: "55px", 
                right: "0", 
                width: "350px", 
                zIndex: "1000", 
                flexDirection: "column", 
                padding: "20px",
                maxHeight: "450px",
                overflowY: "auto",
                background: "var(--card-bg)",
                boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
                border: "1px solid var(--border-color)",
                opacity: 1,
                backdropFilter: "none",
                textAlign: "left"
              }}>
                <div style={{ 
                  margin: "0 0 15px 0", 
                  borderBottom: "1px solid var(--border-color)", 
                  paddingBottom: "12px", 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px"
                }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-color)", whiteSpace: "nowrap" }}>Notifications</h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotifications();
                      }}
                      style={{ 
                        flexShrink: 0,
                        background: "rgba(239, 68, 68, 0.15)", 
                        border: "none", 
                        color: "#ef4444", 
                        fontSize: "10px", 
                        fontWeight: "800",
                        cursor: "pointer",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        transition: "all 0.2s"
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="notification-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {notifications.length === 0 ? (
                    <p style={{ textAlign: "center", opacity: 0.5, fontSize: "14px", padding: "20px 0" }}>No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n._id}
                        onClick={() => handleNotificationClick(n.complaintId)}
                        style={{ 
                          padding: "12px", 
                          borderRadius: "10px", 
                          background: n.read ? "rgba(0,0,0,0.02)" : "rgba(59, 130, 246, 0.05)",
                          borderLeft: `4px solid ${n.type === 'new_complaint' ? '#3b82f6' : '#22c55e'}`,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: !n.read ? "0 4px 12px rgba(59, 130, 246, 0.1)" : "none"
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: n.read ? "400" : "600", color: "var(--text-color)" }}>{n.message}</p>
                        <span style={{ fontSize: "10px", opacity: 0.5, marginTop: "5px", display: "block" }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={onBack} className="role-btn admin-btn" style={{ padding: "10px 20px" }}>
            ← Back
          </button>
        </div>
      </div>

      {hotspot && (
        <div className="hotspot-warning">
          <FaExclamationTriangle />
          <div>
            ⚠ Garbage hotspot detected near <strong>{hotspot.address}</strong>  
            <br />
            <span style={{ fontSize: "14px", opacity: 0.9 }}>{hotspot.count} complaints reported in this area</span>
          </div>
        </div>
      )}

        <div className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon total">
                <FaClipboardList />
              </div>
              <div className="stat-content">
                <h3>{animatedStats.total}</h3>
                <p>Total Reports</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <FaClock />
              </div>
              <div className="stat-content">
                <h3>{animatedStats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon resolved">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <h3>{animatedStats.resolved}</h3>
                <p>Resolved</p>
              </div>
            </div>

            <div className="stat-card high">
              <div className="stat-icon high">
                <FaExclamationTriangle />
              </div>
              <div className="stat-content">
                <h3>{animatedStats.high}</h3>
                <p>High Priority</p>
              </div>
            </div>

            <div className="stat-card very-high">
              <div className="stat-icon very-high">
                <FaExclamationTriangle style={{ animation: "pulse 1.5s infinite" }} />
              </div>
              <div className="stat-content">
                <h3>{animatedStats.veryHigh}</h3>
                <p>Very High</p>
              </div>
            </div>

        </div>
        
        <div className="location-insight" style={{ marginBottom: "30px", opacity: 0.8 }}>
          <span>📍 <strong>Hotspot:</strong> {topLocation}</span>
          <span style={{ marginLeft: "20px" }}>📊 <strong>Unique Spots:</strong> {uniqueLocations}</span>
        </div>

        {complaints.length > 0 && (
          <div style={{ marginBottom: "30px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>

            <button
              className="role-btn admin-btn"
              onClick={exportToCSV}
              style={{ padding: "10px 20px", fontSize: "14px" }}
            >
              Export CSV
            </button>

            <button
              className="role-btn"
              onClick={resolveAllComplaints}
              style={{ padding: "10px 20px", fontSize: "14px" }}
            >
              Resolve All
            </button>

            <button
              className="role-btn admin-btn"
              onClick={deleteAllComplaints}
              disabled={deleteAllLoading}
              style={{ padding: "10px 20px", fontSize: "14px", backgroundColor: "#ef4444" }}
            >
              {deleteAllLoading ? "Cleaning..." : "Delete All"}
            </button>

          </div>
        )}
              </>
    )}
    {adminPage === "analytics" && (
      <div className="stats-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>

        <div className="stat-card" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <h3 className="dashboard-section-title" style={{ marginTop: "0" }}>Analytics Overview</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "var(--chart-text)" }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--chart-text)" }} />
              <Tooltip
                contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "12px" }}
              />
              <Bar dataKey="value" fill="var(--chart-bar)" radius={[10, 10, 0, 0]} animationDuration={500} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <h3 className="dashboard-section-title" style={{ marginTop: "0" }}>Weekly Trends</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={weeklyData}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "var(--chart-text)" }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--chart-text)" }} />
              <Tooltip
                contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "12px" }}
              />
              <Line type="linear" dataKey="complaints" stroke="var(--chart-line)" strokeWidth={4} dot={{ r: 6 }} animationDuration={500} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    )}
    {adminPage === "heatmap" && (
      <div className="stat-card" style={{ flexDirection: "column", padding: "0", overflow: "hidden", minHeight: "500px" }}>
        <div style={{ padding: "20px" }}>
          <h3 className="dashboard-section-title" style={{ marginTop: "0" }}>Waste Heatmap</h3>
        </div>
        <AdminMapDashboard complaints={complaints} />
      </div>
    )}
      {adminPage === "complaints" && (
        <>
        <div className="filter-bar">
          <button className={`filter-btn ${filter === "ALL" ? "active" : ""}`} onClick={() => setFilter("ALL")}>All</button>
          <button className={`filter-btn ${filter === "Pending" ? "active" : ""}`} onClick={() => setFilter("Pending")}>Pending</button>
          <button className={`filter-btn ${filter === "Resolved" ? "active" : ""}`} onClick={() => setFilter("Resolved")}>Resolved</button>
        </div>

         {filteredComplaints.map((c) => (
               <div
                 id={`complaint-${c._id}`}
                 className={`complaint-card ${
                   c.priority === "Very High" ? "very-high-priority-card" : 
                   c.priority === "High" ? "high-priority-card" : ""
                 }`}
                 style={{
                   transition: "all 0.5s ease",
                   boxShadow: highlightedId === c._id 
                    ? "0 0 25px #3b82f6" 
                    : "none",
                   border: highlightedId === c._id 
                    ? "2px solid #3b82f6" 
                    : "1px solid var(--border-color)",
                   transform: highlightedId === c._id ? "scale(1.02)" : "scale(1)"
                 }}
                 key={c._id}
               >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 className="card-description">{c.description}</h4>
                    <span className={`status-badge ${c.status === "Resolved" ? "status-resolved" : "status-pending"}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.priority === "Very High" && (
                    <span className="status-badge priority-very-high" style={{ animation: "pulse 1s infinite" }}>
                      CRITICAL
                    </span>
                  )}
                  {c.priority === "High" && (
                    <span className="status-badge priority-high">
                      HIGH
                    </span>
                  )}
                 </div>
                 <span className="card-date">
                   {new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                 </span>
 
                 {c.status === "Pending" && (
                   <div style={{ marginTop: "10px" }}>
                     <select 
                       className="auth-input" 
                       value={c.priority || "Normal"} 
                       onChange={(e) => updatePriority(c._id, e.target.value)}
                       style={{ padding: "8px 12px", fontSize: "12px", width: "auto", height: "auto", borderRadius: "8px" }}
                     >
                       <option value="Normal">Normal</option>
                       <option value="High">High</option>
                       <option value="Very High">Very High</option>
                     </select>
                   </div>
                 )}
 
                 <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <p className="label-text">Location</p>
                    <p className="card-address">{c.address}</p>
                    
                    <div className="action-row" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                      {c.status === "Pending" ? (
                        <button
                          className="role-btn"
                          style={{ padding: "10px 20px", fontSize: "14px", backgroundColor: "#3b82f6" }} // Distinct blue for nudge
                          onClick={() => nudgeCollector(c._id)}
                          disabled={loadingId === c._id}
                        >
                          {loadingId === c._id ? "Working..." : "Nudge Collector"}
                        </button>
                      ) : (
                        <button
                          className="role-btn admin-btn"
                          style={{ padding: "10px 20px", fontSize: "14px" }}
                          onClick={() => markUnresolved(c._id)}
                          disabled={loadingId === c._id}
                        >
                          Re-open
                        </button>
                      )}
                      <button
                        className="role-btn admin-btn"
                        style={{ padding: "10px 20px", fontSize: "14px", backgroundColor: "transparent", border: "1px solid rgba(0,0,0,0.1)", color: "#ef4444" }}
                        onClick={() => deleteComplaint(c._id)}
                        disabled={loadingId === c._id}
                      >
                        Delete
                      </button>
                    </div>

                    {c.proofStatus && c.proofStatus !== "None" && (
                      <div style={{ marginTop: "20px" }}>
                         <p className="label-text">Proof of Work</p>
                         <div style={{ 
                           display: "flex", 
                           alignItems: "center", 
                           gap: "10px", 
                           marginBottom: "10px",
                           fontSize: "13px"
                         }}>
                            {c.proofStatus === "Pending Review" && <><FaClock style={{ color: "#f59e0b" }} /> <span>Pending Review</span></>}
                            {c.proofStatus === "Approved" && <><FaCheckCircle style={{ color: "#22c55e" }} /> <span style={{ color: "#22c55e" }}>Approved</span></>}
                            {c.proofStatus === "Rejected" && <><FaExclamationTriangle style={{ color: "#ef4444" }} /> <span style={{ color: "#ef4444" }}>Rejected</span></>}
                         </div>
                         <button 
                           className="role-btn" 
                           onClick={() => setReviewModal({ show: true, complaint: c })}
                           style={{ padding: "8px 16px", fontSize: "13px" }}
                         >
                           {c.proofStatus === "Pending Review" ? "Review Proof" : "View Proof"}
                         </button>
                      </div>
                    )}
                  </div>

                  <div className="map-preview">
                    <iframe
                      title="location-map"
                      width="100%"
                      height="150"
                      style={{ border: 0, borderRadius: "16px" }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${c.latitude},${c.longitude}&z=15&output=embed`}
                    ></iframe>
                  </div>
                </div>

              {c.imageUrl && (
                 <div style={{ marginTop: "20px" }}>
                   <p className="label-text">Attachment</p>
                    <img
                      src={`http://localhost:5000/${c.imageUrl}`}
                      alt="complaint"
                      style={{ borderRadius: "16px", maxWidth: "400px", width: "100%", border: "1px solid rgba(0,0,0,0.05)" }}
                    />
                  </div>
                )}
              </div>
            ))
          }
        </>
      )}
      {reviewModal.show && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "2000",
          backdropFilter: "blur(4px)"
        }}>
          <div className="stat-card" style={{ 
            width: "90%", 
            maxWidth: "600px", 
            flexDirection: "column", 
            padding: "30px",
            animation: "slideUp 0.3s ease",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "var(--card-bg)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ marginBottom: "10px", color: "var(--text-color)" }}>Proof Review</h3>
            <p style={{ color: "var(--text-color)", opacity: 0.9, fontSize: "14px", marginBottom: "20px" }}>
              Review the photo submitted by the collector for <strong>{reviewModal.complaint.description}</strong>.
            </p>
            
            <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", marginBottom: "20px" }}>
              <img 
                src={`http://localhost:5000/${reviewModal.complaint.proofImageUrl}`} 
                alt="Proof" 
                style={{ width: "100%", maxHeight: "400px", objectFit: "contain", background: "rgba(0,0,0,0.02)" }} 
              />
            </div>

            {reviewModal.complaint.proofStatus === "Pending Review" ? (
              <>
                <div className="auth-form-group">
                  <label>Rejection Reason (only if rejecting)</label>
                  <textarea 
                    className="auth-input" 
                    placeholder="Why are you rejecting this proof?"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ minHeight: "80px", paddingTop: "12px", background: "var(--input-bg)" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    className="role-btn admin-btn" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setReviewModal({ show: false, complaint: null });
                      setRejectionReason("");
                    }}
                  >
                    Close
                  </button>
                  <button 
                    className="role-btn" 
                    style={{ flex: 1, backgroundColor: "#ef4444" }}
                    onClick={() => handleReview("Reject")}
                    disabled={isReviewing}
                  >
                    Reject
                  </button>
                  <button 
                    className="role-btn" 
                    style={{ flex: 1 }}
                    onClick={() => handleReview("Approve")}
                    disabled={isReviewing}
                  >
                    {isReviewing ? "Processing..." : "Approve"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ padding: "15px", borderRadius: "12px", background: "rgba(0,0,0,0.02)" }}>
                   <p style={{ margin: "0", fontSize: "14px" }}>
                     Status: <strong>{reviewModal.complaint.proofStatus}</strong>
                   </p>
                   {reviewModal.complaint.rejectionReason && (
                     <p style={{ margin: "10px 0 0", fontSize: "14px", color: "#ef4444" }}>
                       Reason: {reviewModal.complaint.rejectionReason}
                     </p>
                   )}
                </div>
                <button 
                  className="role-btn admin-btn" 
                  onClick={() => setReviewModal({ show: false, complaint: null })}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;