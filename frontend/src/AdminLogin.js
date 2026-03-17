import React, { useState } from "react";

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
    <div className="admin-login-wrapper">
      <div className="card admin-login-card">
        <h2 className="text-center">Admin Login</h2>

        {error && <p className="error-text">{error}</p>}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button className="submit-btn" onClick={handleLogin}>
          Login
        </button>

        <button
          onClick={onSignupClick}
          style={{
            marginTop: "12px",
            background: "none",
            border: "none",
            color: "var(--primary-color)",
            cursor: "pointer"
          }}
        >
          Create admin account
        </button>

        <button
          onClick={onBack}
          style={{
            marginTop: "12px",
            background: "none",
            border: "none",
            color: "var(--primary-color)",
            cursor: "pointer"
          }}
        >
          Back
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;