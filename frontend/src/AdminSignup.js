import React, { useState } from "react";
import Loader from "./Loader";

function AdminSignup({ onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    setMessage("");
    setLoading(true);

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
        setLoading(false);
        return;
      }

      setMessage("OTP sent to your email. Please verify.");
      setStep(2);
      setLoading(false);
    } catch (err) {
      setError("Server error");
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/admin/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code: otp })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid verification code");
        return;
      }

      setMessage("Admin account verified successfully.");
      setStep(3);
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="auth-page">
      {loading && <Loader />}
      <div className="auth-container">
        <h2>Create Admin Account</h2>

        {error && <p className="error-text">{error}</p>}
        {message && <p style={{ color: "green", marginBottom: "14px", fontSize: "14px" }}>{message}</p>}

        {step === 1 && (
          <>
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
          {step === 3 ? "Go to Admin Login" : "Back to Admin Login"}
        </button>
      </div>
    </div>
  );
}

export default AdminSignup;