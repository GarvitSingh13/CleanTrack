const geocoder = require("../config/geocoder");
const upload = require("../config/multer");
const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const adminAuth = require("../middleware/auth");
const userAuth = require("../middleware/userAuth");


router.post("/add", userAuth, upload.single("image"), async (req, res) => {
  try {
    console.log("USER:", req.user);

    console.log("FILE:", req.file);

    const description = req.body.description || "";
    const address = req.body.address || "";

    const geoData = await geocoder.geocode(address);

    if (!geoData.length) {
      return res.status(400).json({ message: "Invalid address" });
    }

    const latitude = geoData[0].latitude;
    const longitude = geoData[0].longitude;

    const highPriorityKeywords = [
      "overflow",
      "urgent",
      "emergency",
      "danger",
      "fire",
      "injury",
      "accident",
      "blocked",
      "toxic",
      "hospital",
      "school"
    ];

    let detectedKeyword = null;

    const isHighPriority = highPriorityKeywords.some(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        detectedKeyword = keyword;
        return true;
      }
      return false;
    });

    let priority = isHighPriority ? "High" : "Normal";

    const complaint = new Complaint({
      description,
      latitude,
      longitude,
      address,
      imageUrl: req.file ? req.file.path : "",
      priority,
      aiDetectedKeyword: detectedKeyword,
      userId: req.user.id
    });

    await complaint.save();

    res.status(201).json({ message: "Complaint submitted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my", userAuth, async (req, res) => {
  try {

    const complaints = await Complaint
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(complaints);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, {
      status: req.body.status
    });
    res.json({ message: "Complaint status updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/update-priority/:id", async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, {
      priority: req.body.priority
    });

    res.json({ message: "Priority updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

router.delete("/delete-all", adminAuth, async (req, res) => {
  try {
    await Complaint.deleteMany({});
    res.json({ message: "All complaints deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete all failed" });
  }
});

module.exports = router;