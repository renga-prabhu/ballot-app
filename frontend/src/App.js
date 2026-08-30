// App.js — KnowYourBallot / The Civic Clarity Project — Guiding American Choices
// Liquid UX + Hero-Only Liquid Gold + subtle patriotic palette

import React, { useState } from "react";

function App() {
  const [userId] = useState(() => crypto.randomUUID());

  // Screen control
  const [screen, setScreen] = useState("form");

  // Demographics
  const [ageRange, setAgeRange] = useState("");
  const [politicalLean, setPoliticalLean] = useState("");
  const [topIssues, setTopIssues] = useState([]);

  // ZIP + city/state
  const [zip, setZip] = useState("");
  const [cityState, setCityState] = useState("");
  const [zipValid, setZipValid] = useState(false);

  // AI chat
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // ZIP validation
  const validateZip = async (zipValue) => {
    setCityState("");
    setZipValid(false);

    if (!zipValue || zipValue.length < 5) return;

    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zipValue}`);
      if (!res.ok) {
        setCityState("");
      } else {
        const data = await res.json();
        const place = data.places?.[0];
        const city = place["place name"];
        const state = place["state abbreviation"];
        setCityState(`${city}, ${state}`);
        setZipValid(true);
      }
    } catch {
      setCityState("");
    }
  };

  // Continue → save profile → go to chat
  const continueToChat = async () => {
    try {
      await fetch("http://localhost:4000/user/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ageRange,
          politicalLean,
          topIssues
        })
      });

      setScreen("chat");
    } catch {
      alert("Error saving your info. Try again.");
    }
  };

  // Ask AI
  const askAI = async () => {
    setLoadingAI(true);
    setAnswer("");

    try {
      const res = await fetch("http://localhost:4000/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          zip,
          cityState,
          ageRange,
          politicalLean,
          topIssues,
          question
        })
      });

      const data = await res.json();
      setAnswer(data.answer || "No response from AI.");
    } catch {
      setAnswer("⚠️ AI could not respond. Try again.");
    }

    setLoadingAI(false);
  };

  // FORM SCREEN
  if (screen === "form") {
    return (
      <div style={styles.appShell}>
        <div style={styles.container}>
          {/* HERO */}
          <div style={styles.hero}>
            {/* Liquid Gold Stars */}
            <div style={styles.star1}>★</div>
            <div style={styles.star2}>★</div>
            <div style={styles.star3}>★</div>

            <div style={styles.heroGlass}>
              <h1 style={styles.heroTitle}>Know Your Ballot</h1>
              <div style={styles.heroGoldLine}></div>
              <p style={styles.heroTag}>
                The Civic Clarity Project — Guiding American Choices
              </p>
            </div>
          </div>

          {/* Profile Card */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Your Civic Profile</h2>
            <p style={styles.sectionText}>
              Anonymous information that helps the assistant explain your civic landscape
              clearly. No accounts. No persuasion. Just clarity.
            </p>

            {/* Age Range */}
            <label style={styles.label}>Age Range</label>
            <select
              style={styles.input}
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            >
              <option value="">Select age range</option>
              <option value="18-29">18–29</option>
              <option value="30-49">30–49</option>
              <option value="50-64">50–64</option>
              <option value="65+">65+</option>
            </select>

            {/* Political Lean */}
            <label style={styles.label}>Political Lean (optional)</label>
            <select
              style={styles.input}
              value={politicalLean}
              onChange={(e) => setPoliticalLean(e.target.value)}
            >
              <option value="">Prefer not to say</option>
              <option value="Very Liberal">Very Liberal</option>
              <option value="Liberal">Liberal</option>
              <option value="Moderate">Moderate</option>
              <option value="Conservative">Conservative</option>
              <option value="Very Conservative">Very Conservative</option>
              <option value="Libertarian">Libertarian</option>
              <option value="Populist">Populist</option>
              <option value="Progressive">Progressive</option>
              <option value="Traditionalist">Traditionalist</option>
              <option value="Independent / No Lean">Independent / No Lean</option>
            </select>

            {/* Top Issues */}
            <label style={styles.label}>Top Issues You Care About</label>
            <select
              multiple
              style={styles.input}
              value={topIssues}
              onChange={(e) =>
                setTopIssues(Array.from(e.target.selectedOptions, (opt) => opt.value))
              }
            >
              <option value="Economy">Economy</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Environment">Environment</option>
              <option value="Immigration">Immigration</option>
              <option value="Civil Rights">Civil Rights</option>
              <option value="Foreign Policy">Foreign Policy</option>
              <option value="Crime & Safety">Crime & Safety</option>
              <option value="Housing">Housing</option>
              <option value="Taxes">Taxes</option>
            </select>
          </div>

          {/* Location Card */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Where You’re Voting From</h2>
            <p style={styles.sectionText}>
              Your ZIP helps the assistant understand your local civic context.
            </p>

            {/* ZIP */}
            <label style={styles.label}>ZIP Code</label>
            <input
              style={styles.input}
              placeholder="Enter ZIP code"
              value={zip}
              onChange={(e) => {
                const value = e.target.value;
                setZip(value);
                validateZip(value);
              }}
            />

            {/* Read-only City */}
            <label style={styles.label}>City</label>
            <input
              style={styles.input}
              value={cityState.split(", ")[0] || ""}
              readOnly
            />

            {/* Read-only State */}
            <label style={styles.label}>State</label>
            <input
              style={styles.input}
              value={cityState.split(", ")[1] || ""}
              readOnly
            />

            {/* Continue */}
            <button
              style={
                zipValid && ageRange ? styles.button : styles.buttonDisabled
              }
              onClick={zipValid && ageRange ? continueToChat : null}
            >
              Continue to Civic AI
            </button>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <span style={styles.footerText}>
              Built for American voters. Non‑partisan. No endorsements. Just clarity.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // CHAT SCREEN
  return (
    <div style={styles.appShell}>
      <div style={styles.container}>
        {/* HERO */}
        <div style={styles.hero}>
          <div style={styles.star1}>★</div>
          <div style={styles.star2}>★</div>
          <div style={styles.star3}>★</div>

          <div style={styles.heroGlass}>
            <h1 style={styles.heroTitle}>Know Your Ballot</h1>
            <div style={styles.heroGoldLine}></div>
            <p style={styles.heroTag}>
              The Civic Clarity Project — Guiding American Choices
            </p>
            <p style={styles.heroLocation}>
              Serving voters in {cityState || "your community"} ({zip || "ZIP unknown"})
            </p>
          </div>
        </div>

        {/* Question */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Ask the Civic AI</h2>
          <p style={styles.sectionText}>
            Ask anything about your ballot, offices, issues, or civic process. The
            assistant explains — it never tells you who to vote for.
          </p>
          <textarea
            style={styles.textarea}
            placeholder="Example: “What does the county commissioner actually do?”"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            style={question ? styles.button : styles.buttonDisabled}
            onClick={question ? askAI : null}
          >
            {loadingAI ? "Thinking..." : "Get Civic Clarity"}
          </button>
        </div>

        {/* Answer */}
        {answer && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>AI Explanation</h2>
            <p style={styles.answerText}>{answer}</p>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            KnowYourBallot does not endorse candidates or parties. It exists to help you
            understand — so you can decide.
          </span>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  appShell: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #E3ECFF 0%, #FFFFFF 40%, #F5F5F5 100%)",
    padding: "20px",
    boxSizing: "border-box"
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto",
    fontFamily:
      "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
  },

  /* HERO */
  hero: {
    background: "linear-gradient(135deg, #1A2B5F 0%, #2C3E7A 40%, #B22234 100%)",
    padding: "40px 20px",
    borderRadius: "20px",
    marginBottom: "25px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
  },
  heroGlass: {
    backdropFilter: "blur(18px)",
    background: "rgba(255,255,255,0.22)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
  },
  heroTitle: {
    fontSize: "34px",
    fontWeight: "700",
    color: "#FFFFFF",
    margin: 0,
    letterSpacing: "0.5px"
  },
  heroGoldLine: {
    width: "60px",
    height: "4px",
    background: "linear-gradient(90deg, #D4AF37, #F7E27A)",
    borderRadius: "4px",
    marginTop: "12px",
    marginBottom: "10px"
  },
  heroTag: {
    fontSize: "16px",
    color: "#F0F4FF",
    marginTop: "8px",
    opacity: 0.95
  },
  heroLocation: {
    fontSize: "14px",
    color: "#F9FAFB",
    marginTop: "10px",
    opacity: 0.9
  },

  /* LIQUID GOLD STARS */
  star1: {
    position: "absolute",
    top: "18px",
    left: "22px",
    fontSize: "26px",
    color: "white",
    opacity: 0.22,
    textShadow: "0 0 6px rgba(212,175,55,0.9)"
  },
  star2: {
    position: "absolute",
    top: "60px",
    right: "30px",
    fontSize: "34px",
    color: "white",
    opacity: 0.18,
    textShadow: "0 0 8px rgba(212,175,55,0.9)"
  },
  star3: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "28px",
    color: "white",
    opacity: 0.20,
    textShadow: "0 0 7px rgba(212,175,55,0.9)"
  },

  /* CARDS */
  card: {
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
    marginBottom: "25px",
    border: "1px solid rgba(229,231,235,0.8)"
  },

  sectionTitle: {
    fontSize: "20px",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#1A2B5F"
  },
  sectionText: {
    fontSize: "14px",
    marginBottom: "16px",
    lineHeight: "1.5",
    color: "#4B5563"
  },

  /* INPUTS */
  label: {
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
    marginTop: "10px",
    display: "block",
    color: "#374151"
  },
  input: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(26,43,95,0.35)",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    marginBottom: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    outline: "none"
  },
  textarea: {
    width: "100%",
    height: "140px",
    padding: "14px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(26,43,95,0.35)",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    marginBottom: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    outline: "none",
    resize: "vertical"
  },

  /* BUTTONS */
  button: {
    width: "100%",
    padding: "14px",
    fontSize: "17px",
    fontWeight: "600",
    background: "linear-gradient(90deg, #1A2B5F, #2C3E7A)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 3px 12px rgba(0,0,0,0.25)",
    transition: "transform 0.15s ease"
  },
  buttonDisabled: {
    width: "100%",
    padding: "14px",
    fontSize: "17px",
    fontWeight: "600",
    background: "#9CA3AF",
    color: "white",
    borderRadius: "12px",
    cursor: "not-allowed",
    opacity: 0.7
  },

  answerText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#111827",
    whiteSpace: "pre-wrap"
  },

  /* FOOTER */
  footer: {
    marginTop: "10px",
    textAlign: "center"
  },
  footerText: {
    fontSize: "12px",
    color: "#6B7280"
  }
};

export default App;
