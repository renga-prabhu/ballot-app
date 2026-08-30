// server.js — CommonJS Version (Works with your Node setup)

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// In-memory user profiles
const userProfiles = {};

// -----------------------------------------------------
// Save demographics
// -----------------------------------------------------
app.post("/user/init", (req, res) => {
  const { userId, ageRange, politicalLean, topIssues } = req.body;

  if (!userId) {
    return res.json({ error: "Missing userId" });
  }

  userProfiles[userId] = {
    ageRange,
    politicalLean,
    topIssues
  };

  res.json({ success: true });
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

  const userProfile = userProfiles[userId];
  if (!userProfile) {
    return res.json({ error: "User profile not found." });
  }

  const prompt = `
You are a non-partisan civic literacy assistant.

User profile (anonymous):
- Age range: ${ageRange}
- Political lean: ${politicalLean || "Not provided"}
- Top issues: ${topIssues.join(", ")}

Location:
- ZIP: ${zip}
- City/State: ${cityState}

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
  console.log(`Backend running on http://localhost:${PORT}`);
});
