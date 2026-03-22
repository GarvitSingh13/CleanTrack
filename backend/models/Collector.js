const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const CollectorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "On Duty", // "On Duty", "Off Duty", "In Transit"
  },
  currentLatitude: {
    type: Number,
    default: null
  },
  currentLongitude: {
    type: Number,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
CollectorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("Collector", CollectorSchema);
