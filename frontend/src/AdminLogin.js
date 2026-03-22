import React, { useState } from "react";
import { FaChevronLeft, FaShieldAlt } from "react-icons/fa";

function AdminLogin({ onLogin, onSignupClick, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Save token (optional but useful)
      localStorage.setItem("adminToken", data.token);

      // Notify parent (App.js)
      onLogin();
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button onClick={onBack} className="back-btn" style={{ background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontWeight: "600" }}>
          <FaChevronLeft /> Back to Roles
        </button>

        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(34, 197, 94, 0.1)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 15px" }}>
            <FaShieldAlt />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-color)" }}>Admin Login</h2>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="auth-form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="auth-input"
          />
        </div>

        <div className="auth-form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        <button className="role-btn" style={{ width: "100%" }} onClick={handleLogin}>
          Login
        </button>

        <button onClick={onSignupClick} className="auth-footer-btn">
          Don't have an account? Create one
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;