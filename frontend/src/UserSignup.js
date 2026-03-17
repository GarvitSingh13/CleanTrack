import React, { useState } from "react";

function UserSignup({ onBackToLogin }) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    try {

      const res = await fetch("http://localhost:5000/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Signup failed");
        return;
      }

      setMessage("Account created successfully. Please login.");

    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="card admin-login-card">

        <h2 className="text-center">User Signup</h2>

        {message && <p className="error-text">{message}</p>}

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
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
          Back to login
        </button>

      </div>
    </div>
  );
}

export default UserSignup;