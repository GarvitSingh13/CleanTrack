import React, { useEffect, useState, useCallback } from "react";
import RoleSelection from "./RoleSelection";
import ComplaintForm from "./ComplaintForm";
import AdminDashboard from "./AdminDashboard";
import AdminSignup from "./AdminSignup";
import UserLogin from "./UserLogin";
import AdminLogin from "./AdminLogin";
import UserDashboard from "./UserDashboard";
import Loader from "./Loader";
import Sidebar from "./Sidebar";
import CollectorLogin from "./CollectorLogin";
import CollectorSignup from "./CollectorSignup";
import CollectorDashboard from "./CollectorDashboard";

function App() {
  const [userPage, setUserPage] = useState("dashboard");
  const [adminPage, setAdminPage] = useState("dashboard");
  const [complaints, setComplaints] = useState([]);
  const [userData, setUserData] = useState(null);
  const [theme, setTheme] = useState("light");
  const [showSignup, setShowSignup] = useState(false);
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCollector, setIsCollector] = useState(false);
  const [collectorAuthPage, setCollectorAuthPage] = useState("login"); // "login", "signup"
  const [loading, setLoading] = useState(false);

  const getBadge = (credits = 0) => {
    if (credits >= 100) return { title: "City Guardian 👑", color: "#eab308", bg: "rgba(234, 179, 8, 0.1)" };
    if (credits >= 50) return { title: "Waste Warrior 🛡️", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" };
    return { title: "Eco Starter 🌱", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" };
  };

  const fetchMyProfile = useCallback(async () => {
    try {
      if (role !== "user" || !isUser) return;
      const token = localStorage.getItem("userToken");
      if (!token) return;
      
      const res = await fetch("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  }, [role, isUser]);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile, userPage]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const logout = () => {

    if (!window.confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("adminToken");
    localStorage.removeItem("userToken");
    localStorage.removeItem("collectorToken");

    setIsAdmin(false);
    setIsUser(false);
    setIsCollector(false);

    setRole(null);
    setUserPage("dashboard");

  };

  const showToast = (message, type = "success") => {
    console.log("🔥 TOAST TRIGGERED:", message);

    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchComplaints = useCallback(async () => {
    try {

      const res = await fetch("http://localhost:5000/api/complaints");
      const data = await res.json();

      // Only show the toast if we already had complaints loaded (not the first fetch),
      // and only if the current user is an actively logged-in Admin.
      if (
        complaints.length > 0 && 
        data.length > complaints.length && 
        role === "admin" && 
        isAdmin === true
      ) {
        showToast("🔔 New garbage complaint reported");
      }

      setComplaints(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });

    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  }, [complaints, role, isAdmin]);

  useEffect(() => {

    fetchComplaints();

    const interval = setInterval(() => {
      fetchComplaints();
    }, 5000);

    return () => clearInterval(interval);

  }, [fetchComplaints]);

  return (
    <div className="page-wrapper">

      {loading && <Loader />}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: toast.type === "error" ? "#dc3545" : "#198754",
            color: "white",
            padding: "15px 25px",
            borderRadius: "8px",
            fontWeight: "bold",
            zIndex: 9999999,
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
          }}
        >
          {toast.message}
        </div>
      )}

      {!role ? (
        <RoleSelection
          setRole={(selectedRole) => {
            setLoading(true);

            setTimeout(() => {
              setRole(selectedRole);
              setLoading(false);
            }, 600);
          }}
        />
      ) : (
        // Check if the user is NOT authenticated for their chosen role
        ((role === "user" && !isUser) || (role === "admin" && !isAdmin) || (role === "collector" && !isCollector)) ? (
          // FULL-SCREEN AUTH PAGES
          <>
            {role === "user" && (
              <UserLogin
                onLogin={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setIsUser(true);
                    setUserPage("dashboard");
                    setLoading(false);
                  }, 600);
                }}
                onBack={() => {
                  localStorage.removeItem("userToken");
                  setIsUser(false);
                  setRole(null);
                }}
              />
            )}

            {role === "collector" && (
              collectorAuthPage === "signup" ? (
                <CollectorSignup 
                  onBackToLogin={() => setCollectorAuthPage("login")} 
                  onRegisterSuccess={() => {
                    showToast("✅ Registered! Please login.");
                    setCollectorAuthPage("login");
                  }} 
                />
              ) : (
                <CollectorLogin
                  onLogin={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setIsCollector(true);
                      setLoading(false);
                    }, 600);
                  }}
                  onSignupRedirect={() => setCollectorAuthPage("signup")}
                  onVerifyRedirect={(email) => {
                    // We could add a separate "verify" view here, 
                    // but for now, we'll just redirect to signup step 2 
                    // or just tell them to use a new email for simplicity.
                    // Actually, let's just make it simple.
                    setCollectorAuthPage("signup");
                  }}
                  onBack={() => {
                    localStorage.removeItem("collectorToken");
                    setIsCollector(false);
                    setRole(null);
                  }}
                />
              )
            )}

            {role === "admin" && (
              showSignup ? (
                <AdminSignup onBackToLogin={() => setShowSignup(false)} />
              ) : (
                <AdminLogin
                  onLogin={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setIsAdmin(true);
                      setAdminPage("dashboard");
                      setLoading(false);
                    }, 600);
                  }}
                  onSignupClick={() => setShowSignup(true)}
                  onBack={() => setRole(null)}
                />
              )
            )}
          </>
        ) : (
          // DASHBOARD LAYOUT (Authenticated)
          <div className="dashboard-layout">
            <Sidebar
              role={role}
              logout={logout}
              theme={theme}
              toggleTheme={toggleTheme}
              setUserPage={setUserPage}
              setAdminPage={setAdminPage}
              adminPage={adminPage}
              userPage={userPage}
            />

            <div className="dashboard-content">
              {role === "user" && isUser && (
                <>
                  {userPage === "dashboard" && (
                    <>
                      <div className="welcome-panel" style={{ marginBottom: "20px" }}>
                        <h2>Welcome back 👋</h2>
                        <p>Report garbage issues in your area and help keep the city clean.</p>
                      </div>
                      
                      {userData && (
                        <div className="stat-card gamification-card" style={{ marginBottom: "30px", background: "linear-gradient(135deg, rgba(34,197,94,0.05), rgba(20,184,166,0.05))", border: "1px solid rgba(34,197,94,0.2)"}}>
                          <div>
                            <h3 style={{ fontSize: "16px", color: "var(--text-color)", fontWeight: "600", marginBottom: "8px", opacity: 0.8 }}>My Environmental Impact</h3>
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
                    </>
                  )}
                  {userPage === "report" && (
                    <ComplaintForm
                      onSuccess={fetchComplaints}
                      onBack={() => setUserPage("dashboard")}
                    />
                  )}
                  {userPage === "complaints" && (
                    <UserDashboard
                      onBack={() => setUserPage("dashboard")}
                    />
                  )}
                </>
              )}

              {role === "admin" && isAdmin && (
                <AdminDashboard
                  complaints={complaints}
                  refreshComplaints={fetchComplaints}
                  showToast={showToast}
                  adminPage={adminPage}
                  setAdminPage={setAdminPage}
                  onBack={logout}
                />
              )}

              {role === "collector" && isCollector && (
                <CollectorDashboard
                  complaints={complaints}
                  onLogout={logout}
                  showToast={showToast}
                />
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default App;