const mongoose = require("mongoose");

const adminAccessRestrictionSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockoutCount: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("AdminAccessRestriction", adminAccessRestrictionSchema);
