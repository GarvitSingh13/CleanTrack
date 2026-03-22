const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userAuthRoutes = require("./routes/userAuth");
require("dotenv").config();

const app = express();

app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(express.json());

app.use("/api/complaints", require("./routes/complaintRoutes"));

app.use("/api/admin", require("./routes/admin"));

app.use("/api/users", userAuthRoutes);

app.use("/api/collector", require("./routes/collectorRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Smart Waste Management API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});