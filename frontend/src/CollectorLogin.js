import React, { useState } from "react";
import { FaTruck, FaChevronLeft } from "react-icons/fa";

function CollectorLogin({ onLogin, onBack, onVerifyRedirect, onSignupRedirect }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/collector/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (res.status === 403) {
        // Not verified
        onVerifyRedirect(data.email);
        return;
      }

      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("collectorToken", data.token);
      localStorage.setItem("collectorData", JSON.stringify(data.collector));
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <FaTruck />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-color)" }}>Collector Login</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>Collector Email</label>
            <input
              type="email"
              placeholder="Enter collector email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600", textAlign: "center", marginBottom: "15px" }}>{error}</p>}

          <button type="submit" className="role-btn" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Verifying..." : "Login to Hub"}
          </button>
          
          <button type="button" onClick={onSignupRedirect} className="auth-footer-btn">
            Don't have an account? Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default CollectorLogin;
