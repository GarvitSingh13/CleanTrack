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

function App() {
  const [userPage, setUserPage] = useState("dashboard");
  const [adminPage, setAdminPage] = useState("dashboard");
  const [complaints, setComplaints] = useState([]);
  const [theme, setTheme] = useState("light");
  const [showSignup, setShowSignup] = useState(false);
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [loading, setLoading] = useState(false);

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

    setIsAdmin(false);
    setIsUser(false);

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

      if (data.length > complaints.length) {
        showToast("🔔 New garbage complaint reported");
      }

      setComplaints(data);

    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  }, [complaints]);

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
            <hr />

        {role === "user" && (
          isUser ? (
            <>
              {userPage === "dashboard" && (
                <div className="welcome-panel">
                  <h2>Welcome back 👋</h2>
                  <p>
                    Report garbage issues in your area and help keep the city clean.
                  </p>
                </div>
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
          ) : (
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
          )
        )}

        {role === "admin" && (
          isAdmin ? (
            <>
              <AdminDashboard
                complaints={complaints}
                refreshComplaints={fetchComplaints}
                showToast={showToast}
                adminPage={adminPage}         
                setAdminPage={setAdminPage}   
                onBack={() => {
                  localStorage.removeItem("adminToken");
                  setIsAdmin(false);
                  setRole(null);
                }}
              />
            </>
          ) : (
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
          )
                )}
          </div>   

        </div>     

      )}
    </div>
  );
}

export default App;