// App.js — KnowYourBallot / The Civic Clarity Project — Guiding American Choices
// Liquid UX + Hero-Only Liquid Gold + subtle patriotic palette

import React, { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://shimmering-success-production-bd96.up.railway.app";
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

const starterPrompts = [
  "Why should I vote?",
  "What are the top issues being discussed in my district?",
  "What are voters asking about today?",
  "How can I understand the choices on my ballot?",
  "What does each office on my ballot do?",
  "How do I compare ballot positions fairly?"
];

function getFollowUpPrompts(firstQuestion, topics, cityState) {
  const location = cityState || "my community";
  const topic = topics[0];

  if (topic) {
    return [
      `How could the ${topic.toLowerCase()} affect voters in ${location}?`,
      `What are the main facts about the ${topic.toLowerCase()} I should verify?`,
      `What does the ${topic.toLowerCase()} look like at the local level?`,
      `What are the different perspectives on the ${topic.toLowerCase()}?`
    ];
  }

  if (/measure|proposition|referendum|ballot/i.test(firstQuestion)) {
    return [
      "What would this measure change?",
      "What are the main arguments on each side?",
      "Who would be affected by this proposal?",
      "What should I verify in the official ballot text?"
    ];
  }

  if (/candidate|office|mayor|governor|commissioner|representative|senator/i.test(firstQuestion)) {
    return [
      "What are the responsibilities of this office?",
      "What factual differences can I verify between the candidates?",
      "What questions can help me evaluate their public positions?",
      "Where can I find official candidate information?"
    ];
  }

  if (/vote|registration|polling|mail|election day/i.test(firstQuestion)) {
    return [
      "What are the key dates I should know?",
      "How does voting in this election work?",
      "What identification or documents might I need?",
      "Where can I find official voting instructions?"
    ];
  }

  return [
    "Can you explain that in simpler terms?",
    "What are the strongest facts to verify?",
    "How does this affect local government?",
    "Where can I learn more from official sources?"
  ];
}

function App() {
  const [userId] = useState(() => {
    const savedUserId = window.localStorage.getItem("know-your-ballot-user-id");
    if (savedUserId) return savedUserId;
    const newUserId = crypto.randomUUID();
    window.localStorage.setItem("know-your-ballot-user-id", newUserId);
    return newUserId;
  });

  // Screen control
  const [screen, setScreen] = useState("form");

  // Demographics
  const [ageRange, setAgeRange] = useState("");
  const [politicalLean, setPoliticalLean] = useState("");
  const [topIssues, setTopIssues] = useState([]);

  // ZIP + city/state
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [cityState, setCityState] = useState("");
  const [zipValid, setZipValid] = useState(false);

  // Ballot lookup
  const [ballot, setBallot] = useState(null);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [ballotError, setBallotError] = useState("");
  const [loadingBallot, setLoadingBallot] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  // AI chat
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [conversation, setConversation] = useState([]);
  const [conversationSources, setConversationSources] = useState([]);
  const conversationEndRef = useRef(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [loadingAI, setLoadingAI] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const firstQuestion = conversation.find((message) => message.role === "user")?.content || "";
  const ballotOffices = (ballot?.contests || [])
    .map((contest) => contest.office || contest.referendumTitle)
    .filter(Boolean);
  const personalTopics = [...new Set([...topIssues, ...trendingTopics, ...ballotOffices])];
  const suggestedPrompts = firstQuestion
    ? getFollowUpPrompts(firstQuestion, personalTopics, cityState)
    : personalTopics.length
      ? [
          `What are voters asking about the ${personalTopics[0].toLowerCase()} in ${cityState || "my area"}?`,
          `What should I know about the ${personalTopics[0].toLowerCase()} before voting?`,
          `What are the key facts about the ${personalTopics[0].toLowerCase()}?`,
          ...starterPrompts.slice(0, 3)
        ]
      : starterPrompts;
  const currentPrompt = suggestedPrompts[promptIndex % suggestedPrompts.length];

  useEffect(() => {
    setPromptIndex(0);
  }, [firstQuestion]);

  useEffect(() => {
    const promptTimer = window.setInterval(() => {
      setPromptIndex((index) => index + 1);
    }, 5000);

    return () => window.clearInterval(promptTimer);
  }, [suggestedPrompts.length]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation, loadingAI]);

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent("Explore your ballot and build civic clarity with Know Your Ballot.");
  const socialLinks = [
    { name: "X", mark: "X", url: `https://x.com/intent/post?text=${shareText}&url=${shareUrl}` },
    { name: "Bluesky", mark: "b", url: `https://bsky.app/intent/compose?text=${shareText}%20${shareUrl}` },
    { name: "Facebook", mark: "f", url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { name: "LinkedIn", mark: "in", url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
    { name: "WhatsApp", mark: "wa", url: `https://wa.me/?text=${shareText}%20${shareUrl}` },
    { name: "Instagram", mark: "ig", url: "https://www.instagram.com/" },
    { name: "TikTok", mark: "tk", url: "https://www.tiktok.com/" },
    { name: "Reddit", mark: "r", url: `https://www.reddit.com/submit?url=${shareUrl}&title=${shareText}` }
  ];

  const copySiteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied");
    } catch {
      setShareStatus("Copy the site link from your browser");
    }
    window.setTimeout(() => setShareStatus(""), 2500);
  };

  const shareMenu = (
    <div style={styles.shareMenu}>
      <div style={styles.socialGrid}>
        {socialLinks.map((social) => (
          <a
            key={social.name}
            style={styles.socialLink}
            href={social.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => setShareMenuOpen(false)}
            title={`Share on ${social.name}`}
          >
            <span style={styles.socialMark} aria-hidden="true">{social.mark}</span>
            <span>{social.name}</span>
          </a>
        ))}
      </div>
      <button type="button" style={styles.copyLink} onClick={copySiteLink}>
        Copy link
      </button>
    </div>
  );

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

  // Continue → save profile → load ballot
  const continueToBallot = async () => {
    setLoadingBallot(true);
    setBallotError("");

    try {
      const profileRes = await fetch(`${API_BASE_URL}/user/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ageRange,
          politicalLean,
          topIssues,
          zip,
          cityState,
          captchaToken
        })
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        setBallotError(profileData.error || "We could not verify your request.");
        setScreen("form");
        return;
      }

      const [city, state] = cityState.split(", ");
      const ballotRes = await fetch(`${API_BASE_URL}/ballot/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), city, state, zip })
      });
      const ballotData = await ballotRes.json();

      if (!ballotRes.ok) {
        setBallotError("No ballot information is available for this ZIP code at this time.");
      } else {
        setBallot(ballotData);
        const ballotSources = [
          ballotData.electionOffice?.ballotInfoUrl,
          ...(ballotData.contests || []).flatMap((contest) =>
            (contest.sources || []).map((source) => source.url).filter(Boolean)
          )
        ].filter((url, index, urls) => url && urls.indexOf(url) === index);
        setConversationSources(ballotSources);
      }

      const conversationRes = await fetch(
        `${API_BASE_URL}/conversation/${userId}?zip=${encodeURIComponent(zip)}`
      );
      if (conversationRes.ok) {
        const conversationData = await conversationRes.json();
        setConversation(conversationData.messages || []);
      }

      const insightsRes = await fetch(
        `${API_BASE_URL}/insights/trending?zip=${encodeURIComponent(zip)}`
      );
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setTrendingTopics(insightsData.topics || []);
      }

      setScreen("ballot");
    } catch {
      setBallotError("We could not load your ballot. Please try again.");
      setScreen("ballot");
    } finally {
      setLoadingBallot(false);
    }
  };

  // Ask AI
  const askAI = async () => {
    const submittedQuestion = question.trim();
    if (!submittedQuestion || loadingAI) return;

    setLoadingAI(true);
    setAnswer("");
    setQuestion("");
    setConversation((messages) => [
      ...messages,
      { role: "user", content: submittedQuestion }
    ]);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          zip,
          cityState,
          ageRange,
          politicalLean,
          topIssues,
          question: submittedQuestion,
          sourceUrls: conversationSources
        })
      });

      const data = await res.json();
      const responseText = data.answer || data.error || "The Civic AI could not respond right now.";
      setAnswer(responseText);
      if (Array.isArray(data.sources) && data.sources.length > 0) {
        setConversationSources(data.sources);
      }
      setConversation((messages) => [
        ...messages,
        { role: "assistant", content: responseText }
      ]);
    } catch {
      const responseText = "The Civic AI could not respond right now. Please try again.";
      setAnswer(responseText);
      setConversation((messages) => [
        ...messages,
        { role: "assistant", content: responseText }
      ]);
    }

    setLoadingAI(false);
  };

  const aiPanel = (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>Ask the Civic AI</h2>
      <p style={styles.sectionText}>
        Explore an office, issue, or process. The assistant explains and never tells you who to vote for.
      </p>
      {conversation.length > 0 && (
        <div style={styles.conversation} aria-live="polite">
          {conversation.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={message.role === "user" ? styles.userMessage : styles.assistantMessage}
            >
              <span style={styles.messageLabel}>
                {message.role === "user" ? "You" : "Civic AI"}
              </span>
              <p style={styles.messageText}>{message.content}</p>
            </div>
          ))}
          {loadingAI && (
            <div style={styles.assistantMessage}>
              <span style={styles.messageLabel}>Civic AI</span>
              <p style={styles.messageText}>Reviewing your question...</p>
            </div>
          )}
          <div ref={conversationEndRef} />
        </div>
      )}
      <textarea
        style={styles.textarea}
        placeholder={currentPrompt}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) askAI();
        }}
      />
      <button
        style={question.trim() && !loadingAI ? styles.button : styles.buttonDisabled}
        onClick={question.trim() && !loadingAI ? askAI : null}
      >
        {loadingAI ? "Thinking..." : conversation.length ? "Ask a follow-up" : "Get Civic Clarity"}
      </button>
        {conversationSources.length > 0 && (
          <div style={styles.sources}>
            <span style={styles.sourcesLabel}>Sources</span>
            {conversationSources.map((sourceUrl) => (
              <a key={sourceUrl} href={sourceUrl} target="_blank" rel="noreferrer" style={styles.sourceLink}>
                {new URL(sourceUrl).hostname.replace(/^www\./, "")}
              </a>
            ))}
          </div>
        )}
      <div style={styles.promptRow}>
        <span style={styles.promptLabel}>{conversation.length ? "Try a follow-up" : "Try asking"}</span>
        <button
          type="button"
          style={styles.promptSuggestion}
          onClick={() => setQuestion(currentPrompt)}
        >
          {currentPrompt}
        </button>
      </div>
    </div>
  );

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
              <button
                type="button"
                style={styles.shareButton}
                onClick={() => setShareMenuOpen((isOpen) => !isOpen)}
                title="Share Know Your Ballot"
                aria-label="Share Know Your Ballot"
              >
                <span aria-hidden="true">↗</span> Share this site
              </button>
              {shareMenuOpen && shareMenu}
              {shareStatus && <p style={styles.shareStatus}>{shareStatus}</p>}
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

            <label style={styles.label}>Exact address (optional)</label>
            <input
              style={styles.input}
              placeholder="Add for a more precise ballot"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
            />
            <p style={styles.helperText}>
              Without an address, results are general to your ZIP and may not match every district.
            </p>

            <div style={styles.captchaWrap}>
              {RECAPTCHA_SITE_KEY ? (
                <ReCAPTCHA
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token || "")}
                  onExpired={() => setCaptchaToken("")}
                />
              ) : (
                <p style={styles.captchaMessage}>Verification is not configured yet.</p>
              )}
            </div>
            {ballotError && <p style={styles.infoText}>{ballotError}</p>}

            {/* Continue */}
            <button
              style={
                zipValid && ageRange && captchaToken && !loadingBallot
                  ? styles.button
                  : styles.buttonDisabled
              }
              onClick={zipValid && ageRange && captchaToken && !loadingBallot ? continueToBallot : null}
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

  // BALLOT SCREEN
  if (screen === "ballot") {
    const contests = ballot?.contests || [];

    return (
      <div style={styles.appShell}>
        <div style={styles.container}>
          <div style={styles.hero}>
            <div style={styles.star1}>★</div>
            <div style={styles.star2}>★</div>
            <div style={styles.star3}>★</div>
            <div style={styles.heroGlass}>
              <p style={styles.eyebrow}>Your civic snapshot</p>
              <h1 style={styles.heroTitle}>Know Your Ballot</h1>
              <div style={styles.heroGoldLine}></div>
              <p style={styles.heroLocation}>{cityState} · {zip}</p>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              {ballot?.election?.name || "Ballot information"}
            </h2>
            {ballot?.election?.electionDay && (
              <p style={styles.electionDate}>Election day: {ballot.election.electionDay}</p>
            )}
            {ballot?.status === "unverified" && (
              <div style={styles.previewNotice}>
                <strong>Unverified preview</strong>
                <span>
                  Information may be incomplete or general. Validate the exact contests, candidates, and measures with your official election office before voting.
                </span>
              </div>
            )}
            {ballot?.specificity !== "exact" && (
              <p style={styles.caveat}>
                General ZIP-based information. It may not include every county or district contest for your address.
              </p>
            )}
            {ballotError && <p style={styles.infoText}>{ballotError}</p>}
            {!ballotError && !contests.length && (
              <p style={styles.infoText}>
                {ballot?.status === "unverified"
                  ? "No verified contest details are available for this lookup."
                  : "No ballot information is available for this ZIP code at this time."}
              </p>
            )}
            {!!contests.length && (
              <div style={styles.contestList}>
                {contests.map((contest, index) => (
                  <button
                    key={`${contest.office || contest.referendumTitle || "contest"}-${index}`}
                    style={styles.contest}
                    onClick={() => setQuestion(`Please explain the ${contest.office || contest.referendumTitle || "contest"} on my ballot.`)}
                  >
                    <span style={styles.contestType}>{contest.type || "Contest"}</span>
                    <strong style={styles.contestTitle}>
                      {contest.office || contest.referendumTitle || "Ballot measure"}
                    </strong>
                    {contest.district?.name && (
                      <span style={styles.contestMeta}>{contest.district.name}</span>
                    )}
                    {contest.candidates?.length > 0 && (
                      <span style={styles.contestMeta}>
                        {contest.candidates.map((candidate) => candidate.name).join(" · ")}
                      </span>
                    )}
                    <span style={styles.exploreHint}>Ask about this →</span>
                  </button>
                ))}
              </div>
            )}
            {ballot?.electionOffice?.ballotInfoUrl && (
              <a
                style={styles.sourceLink}
                href={ballot.electionOffice.ballotInfoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open official ballot information
              </a>
            )}
            {ballot?.officialElectionUrl && !ballot?.electionOffice?.ballotInfoUrl && (
              <a
                style={styles.sourceLink}
                href={ballot.officialElectionUrl}
                target="_blank"
                rel="noreferrer"
              >
                Verify details with your official election office
              </a>
            )}
          </div>

          {aiPanel}

          <div style={styles.footer}>
            <span style={styles.footerText}>
              Ballot data comes from official election sources. KnowYourBallot does not endorse candidates or parties.
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
            <button
              type="button"
              style={styles.shareButton}
              onClick={() => setShareMenuOpen((isOpen) => !isOpen)}
              title="Share Know Your Ballot"
              aria-label="Share Know Your Ballot"
            >
              <span aria-hidden="true">↗</span> Share this site
            </button>
            {shareMenuOpen && shareMenu}
            {shareStatus && <p style={styles.shareStatus}>{shareStatus}</p>}
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
  shareButton: {
    marginTop: "16px",
    padding: "9px 13px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#FFFFFF",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: "10px",
    cursor: "pointer"
  },
  shareStatus: {
    display: "inline-block",
    fontSize: "12px",
    color: "#F7E27A",
    margin: "8px 0 0 10px"
  },
  shareMenu: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(255,255,255,0.65)",
    boxShadow: "0 5px 18px rgba(0,0,0,0.18)"
  },
  socialGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px"
  },
  socialLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    minWidth: 0,
    padding: "7px 3px",
    color: "#1A2B5F",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: "600"
  },
  socialMark: {
    display: "grid",
    placeItems: "center",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#1A2B5F",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "700"
  },
  copyLink: {
    width: "100%",
    marginTop: "10px",
    padding: "9px",
    border: "1px solid rgba(26,43,95,0.24)",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#1A2B5F",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
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
  eyebrow: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.4px",
    textTransform: "uppercase",
    color: "#B22234",
    marginBottom: "8px"
  },
  sectionText: {
    fontSize: "14px",
    marginBottom: "16px",
    lineHeight: "1.5",
    color: "#4B5563"
  },
  helperText: {
    fontSize: "12px",
    lineHeight: "1.4",
    color: "#6B7280",
    marginTop: "-4px",
    marginBottom: "12px"
  },
  captchaWrap: {
    minHeight: "78px",
    display: "flex",
    alignItems: "center",
    margin: "4px 0 12px",
    overflowX: "auto"
  },
  captchaMessage: {
    fontSize: "12px",
    color: "#7C2D12",
    margin: 0
  },
  electionDate: {
    fontSize: "14px",
    color: "#4B5563",
    marginBottom: "16px"
  },
  caveat: {
    fontSize: "13px",
    lineHeight: "1.45",
    color: "#7C2D12",
    background: "rgba(234, 88, 12, 0.09)",
    borderLeft: "3px solid #EA580C",
    padding: "10px 12px",
    marginBottom: "16px"
  },
  previewNotice: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "13px",
    lineHeight: "1.45",
    color: "#7C2D12",
    background: "rgba(234, 88, 12, 0.09)",
    borderLeft: "3px solid #EA580C",
    borderRadius: "0 9px 9px 0",
    padding: "11px 12px",
    marginBottom: "14px"
  },
  infoText: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#4B5563",
    background: "rgba(26,43,95,0.06)",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "12px"
  },
  contestList: {
    display: "grid",
    gap: "10px"
  },
  contest: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    textAlign: "left",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(26,43,95,0.16)",
    background: "rgba(248,250,252,0.86)",
    cursor: "pointer",
    color: "#111827"
  },
  contestType: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: "#B22234",
    marginBottom: "5px"
  },
  contestTitle: {
    fontSize: "16px",
    lineHeight: "1.3",
    color: "#1A2B5F",
    marginBottom: "4px"
  },
  contestMeta: {
    fontSize: "13px",
    lineHeight: "1.4",
    color: "#4B5563"
  },
  exploreHint: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#1A2B5F",
    marginTop: "9px"
  },
  sourceLink: {
    display: "inline-block",
    marginTop: "16px",
    color: "#1A2B5F",
    fontSize: "13px",
    fontWeight: "600"
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
  answerBlock: {
    borderTop: "1px solid rgba(26,43,95,0.12)",
    marginTop: "18px",
    paddingTop: "16px"
  },
  conversation: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "440px",
    overflowY: "auto",
    marginBottom: "16px",
    padding: "2px"
  },
  userMessage: {
    alignSelf: "flex-end",
    width: "min(88%, 500px)",
    padding: "12px 14px",
    borderRadius: "14px 14px 4px 14px",
    background: "#1A2B5F",
    color: "#FFFFFF"
  },
  assistantMessage: {
    alignSelf: "flex-start",
    width: "min(92%, 520px)",
    padding: "12px 14px",
    borderRadius: "14px 14px 14px 4px",
    background: "rgba(26,43,95,0.08)",
    border: "1px solid rgba(26,43,95,0.12)",
    color: "#111827"
  },
  messageLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    marginBottom: "5px",
    opacity: 0.75
  },
  messageText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.55",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere"
  },
  promptRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
    minWidth: 0
  },
  promptLabel: {
    flexShrink: 0,
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    color: "#B22234"
  },
  promptSuggestion: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: "7px 10px",
    border: "1px solid rgba(26,43,95,0.2)",
    borderRadius: "9px",
    background: "rgba(248,250,252,0.9)",
    color: "#1A2B5F",
    fontSize: "12px",
    textAlign: "left",
    cursor: "pointer"
  },
  answerTitle: {
    fontSize: "16px",
    color: "#1A2B5F",
    marginBottom: "8px"
  },
  sources: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "12px",
    paddingTop: "11px",
    borderTop: "1px solid rgba(26,43,95,0.1)"
  },
  sourcesLabel: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    color: "#B22234"
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
