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
import { FaClipboardList, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";


function AdminDashboard({ complaints, refreshComplaints, showToast, adminPage, onBack }) {
  console.log("showToast:", showToast);
  const [filter, setFilter] = useState("ALL");
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    high: 0,
  });
  const [loadingId, setLoadingId] = useState(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const updateStatus = async (id) => {
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
          body: JSON.stringify({ status: "Resolved" }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      refreshComplaints();
      showToast("Complaint marked as resolved");
    } catch (err) {
      console.error("Failed to update status", err);
      showToast("Failed to update status", "error");
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

    const interval = setInterval(() => {
      start++;

      setAnimatedStats({
        total: Math.min(Math.floor(totalStep * start), totalComplaints),
        pending: Math.min(Math.floor(pendingStep * start), pendingComplaints),
        resolved: Math.min(Math.floor(resolvedStep * start), resolvedComplaints),
        high: Math.min(Math.floor(highStep * start), highPriorityComplaints),
      });

      if (start >= steps) clearInterval(interval);

    }, increment);

    return () => clearInterval(interval);

  }, [totalComplaints, pendingComplaints, resolvedComplaints, highPriorityComplaints, adminPage]);

  const filteredComplaints = complaints
    .filter((c) => {
      if (filter === "ALL") return true;
      return c.status === filter;
    })
    .sort((a, b) => {

      if (a.priority === "High" && b.priority !== "High") return -1;
      if (a.priority !== "High" && b.priority === "High") return 1;

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
    { name: "High Priority", value: highPriorityComplaints }
  ], [pendingComplaints, resolvedComplaints, highPriorityComplaints]);

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
      <div className="dashboard-header">

        <div className="dashboard-title">
          <h2>Admin Dashboard</h2>
          <p>Monitor complaints, track hotspots, and manage waste reports</p>
        </div>

        <button
          onClick={onBack}
          className="resolve-btn"
        >
          ← Back
        </button>

      </div>

        {hotspot && (
          <div
            style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontWeight: "600",
            color: "#664d03"
          }}
          >
            ⚠ Garbage hotspot detected near <strong>{hotspot.address}</strong>  
            <br />
            {hotspot.count} complaints reported in this area
          </div>
        )}

        <div className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon total">
                <FaClipboardList />
              </div>
              <div>
                <h3>{animatedStats.total}</h3>
                <p>Total Complaints</p>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-icon pending">
                <FaClock />
              </div>
              <div>
                <h3>{animatedStats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>

            <div className="stat-card resolved">
              <div className="stat-icon resolved">
                <FaCheckCircle />
              </div>
              <div>
                <h3>{animatedStats.resolved}</h3>
                <p>Resolved</p>
              </div>
            </div>

            <div className="stat-card high">
              <div className="stat-icon high">
                <FaExclamationTriangle />
              </div>
              <div>
                <h3>{animatedStats.high}</h3>
                <p>High Priority</p>
              </div>
            </div>

        </div>
        
        <div className="location-insight">
          <p>
            📍 <strong>Most Reported Location:</strong> {topLocation}
          </p>
          <p>
            📊 <strong>Total Unique Locations:</strong> {uniqueLocations}
          </p>
        </div>

        {complaints.length > 0 && (
          <div style={{ marginBottom: "20px", textAlign: "right" }}>

            <button
              className="resolve-btn"
              onClick={exportToCSV}
              style={{ marginRight: "10px" }}
            >
              Export as CSV
            </button>

            <button
              className="resolve-btn"
              onClick={resolveAllComplaints}
              style={{ marginRight: "10px", backgroundColor: "#ffc107", color: "#000" }}
            >
              Mark All as Resolved
            </button>

            <button
              className="resolve-btn delete"
              onClick={deleteAllComplaints}
              disabled={deleteAllLoading}
            >
              {deleteAllLoading ? "Deleting All..." : "Delete All Complaints"}
            </button>

          </div>
        )}
              </>
    )}
    {adminPage === "analytics" && (
      <div className="stats-container">

        <div className="chart-container">
          <h3 style={{ marginBottom: "15px" }}>
            Complaint Analytics Overview
          </h3>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
            >
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                interval={0}
                angle={-10}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: "var(--chart-text)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card-bg)",
                  border: "none",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="value" fill="var(--chart-bar)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 style={{ marginBottom: "15px" }}>
            Weekly Complaint Trend
          </h3>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={weeklyData}
              margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
            >
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                interval={0}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: "var(--chart-text)" }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="complaints"
                stroke="var(--chart-line)"
                strokeWidth={3}
                dot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    )}
    {adminPage === "heatmap" && (
      <div className="chart-container">

        <h3 style={{ marginBottom: "15px" }}>
          Garbage Complaint Heatmap
        </h3>

        <AdminMapDashboard complaints={complaints} />

      </div>
    )}
      {adminPage === "complaints" && (
        <>
        <div className="filter-bar">
          <button
            className={filter === "ALL" ? "active-filter" : ""}
            onClick={() => setFilter("ALL")}
          >
            All
          </button>

          <button
            className={filter === "Pending" ? "active-filter" : ""}
            onClick={() => setFilter("Pending")}
          >
            Pending
          </button>

          <button
            className={filter === "Resolved" ? "active-filter" : ""}
            onClick={() => setFilter("Resolved")}
          >
            Resolved
          </button>
        </div>

        <button
          className="resolve-btn"
          onClick={() => setShowMap(!showMap)}
          style={{ marginBottom: "20px" }}
        >
          {showMap ? "Show Complaint List" : "Show Map View"}
        </button>

        {showMap ? (
          <AdminMapDashboard complaints={complaints} />
        ) : (
          filteredComplaints.map((c) => (
              <div
                className={`complaint-card ${
                  c.priority === "High" ? "high-priority-card" : ""
                }`}
                key={c._id}
              >
                <p><strong>Description:</strong> {c.description}</p>

                {c.aiDetectedGarbage && (
                  <p style={{ color: "#dc3545", fontWeight: "600", marginTop: "6px" }}>
                    🤖 AI detected garbage in this image
                  </p>
                )}
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge ${
                      c.status === "Resolved" ? "status-resolved" : "status-pending"
                    }`}
                  >
                    {c.status}
                  </span>
                </p>

                <p>
                  <strong>Priority:</strong>{" "}
                  {c.status === "Pending" ? (
                    <select
                      value={c.priority || "Normal"}
                      onChange={(e) => updatePriority(c._id, e.target.value)}
                      style={{
                        padding: "4px",
                        borderRadius: "6px",
                        marginLeft: "6px"
                      }}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  ) : (
                    <span
                      className={`priority-badge ${
                        c.priority === "High" ? "priority-high" : "priority-normal"
                      }`}
                    >
                      {c.priority || "Normal"}
                    </span>
                  )}
                </p>

                {c.aiDetectedKeyword && (
                  <p style={{ color: "#dc3545", fontWeight: "600", marginTop: "6px" }}>
                    ⚠ AI flagged due to: "{c.aiDetectedKeyword}"
                  </p>
                )}

                <p><strong>Address:</strong> {c.address}</p>

                <div className="action-row">
                  {c.status === "Pending" ? (
                    <button
                      className="resolve-btn"
                      onClick={() => updateStatus(c._id)}
                      disabled={loadingId === c._id}
                    >
                      {loadingId === c._id ? "Updating..." : "Mark as Resolved"}
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="resolve-btn"
                        style={{ backgroundColor: "#ffc107", color: "#000" }}
                        onClick={() => markUnresolved(c._id)}
                        disabled={loadingId === c._id}
                      >
                        {loadingId === c._id ? "Updating..." : "Mark as Unresolved"}
                      </button>

                      <button
                        className="resolve-btn"
                        style={{ backgroundColor: "#dc3545" }}
                        onClick={() => deleteComplaint(c._id)}
                        disabled={loadingId === c._id}
                      >
                        {loadingId === c._id ? "Deleting..." : "Delete Complaint"}
                      </button>
                    </div>
                  )}
                </div>
                {c.imageUrl && (
                  <img
                    src={`http://localhost:5000/${c.imageUrl}`}
                    alt="complaint"
                    className="complaint-image"
                  />
                )}
                <div className="map-preview">
                  <iframe
                    title="location-map"
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: "8px", marginTop: "10px" }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${c.latitude},${c.longitude}&z=15&output=embed`}
                  ></iframe>
                </div>
              </div>
            ))
          )}
            </>
)}
    </div>
  );
}

export default AdminDashboard;