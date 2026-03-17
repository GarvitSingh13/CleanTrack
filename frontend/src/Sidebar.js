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
      >
        <FaBars />
      </button>

      <h2 className="sidebar-logo">CleanTrack</h2>

      {role === "admin" && (
        <>
          <button
            className={`sidebar-btn ${adminPage === "dashboard" ? "active" : ""}`}
            onClick={() => setAdminPage("dashboard")}
            title="Dashboard"
          >
            <FaTachometerAlt /> {!collapsed && "Dasboard"}
          </button>

          <button
            className={`sidebar-btn ${adminPage === "complaints" ? "active" : ""}`}
            onClick={() => setAdminPage("complaints")}
            title="Complaints"
          >
            <FaClipboardList /> {!collapsed && "Complaints"}
          </button>

          <button
            className={`sidebar-btn ${adminPage === "heatmap" ? "active" : ""}`}
            onClick={() => setAdminPage("heatmap")}
            title="Heatmap"
          >
            <FaMapMarkedAlt /> {!collapsed && "Heatmap"}
          </button>

          <button
            className={`sidebar-btn ${adminPage === "analytics" ? "active" : ""}`}
            onClick={() => setAdminPage("analytics")}
            title="Analytics"
          >
            <FaChartLine /> {!collapsed && "Analytics"}
          </button>
        </>
      )}

      {role === "user" && (
        <>
          <button
            className={`sidebar-btn ${userPage === "dashboard" ? "active" : ""}`}
            onClick={() => setUserPage("dashboard")}
            title="Dashboard"
          >
            <FaTachometerAlt /> {!collapsed && "Dasboard"}
          </button>

          <button
            className={`sidebar-btn ${userPage === "report" ? "active" : ""}`}
            onClick={() => setUserPage("report")}
            title="Report Garbage"
          >
            <FaClipboardList /> {!collapsed && "Report Garbage"}
          </button>

          <button
            className={`sidebar-btn ${userPage === "complaints" ? "active" : ""}`}
            onClick={() => setUserPage("complaints")}
            title="My Complaints"
          >
            <FaClipboardList /> {!collapsed && "My Complaints"}
          </button>
        </>
      )}

      <button className="sidebar-btn" onClick={toggleTheme}>
        {theme === "light" ? <FaMoon /> : <FaSun />}
        {!collapsed && (theme === "light" ? "Dark Mode" : "Light Mode")}
      </button>

      <button className="sidebar-btn logout" onClick={logout} title="Logout">
        <FaSignOutAlt /> {!collapsed && "Logout"}
      </button>

    </div>
  );
}

export default Sidebar;