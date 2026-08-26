// backend/server.js

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const RECAPTCHA_SECRET = "YOUR_RECAPTCHA_SECRET_KEY"; // replace later
const filePath = path.join(__dirname, "profiles.json");

// Save profile data
app.post("/profile", async (req, res) => {
  const { captchaToken, ...profileData } = req.body;

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${captchaToken}`
    );

    if (!response.data.success) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    let profiles = [];
    if (fs.existsSync(filePath)) {
      profiles = JSON.parse(fs.readFileSync(filePath));
    }

    profiles.push(profileData);
    fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2));

    res.json({ message: "Profile data stored successfully" });
  } catch (err) {
    console.error("Captcha verification error:", err);
    res.status(500).json({ message: "Server error verifying captcha" });
  }
});

// NEW: Get all saved profiles
app.get("/profiles", (req, res) => {
  try {
    if (fs.existsSync(filePath)) {
      const profiles = JSON.parse(fs.readFileSync(filePath));
      res.json({ profiles });
    } else {
      res.json({ profiles: [] });
    }
  } catch (err) {
    console.error("Error reading profiles:", err);
    res.status(500).json({ message: "Server error reading profiles" });
  }
});

// Ballot route (mocked)
app.get("/ballot", (req, res) => {
  const { zip } = req.query;
  const ballotData = {
    "10001": [
      { id: 1, title: "Presidential Election", summary: "Candidates for President" },
      { id: 2, title: "U.S. Senate Election", summary: "Candidates for Senate" }
    ],
    "28801": [
      { id: 1, title: "Presidential Election", summary: "Candidates for President" },
      { id: 2, title: "U.S. Senate Election", summary: "Candidates for Senate" }
    ]
  };

  const items = ballotData[zip] || [
    { id: 1, title: "Presidential Election", summary: "Candidates for President" },
    { id: 2, title: "U.S. Senate Election", summary: "Candidates for Senate" }
  ];

  res.json({ items });
});

app.listen(4000, () => {
  console.log("Backend running at http://localhost:4000");
});
