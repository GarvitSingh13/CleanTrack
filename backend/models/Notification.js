const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collector",
    required: false
  },
  targetRole: {
    type: String,
    enum: ["collector", "admin"],
    required: true
  },
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["success", "error", "info", "new_complaint"],
    default: "info"
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", NotificationSchema);
