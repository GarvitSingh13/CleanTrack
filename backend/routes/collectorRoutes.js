const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Collector = require("../models/Collector");
const Notification = require("../models/Notification");

const nodemailer = require("nodemailer");

// Register Collector
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, vehicleNumber, phone } = req.body;
    
    let collector = await Collector.findOne({ email });
    if (collector) {
      if (collector.isVerified) {
        return res.status(400).json({ message: "Collector already exists" });
      } else {
        // Remove the stuck, unverified collector so they can try signing up again
        await Collector.deleteOne({ email });
      }
    }

    // Generate random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[AUTH] Verification Code for ${email}: ${verificationCode}`);

    collector = new Collector({ 
      name, email, password, vehicleNumber, phone, 
      verificationCode,
      isVerified: false 
    });
    await collector.save();

    const { sendVerificationEmail } = require("../utils/emailHelper");
    await sendVerificationEmail(email, verificationCode, "collector");

    res.status(201).json({ message: "Verification code sent to email", email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Code
router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;
    const collector = await Collector.findOne({ email });

    if (!collector) return res.status(404).json({ message: "Collector not found" });
    if (collector.verificationCode !== code) return res.status(400).json({ message: "Invalid verification code" });

    collector.isVerified = true;
    collector.verificationCode = null; // Clear code
    await collector.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Collector
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const collector = await Collector.findOne({ email });
    if (!collector) return res.status(400).json({ message: "Invalid credentials" });

    if (!collector.isVerified) {
      return res.status(403).json({ message: "Please verify your email first", email: collector.email });
    }

    const isMatch = await bcrypt.compare(password, collector.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: collector._id, role: "collector" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, collector: { id: collector._id, name: collector.name, email: collector.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Live Location
router.put("/location", async (req, res) => {
  try {
    const { id, latitude, longitude } = req.body;
    await Collector.findByIdAndUpdate(id, {
      currentLatitude: latitude,
      currentLongitude: longitude
    });
    res.json({ message: "Location updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Notifications
router.get("/notifications/:collectorId", async (req, res) => {
  try {
    const notifications = await Notification.find({ collectorId: req.params.collectorId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark Notification as Read
router.put("/notifications/read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put("/notifications/read-all/:collectorId", async (req, res) => {
  try {
    await Notification.updateMany({ collectorId: req.params.collectorId, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all notifications
router.delete("/notifications/clear-all/:collectorId", async (req, res) => {
  try {
    await Notification.deleteMany({ collectorId: req.params.collectorId });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
