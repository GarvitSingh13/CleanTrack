import React from "react";
import {
  FaChartLine,
  FaClipboardList,
  FaMapMarkedAlt,
  FaTachometerAlt,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaBars
} from "react-icons/fa";

function Sidebar({
  role,
  logout,
  theme,
  toggleTheme,
  setUserPage,
  setAdminPage,
  adminPage,
  userPage
}) {

  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      <button
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <FaBars />
      </button>

      <h2 className="sidebar-logo">CleanTrack</h2>

      <div className="sidebar-nav">
        {role === "admin" && (
          <>
            <button
              className={`sidebar-btn ${adminPage === "dashboard" ? "active" : ""}`}
              onClick={() => setAdminPage("dashboard")}
            >
              <FaTachometerAlt /> {!collapsed && <span>Dashboard</span>}
            </button>

            <button
              className={`sidebar-btn ${adminPage === "complaints" ? "active" : ""}`}
              onClick={() => setAdminPage("complaints")}
            >
              <FaClipboardList /> {!collapsed && <span>Complaints</span>}
            </button>

            <button
              className={`sidebar-btn ${adminPage === "heatmap" ? "active" : ""}`}
              onClick={() => setAdminPage("heatmap")}
            >
              <FaMapMarkedAlt /> {!collapsed && <span>Heatmap</span>}
            </button>

            <button
              className={`sidebar-btn ${adminPage === "analytics" ? "active" : ""}`}
              onClick={() => setAdminPage("analytics")}
            >
              <FaChartLine /> {!collapsed && <span>Analytics</span>}
            </button>
          </>
        )}

        {role === "user" && (
          <>
            <button
              className={`sidebar-btn ${userPage === "dashboard" ? "active" : ""}`}
              onClick={() => setUserPage("dashboard")}
            >
              <FaTachometerAlt /> {!collapsed && <span>Dashboard</span>}
            </button>

            <button
              className={`sidebar-btn ${userPage === "report" ? "active" : ""}`}
              onClick={() => setUserPage("report")}
            >
              <FaClipboardList /> {!collapsed && <span>Report Garbage</span>}
            </button>

            <button
              className={`sidebar-btn ${userPage === "complaints" ? "active" : ""}`}
              onClick={() => setUserPage("complaints")}
            >
              <FaClipboardList /> {!collapsed && <span>My Complaints</span>}
            </button>
          </>
        )}

        <button className="sidebar-btn" onClick={toggleTheme}>
          {theme === "light" ? <FaMoon /> : <FaSun />}
          {!collapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
        </button>
      </div>

      <button className="sidebar-btn logout" onClick={logout}>
        <FaSignOutAlt /> {!collapsed && <span>Logout</span>}
      </button>

    </div>
  );
}

export default Sidebar;