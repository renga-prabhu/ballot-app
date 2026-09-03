const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  name: { type: String },
  email: { type: String },
  zipcode: { type: String },
  district: { type: String },
  ageRange: { type: String },
  politicalLean: { type: String },
  topIssues: [{ type: String }],
  zip: { type: String },
  cityState: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Profile", ProfileSchema);
