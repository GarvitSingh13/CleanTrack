const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Admin = require("../models/Admin");
const Complaint = require("../models/Complaint");
const AdminAccessRestriction = require("../models/AdminAccessRestriction");
const Notification = require("../models/Notification");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, password });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!admin.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      if (existingAdmin.isVerified) {
        return res.status(400).json({ message: "Admin already exists" });
      } else {
        // Remove the stuck, unverified admin so they can try signing up again
        await Admin.deleteOne({ email });
      }
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new admin
    const newAdmin = new Admin({ email, password, verificationCode });
    await newAdmin.save();

    const { sendVerificationEmail } = require("../utils/emailHelper");
    await sendVerificationEmail(email, verificationCode, "admin");

    res.status(201).json({ message: "Admin registered. Please check your email for the OTP code." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    admin.isVerified = true;
    admin.verificationCode = undefined;

    await admin.save();

    res.json({ message: "Admin verified successfully. You can now login." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-secret-key", async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    // Get client IP address
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    let restriction = await AdminAccessRestriction.findOne({ ipAddress: ip });
    
    if (!restriction) {
      restriction = new AdminAccessRestriction({ ipAddress: ip });
    }

    // Check if currently locked out
    if (restriction.lockoutUntil && restriction.lockoutUntil > new Date()) {
      const remainingMs = restriction.lockoutUntil.getTime() - new Date().getTime();
      const remainingMins = Math.ceil(remainingMs / 60000);
      return res.status(429).json({ 
        message: `Too many failed attempts. Locked out for ${remainingMins} more minute(s).` 
      });
    }

    // If lockout expired in the past, reset attempts (but keep lockoutCount to calculate future escalations)
    if (restriction.lockoutUntil && restriction.lockoutUntil <= new Date()) {
      restriction.failedAttempts = 0;
      restriction.lockoutUntil = null;
    }

    // Validate key
    if (secretKey === process.env.ADMIN_SECRET_KEY) {
      // Correct! Reset everything for this IP.
      await AdminAccessRestriction.deleteOne({ ipAddress: ip });
      return res.status(200).json({ message: "Key verified successfully" });
    }

    // Incorrect key
    restriction.failedAttempts += 1;

    if (restriction.failedAttempts >= 3) {
      restriction.lockoutCount += 1;
      const lockoutMinutes = 60 + ((restriction.lockoutCount - 1) * 30);
      restriction.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60000);
      restriction.failedAttempts = 0; // reset attempts for the next cycle
      await restriction.save();
      return res.status(429).json({ 
        message: `Too many failed attempts. Locked out for ${lockoutMinutes} minute(s).` 
      });
    }

    await restriction.save();
    return res.status(401).json({ 
      message: `Incorrect Secret Key. ${3 - restriction.failedAttempts} attempt(s) remaining.` 
    });

  } catch (error) {
    console.error("verify-secret-key error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/resolve-all", async (req, res) => {
  try {
    const result = await Complaint.updateMany(
      { status: "Pending" },
      { $set: { status: "Resolved" } }
    );

    res.json({
      message: `${result.modifiedCount} complaints marked as resolved`
    });

  } catch (error) {
    console.error("Resolve all error:", error);
    res.status(500).json({ message: "Failed to resolve complaints" });
  }
});

router.put("/review-proof/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: "Approve" or "Reject"

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (action === "Approve") {
      complaint.proofStatus = "Approved";
      complaint.status = "Resolved"; // Automatically mark as resolved on approval
    } else if (action === "Reject") {
      complaint.proofStatus = "Rejected";
      complaint.rejectionReason = reason;
      // Status remains "Pending"
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await complaint.save();

    // Create Notification for Collector
    const notification = new Notification({
      collectorId: complaint.collectorId,
      complaintId: complaint._id,
      message: action === "Approve" 
        ? `Admin has approved your proof for spot: ${complaint.description}`
        : `Admin has rejected your proof for spot: ${complaint.description}. Reason: ${reason}`,
      type: action === "Approve" ? "success" : "error",
      targetRole: "collector"
    });

    await notification.save();

    res.json({ message: `Proof ${action.toLowerCase()}d successfully.` });
  } catch (error) {
    console.error("Review proof error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({ targetRole: "admin" }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Fetch admin notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/notifications/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ targetRole: "admin", read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/notifications/clear-all", async (req, res) => {
  try {
    await Notification.deleteMany({ targetRole: "admin" });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/nudge-collector/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (!complaint.collectorId) {
      return res.status(400).json({ message: "No collector assigned to this complaint yet." });
    }

    const notification = new Notification({
      collectorId: complaint.collectorId,
      complaintId: complaint._id,
      message: `URGENT: Admin has requested you to resolve the complaint: "${complaint.description}" as soon as possible.`,
      type: "info",
      targetRole: "collector"
    });

    await notification.save();

    res.json({ message: "Nudge sent to collector successfully." });
  } catch (error) {
    console.error("Nudge error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;