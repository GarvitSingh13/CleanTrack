import React, { useState } from "react";
import { FaTruck } from "react-icons/fa";
import Loader from "./Loader";

function CollectorSignup({ onBackToLogin, onRegisterSuccess }) {
  const [step, setStep] = useState(1); // 1: Details, 2: Verification
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    vehicleNumber: "",
    phone: ""
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/collector/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setStep(2); // Move to verification
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/collector/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      onRegisterSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {loading && <Loader />}
      <div className="auth-container">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(34, 197, 94, 0.1)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 15px" }}>
            <FaTruck />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-color)" }}>
            Collector Signup
          </h2>
        </div>

        {step === 2 && (
          <p style={{ color: "#0d6efd", marginBottom: "14px", fontSize: "14px", fontWeight: "500", textAlign: "center" }}>
            OTP sent to your email. Please verify.
          </p>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div className="auth-form-group">
              <label>Full Name</label>
              <input name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required className="auth-input" />
            </div>
            <div className="auth-form-group">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="Enter email address" value={formData.email} onChange={handleChange} required className="auth-input" />
            </div>
            <div className="auth-form-group">
              <label>Vehicle Number</label>
              <input name="vehicleNumber" placeholder="e.g. KA-01-1234" value={formData.vehicleNumber} onChange={handleChange} required className="auth-input" />
            </div>
            <div className="auth-form-group">
              <label>Phone Number</label>
              <input name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} required className="auth-input" />
            </div>
            <div className="auth-form-group">
              <label>Create Password</label>
              <input name="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required className="auth-input" />
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600", textAlign: "center", marginBottom: "15px" }}>{error}</p>}

            <button type="submit" className="role-btn" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
             <div className="auth-form-group">
              <label>OTP Code</label>
              <input 
                placeholder="Enter 6-digit code" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                required 
                className="auth-input" 
                style={{ textAlign: "center", fontSize: "18px" }} 
                maxLength="6"
              />
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600", textAlign: "center", marginBottom: "15px" }}>{error}</p>}

            <button type="submit" className="role-btn" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="auth-footer-btn">
              Wait, I entered the wrong email
            </button>
          </form>
        )}
        
        <button onClick={onBackToLogin} className="auth-footer-btn" style={{ marginTop: step === 1 ? "15px" : "10px" }}>
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}

export default CollectorSignup;
