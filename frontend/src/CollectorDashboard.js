import React, { useState, useEffect } from "react";
import { FaTruck, FaMapMarkedAlt, FaBullseye, FaBell, FaUpload, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import AdminMapDashboard from "./AdminMapDashboard"; // Reuse the map component

function CollectorDashboard({ complaints, onLogout, showToast }) {
  const [collectorData, setCollectorData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [uploadModal, setUploadModal] = useState({ show: false, complaint: null });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("collectorData"));
    setCollectorData(data);
    
    if (data?.id) {
      fetchNotifications(data.id);
    }
    
    // Start tracking location
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Update location on server
          updateLocationOnServer(data?.id, latitude, longitude);
        },
        (error) => console.error("Error tracking location:", error),
        { enableHighAccuracy: true }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const fetchNotifications = async (collectorId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/collector/notifications/${collectorId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markReadAll = async () => {
    if (!collectorData?.id) return;
    try {
      await fetch(`http://localhost:5000/api/collector/notifications/read-all/${collectorData.id}`, { method: "PUT" });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!collectorData?.id) return;
    if (!window.confirm("Clear all notifications?")) return;
    
    try {
      await fetch(`http://localhost:5000/api/collector/notifications/clear-all/${collectorData.id}`, { method: "DELETE" });
      setNotifications([]);
      showToast("Notifications cleared", "success");
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const markNotificationRead = async (notifId) => {
    try {
      await fetch(`http://localhost:5000/api/collector/notifications/read/${notifId}`, { method: "PUT" });
      setNotifications(notifications.map(n => n._id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      showToast("Please drop an image file", "error");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !uploadModal.complaint) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("proofImage", selectedFile);

    try {
      const token = localStorage.getItem("collectorToken");
      const res = await fetch(`http://localhost:5000/api/complaints/upload-proof/${uploadModal.complaint._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        showToast("Proof uploaded successfully! Pending admin review.", "success");
        setUploadModal({ show: false, complaint: null });
        setSelectedFile(null);
        setPreviewUrl(null);
        // Refresh complaints (assuming they are passed from parent)
        // If they are not auto-refreshed, we might need a refresh function
      } else {
        const errData = await res.json();
        showToast(errData.message || "Upload failed", "error");
      }
    } catch (err) {
      console.error("Upload failed", err);
      showToast("Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const updateLocationOnServer = async (id, lat, lng) => {
    if (!id) return;
    try {
      await fetch("http://localhost:5000/api/collector/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, latitude: lat, longitude: lng })
      });
    } catch (err) {
      console.error("Failed to update location on server", err);
    }
  };

  const handleNavigate = (complaint) => {
    if (!complaint.latitude || !complaint.longitude) {
      showToast("Location data not available for this spot", "error");
      return;
    }

    const targetLat = complaint.latitude;
    const targetLng = complaint.longitude;
    
    // Construct Google Maps URL (works on both mobile and desktop)
    // We use the direct search URL which is more reliable for simple coordinates
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLng}`;
    
    window.open(mapsUrl, "_blank");
  };

  const pendingComplaints = complaints.filter(c => c.status === "Pending");
  const urgentComplaints = pendingComplaints.filter(c => c.priority === "Very High" || c.priority === "High");

  return (
    <div className="collector-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Collector Hub</h2>
          <p>Welcome, {collectorData?.name || "Driver"} | Vehicle: {collectorData?.vehicleNumber || "N/A"}</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <button 
              className="role-btn admin-btn" 
              onClick={() => {
                const newShow = !showNotifications;
                setShowNotifications(newShow);
                if (newShow && notifications.some(n => !n.read)) {
                  markReadAll();
                }
              }}
              style={{ padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
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
                width: "350px", // Increased width for more breathing room
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
                textAlign: "left" // Override global center-align
              }}>
                <div style={{ 
                  margin: "0 0 15px 0", 
                  borderBottom: "1px solid var(--border-color)", 
                  paddingBottom: "12px", 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px" // More gap
                }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-color)", whiteSpace: "nowrap" }}>Notifications</h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllNotifications();
                      }}
                      style={{ 
                        flexShrink: 0, // Prevent shrinking
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
                      onMouseOver={(e) => {
                        e.target.style.background = "#ef4444";
                        e.target.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "rgba(239, 68, 68, 0.15)";
                        e.target.style.color = "#ef4444";
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: "20px", textAlign: "center", opacity: 0.6 }}>No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      style={{ 
                        padding: "12px", 
                        borderRadius: "10px", 
                        background: n.read ? "transparent" : "rgba(34, 197, 94, 0.05)",
                        marginBottom: "10px",
                        border: "1px solid var(--border-color)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: n.type === "success" 
                          ? "0 0 15px rgba(34, 197, 94, 0.15)" // Green glow
                          : "0 0 15px rgba(239, 68, 68, 0.15)", // Red glow
                        position: "relative",
                        overflow: "hidden"
                      }}
                      onClick={() => !n.read && markNotificationRead(n._id)}
                    >
                      {/* Status side bar for extra emphasis */}
                      <div style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "4px",
                        background: n.type === "success" ? "#22c55e" : "#ef4444"
                      }} />
                      
                      <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.4", fontWeight: n.read ? "400" : "600" }}>{n.message}</p>
                      <p style={{ margin: "5px 0 0", fontSize: "10px", opacity: 0.5 }}>{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FaTruck />
          </div>
          <div className="stat-content">
            <h3>{pendingComplaints.length}</h3>
            <p>Assigned Spots</p>
          </div>
        </div>
        <div className="stat-card very-high">
          <div className="stat-icon very-high">
            <FaBullseye />
          </div>
          <div className="stat-content">
            <h3>{urgentComplaints.length}</h3>
            <p>Critical Hotspots</p>
          </div>
        </div>
      </div>

      <div className="stat-card" style={{ flexDirection: "column", padding: "0", overflow: "hidden", minHeight: "450px", marginTop: "20px" }}>
        <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h3 style={{ fontSize: "18px" }}><FaMapMarkedAlt /> Mission Route</h3>
          <button 
            className="role-btn" 
            onClick={() => setIsNavigating(!isNavigating)}
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            {isNavigating ? "Stop Navigation" : "Start Smart Route"}
          </button>
        </div>
        <div style={{ flex: 1, width: "100%" }}>
           {/* We pass the filtered complaints to the map */}
           <AdminMapDashboard complaints={pendingComplaints} collectorLocation={currentLocation} isNavigating={isNavigating} />
        </div>
      </div>

      <div>
        <h3 className="dashboard-section-title">Pending Collections</h3>
        <div className="complaints-list">
          {pendingComplaints.map(c => (
            <div key={c._id} className={`complaint-card ${c.priority === "Very High" ? "very-high-priority-card" : c.priority === "High" ? "high-priority-card" : ""}`}>
               <h4 style={{ margin: "0 0 10px 0" }}>{c.description}</h4>
                <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "15px" }}>{c.address}</p>
                
                {c.proofStatus && c.proofStatus !== "None" && (
                  <div style={{ 
                    marginBottom: "15px", 
                    padding: "10px", 
                    borderRadius: "10px", 
                    background: "rgba(0,0,0,0.02)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px"
                  }}>
                    {c.proofStatus === "Pending Review" && <><FaClock style={{ color: "#f59e0b" }} /> <span>Pending Review</span></>}
                    {c.proofStatus === "Approved" && <><FaCheckCircle style={{ color: "#22c55e" }} /> <span style={{ color: "#22c55e", fontWeight: "600" }}>Approved</span></>}
                    {c.proofStatus === "Rejected" && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FaTimesCircle style={{ color: "#ef4444" }} /> 
                          <span style={{ color: "#ef4444", fontWeight: "600" }}>Rejected</span>
                        </div>
                        {c.rejectionReason && <p style={{ margin: "5px 0 0 24px", fontSize: "11px", opacity: 0.7 }}>Reason: {c.rejectionReason}</p>}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    className="role-btn admin-btn" 
                    style={{ flex: 1, padding: "10px" }}
                    onClick={() => handleNavigate(c)}
                  >
                    Navigate
                  </button>
                  <button 
                    className="role-btn" 
                    style={{ flex: 1, padding: "10px" }}
                    onClick={() => setUploadModal({ show: true, complaint: c })}
                  >
                    <FaUpload style={{ marginRight: "8px" }} />
                    {c.proofStatus === "Rejected" ? "Re-upload" : "Proof"}
                  </button>
                </div>
            </div>
          ))}
        </div>
      </div>

      {uploadModal.show && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          background: "rgba(0,0,0,0.7)", // Slightly darker overlay
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "2000",
          backdropFilter: "blur(4px)"
        }}>
          <div className="stat-card" style={{ 
            width: "90%", 
            maxWidth: "500px", 
            flexDirection: "column", 
            padding: "30px",
            animation: "slideUp 0.3s ease",
            background: "var(--card-bg)", // Ensure it's using the theme color
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", // Stronger shadow for depth
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ marginBottom: "10px", color: "var(--text-color)" }}>Upload Proof</h3>
            <p style={{ color: "var(--text-color)", opacity: 0.9, fontSize: "14px", marginBottom: "25px" }}>
              Please take/upload a photo of the cleared area for <strong>{uploadModal.complaint.description}</strong>.
            </p>
            
            <div 
              style={{ 
                border: "2px dashed var(--border-color)", // Use theme border
                borderRadius: "16px", 
                width: "100%", 
                height: "180px", 
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.02)",
                overflow: "hidden",
                cursor: "pointer",
                marginBottom: "25px",
                transition: "all 0.3s ease",
                color: "var(--text-color)" // Ensure text color is inherited
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.style.background = "rgba(31, 143, 85, 0.05)";
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.background = "rgba(0,0,0,0.02)";
              }}
              onDrop={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.background = "rgba(0,0,0,0.02)";
                handleDrop(e);
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--primary-color)"}
              onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
              onClick={() => document.getElementById("proof-upload").click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <FaUpload style={{ fontSize: "30px", opacity: 0.6, marginBottom: "10px" }} />
                  <p style={{ opacity: 0.8, fontWeight: "500" }}>Click or drag photo to upload</p>
                </>
              )}
              <input 
                id="proof-upload" 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className="role-btn admin-btn" 
                style={{ flex: 1 }}
                onClick={() => {
                  setUploadModal({ show: false, complaint: null });
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="role-btn" 
                style={{ flex: 1 }}
                onClick={handleUploadProof}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Save Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectorDashboard;
