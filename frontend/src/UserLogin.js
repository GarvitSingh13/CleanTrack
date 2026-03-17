import React, { useState } from "react";
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
    <div className="admin-login-wrapper">
        <div className="card admin-login-card">

        <h2 className="text-center">User Login</h2>

        <div className="form-group">
            <label>Email</label>
            <input
            type="email"
            placeholder="Enter user email"
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
            onClick={() => setShowSignup(true)}
            style={{
            marginTop: "12px",
            background: "none",
            border: "none",
            color: "var(--primary-color)",
            cursor: "pointer"
            }}
        >
            Create user account
        </button>

        <button
            onClick={onBack}
            style={{
                marginTop: "8px",
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
export default UserLogin;