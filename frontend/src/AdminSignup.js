import React, { useState } from "react";

function AdminSignup({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/admin/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      setMessage("Admin account created successfully");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="card admin-login-card">
        <h2>Create Admin Account</h2>

        {error && <p className="error-text">{error}</p>}
        {message && <p style={{ color: "green", marginBottom: "14px" }}>{message}</p>}

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

        <button className="submit-btn" onClick={handleSignup}>
          Create Account
        </button>

        <button
          onClick={onBackToLogin}
          style={{
            marginTop: "12px",
            background: "none",
            border: "none",
            color: "var(--primary-color)",
            cursor: "pointer"
          }}
        >
          Back to Admin Login
        </button>
      </div>
    </div>
  );
}

export default AdminSignup;