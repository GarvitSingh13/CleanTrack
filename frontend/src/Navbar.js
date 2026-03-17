import React from "react";

function Navbar({ role, toggleTheme, theme, logout, onBack }) {

  return (
    <div className="navbar">

      <div className="navbar-left">
        <h2 className="navbar-logo">CleanTrack</h2>
      </div>

      <div className="navbar-right">

        {role && (
          <button className="nav-btn" onClick={onBack}>
            Back
          </button>
        )}

        <button className="nav-btn" onClick={toggleTheme}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>

        {role === "admin" && (
          <button className="nav-btn logout-btn" onClick={logout}>
            Logout
          </button>
        )}

      </div>

    </div>
  );
}

export default Navbar;