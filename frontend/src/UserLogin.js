import React, { useState } from "react";
import { FaChevronLeft, FaRecycle } from "react-icons/fa";
import UserSignup from "./UserSignup";

function UserLogin({ onLogin, onBack }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async () => {
    try {

      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userToken", data.token);
        onLogin();
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  if (showSignup) {
    return <UserSignup onBackToLogin={() => setShowSignup(false)} />;
    }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button onClick={onBack} className="back-btn" style={{ background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontWeight: "600" }}>
          <FaChevronLeft /> Back to Roles
        </button>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(34, 197, 94, 0.1)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 15px" }}>
            <FaRecycle />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-color)" }}>User Login</h2>
        </div>

        <div className="auth-form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter user email"
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

        <button onClick={() => setShowSignup(true)} className="auth-footer-btn">
          New here? Create an account
        </button>
      </div>
    </div>
  );
}
export default UserLogin;