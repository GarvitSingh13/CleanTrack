import React, { useState } from "react";
import Loader from "./Loader";

function UserSignup({ onBackToLogin }) {

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
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
        setMessage(data.message || data.error || "Signup failed");
        setLoading(false);
        return;
      }

      setMessage("OTP sent to your email. Please verify.");
      setStep(2);
      setLoading(false);
    } catch (err) {
      setMessage("Server error");
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code: otp })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Invalid verification code");
        return;
      }

      setMessage("Account verified successfully. You can now login.");
      setStep(3);
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div className="auth-page">
      {loading && <Loader />}
      <div className="auth-container">
        <h2>User Signup</h2>

        {message && (
          <p 
            style={{ 
              color: step === 3 ? "green" : (message.includes("sent") ? "#0d6efd" : "#ef4444"),
              marginBottom: "14px",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            {message}
          </p>
        )}

        {step === 1 && (
          <>
            <div className="auth-form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="auth-input"
              />
            </div>

            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input"
              />
            </div>

            <button className="role-btn" style={{ width: "100%" }} onClick={handleSignup} disabled={loading}>
              {loading ? "Sending OTP..." : "Create Account"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth-form-group">
              <label>OTP Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="auth-input"
              />
            </div>

            <button className="role-btn" style={{ width: "100%" }} onClick={handleVerify}>
              Verify OTP
            </button>
            <button type="button" onClick={() => setStep(1)} className="auth-footer-btn">
              Wait, I entered the wrong email
            </button>
          </>
        )}

        <button onClick={onBackToLogin} className="auth-footer-btn">
          {step === 3 ? "Registration Successful. Login Now" : "Already have an account? Login"}
        </button>

      </div>
    </div>
  );
}

export default UserSignup;