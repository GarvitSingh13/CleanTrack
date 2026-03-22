const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const userAuth = require("../middleware/userAuth");

// USER SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        // Remove the stuck, unverified user so they can try signing up again
        await User.deleteOne({ email });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationCode // ✅ ADD THIS
    });

    await user.save();

    const { sendVerificationEmail } = require("../utils/emailHelper");
    await sendVerificationEmail(email, verificationCode, "user");

    res.status(201).json({
      message: "User registered. Please check your email for the OTP code."
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;

    await user.save();

    res.json({ message: "Email verified successfully. You can now login." });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// USER LOGIN
router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        greenCredits: user.greenCredits
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -verificationCode");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching profile" });
  }
});

module.exports = router;