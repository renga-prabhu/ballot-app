// server.js — CommonJS Version with MongoDB

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Profile = require("./models/Profile");


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------------
// Environment Variables
// -----------------------------------------------------
const PORT = process.env.PORT || 4000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;

// -----------------------------------------------------
// MongoDB Connection
// -----------------------------------------------------
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.log("❌ MongoDB Connection Error:");
    console.log(err.message);
  }
}


connectDB();

// -----------------------------------------------------
// In-memory user profiles (temporary until DB schema added)
// -----------------------------------------------------
const userProfiles = {};

app.post("/submit", async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();

    res.json({ success: true, id: profile._id });
  } catch (err) {
    console.log("Save error:", err.message);
    res.status(500).json({ success: false });
  }
});


// -----------------------------------------------------
// Save demographics
// -----------------------------------------------------
app.post("/user/init", async (req, res) => {
  const { userId, ageRange, politicalLean, topIssues, zip, cityState } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const profileData = {
    userId,
    ageRange,
    politicalLean,
    topIssues: Array.isArray(topIssues) ? topIssues : [],
    zip,
    cityState
  };

  try {
    await Profile.findOneAndUpdate(
      { userId },
      profileData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    userProfiles[userId] = profileData;
    res.json({ success: true });
  } catch (err) {
    console.log("Profile save error:", err.message);
    res.status(500).json({ success: false, error: "Unable to save profile" });
  }
});

// -----------------------------------------------------
// Look up the user's current ballot
// -----------------------------------------------------
app.post("/ballot/lookup", async (req, res) => {
  const { city, state, zip } = req.body;

  if (!city || !state || !zip) {
    return res.status(400).json({ error: "A valid ZIP code is required." });
  }

  if (!GOOGLE_CIVIC_API_KEY) {
    return res.status(503).json({ error: "Ballot lookup is not configured yet." });
  }

  try {
    const civicRes = await axios.get(
      "https://www.googleapis.com/civicinfo/v2/voterinfo",
      {
        params: {
          address: `${city}, ${state} ${zip}`,
          officialOnly: true,
          key: GOOGLE_CIVIC_API_KEY
        }
      }
    );

    const data = civicRes.data;
    res.json({
      election: data.election || null,
      otherElections: data.otherElections || [],
      contests: data.contests || [],
      electionOffice: data.state?.[0]?.electionAdministrationBody || null,
      source: "Google Civic Information API"
    });
  } catch (err) {
    console.log("Ballot lookup error:", err.response?.data || err.message);
    const statusCode = err.response?.status === 404 ? 404 : 502;
    res.status(statusCode).json({
      error: "No ballot information was found for that address.",
      officialElectionUrl: "https://vote.gov/"
    });
  }
});

// -----------------------------------------------------
// AI Explanation (NO BALLOT DEPENDENCY)
// -----------------------------------------------------
app.post("/ai/explain", async (req, res) => {
  const {
    userId,
    zip,
    cityState,
    ageRange,
    politicalLean,
    topIssues,
    question
  } = req.body;

  if (!userId || !zip || !question) {
    return res.json({ error: "Missing required fields." });
  }

  let userProfile;
  try {
    userProfile = await Profile.findOne({ userId }).lean();
  } catch (err) {
    console.log("Profile lookup error:", err.message);
    return res.status(500).json({ error: "Unable to load user profile." });
  }

  if (!userProfile) {
    return res.status(404).json({ error: "User profile not found." });
  }

  const profileAgeRange = userProfile.ageRange || ageRange;
  const profilePoliticalLean = userProfile.politicalLean || politicalLean;
  const profileTopIssues = userProfile.topIssues || topIssues || [];
  const profileZip = userProfile.zip || zip;
  const profileCityState = userProfile.cityState || cityState;

  const prompt = `
You are a non-partisan civic literacy assistant.

User profile (anonymous):
  - Age range: ${profileAgeRange}
  - Political lean: ${profilePoliticalLean || "Not provided"}
  - Top issues: ${profileTopIssues.join(", ")}

Location:
- ZIP: ${profileZip}
- City/State: ${profileCityState}

Voter Question:
${question}

Rules:
- Stay strictly neutral.
- Do NOT recommend who to vote for.
- Do NOT advocate for or against any candidate or party.
- Explain offices, processes, and issues clearly.
- Present multiple sides fairly when relevant.
- Encourage critical thinking and further research.

Now provide a clear, calm, educational explanation.
`;

  try {
    const aiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a non-partisan civic literacy assistant." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const answer = aiRes.data.choices[0].message.content;
    res.json({ answer });

  } catch (err) {
    console.log("══════════════════════════════════════");
    console.log("🔥 FULL AI ERROR DEBUG");
    console.log("══════════════════════════════════════");

    console.log("• err.message:", err.message);
    console.log("• err.code:", err.code);
    console.log("• err.name:", err.name);

    console.log("• err.response?.status:", err.response?.status);
    console.log("• err.response?.statusText:", err.response?.statusText);

    console.log("• err.response?.data:", JSON.stringify(err.response?.data, null, 2));

    console.log("• err.response?.headers:", err.response?.headers);

    console.log("• err.config.url:", err.config?.url);
    console.log("• err.config.method:", err.config?.method);
    console.log("• err.config.headers:", err.config?.headers);
    console.log("• err.config.data:", err.config?.data);

    console.log("══════════════════════════════════════");

    res.json({
      answer: "I couldn't generate a response, but I can try again."
    });
  }
});

// -----------------------------------------------------
// Start server
// -----------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
