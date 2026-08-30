const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  zipcode: { type: String },
  district: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Profile", ProfileSchema);
