const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Complaint = require("../models/Complaint");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, password });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
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
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create new admin
    const newAdmin = new Admin({ email, password });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
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

module.exports = router;