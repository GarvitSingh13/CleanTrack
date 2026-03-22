const geocoder = require("../config/geocoder");
const upload = require("../config/multer");
const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const adminAuth = require("../middleware/auth");
const userAuth = require("../middleware/userAuth");
const collectorAuth = require("../middleware/collectorAuth");


router.post("/add", userAuth, upload.single("image"), async (req, res) => {
  try {
    console.log("USER:", req.user);

    console.log("FILE:", req.file);

    const description = req.body.description || "";
    const address = req.body.address || "";

    let latitude = req.body.latitude;
    let longitude = req.body.longitude;

    if (!latitude || !longitude) {
        const geoData = await geocoder.geocode(address);
        if (!geoData.length) {
            return res.status(400).json({ message: "Invalid address" });
        }
        latitude = geoData[0].latitude;
        longitude = geoData[0].longitude;
    }

    const highPriorityKeywords = [
      "overflow", "urgent", "emergency", "danger", "fire", 
      "injury", "accident", "blocked", "toxic", "hospital", "school"
    ];

    const detectedKeywords = highPriorityKeywords.filter(keyword => 
      description.toLowerCase().includes(keyword.toLowerCase())
    );

    let priority = "Normal";
    if (detectedKeywords.length === 1) {
      priority = "High";
    } else if (detectedKeywords.length > 1) {
      priority = "Very High";
    }

    const complaint = new Complaint({
      description,
      latitude,
      longitude,
      address,
      imageUrl: req.file ? req.file.path : "",
      priority,
      aiDetectedKeyword: detectedKeywords.length > 0 ? detectedKeywords.join(", ") : null,
      userId: req.user.id
    });

    await complaint.save();

    // Create Notification for Admin
    const adminNotification = new Notification({
      targetRole: "admin",
      complaintId: complaint._id,
      message: `New complaint submitted: "${description}"`,
      type: "new_complaint"
    });
    await adminNotification.save();

    // Reward the user with Green Credits for reporting
    await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: 10 } });

    res.status(201).json({ message: "Complaint submitted successfully - +10 Green Credits" });

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

const Notification = require("../models/Notification");

router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if re-opening a resolved complaint
    if (status === "Pending" && complaint.status === "Resolved") {
      if (complaint.proofStatus === "Approved") {
        complaint.proofStatus = "Pending Review";
      }

      // Notify collector if associated
      if (complaint.collectorId) {
        const notification = new Notification({
          collectorId: complaint.collectorId,
          complaintId: complaint._id,
          message: `Admin has re-opened the complaint: ${complaint.description}. It is now back in your pending list.`,
          type: "info",
          targetRole: "collector"
        });
        await notification.save();
      }
    }

    complaint.status = status;
    await complaint.save();

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

router.put("/upload-proof/:id", collectorAuth, upload.single("proofImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const collectorId = req.collector.id;

    if (!req.file) {
      return res.status(400).json({ message: "Proof image is required" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.proofImageUrl = req.file.path.replace(/\\/g, "/");
    complaint.proofStatus = "Pending Review";
    complaint.collectorId = collectorId;
    complaint.rejectionReason = null; // Clear any previous rejection reason

    await complaint.save();

    res.json({ message: "Proof uploaded successfully. Pending admin review." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;