const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  status: {
    type: String,
    default: "Pending"
  },
  priority: {
    type: String,
    default: "Normal"
  },
  aiDetectedKeyword: {
    type: String,
    default: null
  },
  proofImageUrl: {
    type: String,
    default: null
  },
  proofStatus: {
    type: String,
    enum: ["None", "Pending Review", "Approved", "Rejected"],
    default: "None"
  },
  rejectionReason: {
    type: String,
    default: null
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collector",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Complaint", ComplaintSchema);