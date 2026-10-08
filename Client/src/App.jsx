import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "touchgrass.progress.v1";
const SKILLS = ["Noticing", "Connection", "Playfulness", "Movement"];
const PLACES = [
  { value: "garden", label: "A garden or park", icon: "✿" },
  { value: "market", label: "A market or shop", icon: "⌂" },
  { value: "neighborhood", label: "Around my neighborhood", icon: "↗" },
  { value: "other", label: "Somewhere else", icon: "☼" },
];
const ENERGY_LEVELS = [
  { value: "low", label: "Low-key", detail: "Keep it easy" },
  { value: "medium", label: "A little spark", detail: "A gentle nudge" },
  { value: "high", label: "Up for anything", detail: "Bring it on" },
];
const SOCIAL_LEVELS = [
  { value: "solo", label: "Just me", detail: "No interaction needed" },
  { value: "gentle", label: "A little connection", detail: "Only if it feels right" },
  { value: "open", label: "Feeling social", detail: "Open to a chat" },
];
const BADGES = [
  { id: "first-step", title: "First steps", description: "Complete your first quest", icon: "✦", test: (p) => p.completed >= 1 },
  { id: "noticer", title: "Little noticer", description: "Complete 5 noticing quests", icon: "◉", test: (p) => p.skills.Noticing >= 5 },
  { id: "good-neighbor", title: "Good neighbor", description: "Complete 5 connection quests", icon: "♡", test: (p) => p.skills.Connection >= 5 },
  { id: "playful", title: "Finding the fun", description: "Complete 5 playfulness quests", icon: "☀", test: (p) => p.skills.Playfulness >= 5 },
  { id: "wanderer", title: "Wander a little", description: "Complete 5 movement quests", icon: "↗", test: (p) => p.skills.Movement >= 5 },
];
const PRAISE = [
  "You made a little room for the world today. That counts.",
  "Look at you, out here collecting tiny moments.",
  "A small adventure is still an adventure. Nicely done.",
  "You showed up for yourself. Take that feeling with you.",
];

function readProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      completed: Number.isFinite(stored?.completed) ? stored.completed : 0,
      points: Number.isFinite(stored?.points) ? stored.points : 0,
      skills: Object.fromEntries(SKILLS.map((skill) => [skill, Number.isFinite(stored?.skills?.[skill]) ? stored.skills[skill] : 0])),
      outings: Number.isFinite(stored?.outings) ? stored.outings : 0,
    };
  } catch {
    return { completed: 0, points: 0, skills: Object.fromEntries(SKILLS.map((skill) => [skill, 0])), outings: 0 };
  }
}

async function getQuests(preferences, exclude = []) {
  const response = await fetch("/api/quests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...preferences, exclude }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "We couldn't make your quests right now. Please try again.");
  }
  return response.json();
}

function App() {
  const [progress, setProgress] = useState(readProgress);
  const [screen, setScreen] = useState("start");
  const [place, setPlace] = useState("garden");
  const [duration, setDuration] = useState(30);
  const [energy, setEnergy] = useState("medium");
  const [social, setSocial] = useState("gentle");
  const [quests, setQuests] = useState([]);
  const [generationMode, setGenerationMode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingQuest, setSavingQuest] = useState("");
  const [reflection, setReflection] = useState("");
  const earnedBadges = useMemo(() => BADGES.filter((badge) => badge.test(progress)), [progress]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const preferences = { place, duration, energy, social };

  async function beginOuting() {
    setLoading(true);
    setError("");
    try {
      const result = await getQuests(preferences);
      setQuests(result.quests.map((quest) => ({ ...quest, status: "open" })));
      setGenerationMode(result.mode);
      setScreen("quests");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function replaceQuest(questId) {
    setSavingQuest(questId);
    setError("");
    const current = quests.find((quest) => quest.id === questId);
    try {
      const result = await getQuests(preferences, quests.map((quest) => quest.title));
      const replacement = result.quests.find((quest) => quest.skill === current.skill) || result.quests[0];
      setQuests((currentQuests) => currentQuests.map((quest) => (
        quest.id === questId ? { ...replacement, status: "open" } : quest
      )));
      setGenerationMode(result.mode);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingQuest("");
    }
  }

  function setQuestStatus(questId, status) {
    setQuests((current) => current.map((quest) => quest.id === questId ? { ...quest, status } : quest));
  }

  function finishOuting() {
    const completedQuests = quests.filter((quest) => quest.status === "done");
    setProgress((current) => {
      const updated = { ...current, skills: { ...current.skills } };
      updated.completed += completedQuests.length;
      updated.points += completedQuests.reduce((sum, quest) => sum + (quest.points || 10), 0);
      updated.outings += 1;
      completedQuests.forEach((quest) => {
        if (SKILLS.includes(quest.skill)) updated.skills[quest.skill] += 1;
      });
      return updated;
    });
    setReflection(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    setScreen("complete");
  }

  function startOver() {
    setQuests([]);
    setError("");
    setScreen("start");
  }

  function resetProgress() {
    if (!window.confirm("Reset your progress on this device? This can't be undone.")) return;
    const blank = { completed: 0, points: 0, skills: Object.fromEntries(SKILLS.map((skill) => [skill, 0])), outings: 0 };
    setProgress(blank);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blank));
  }

  const completedThisOuting = quests.filter((quest) => quest.status === "done").length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={startOver} aria-label="TouchGrass home">
          <span className="brand-mark">tg<span>✳</span></span>
          <span>touchgrass</span>
        </button>
        <div className="topbar-right">
          <button className="text-button progress-link" onClick={() => setScreen(screen === "progress" ? "start" : "progress")}>
            My progress <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <main>
        {screen === "start" && (
          <section className="start-layout">
            <div className="intro">
              <span className="eyebrow"><span className="sun-icon">☼</span> A little outside time</span>
              <h1>Make room for<br /><em>the real world.</em></h1>
              <p className="intro-copy">A few gentle quests to help you notice more, feel a little lighter, and come back to yourself.</p>
              <div className="doodle" aria-hidden="true">
                <svg viewBox="0 0 280 210" fill="none">
                  <path d="M24 173c48-23 74-12 112-5 39 8 72-11 121 1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M81 163c-2-31 2-60 20-83 7 18 8 38 2 54 13-20 29-34 49-41-4 28-20 50-48 64" fill="#bad69a" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M181 167c-5-28 2-52 20-72 5 17 4 33-3 47 14-16 29-26 46-29-6 24-23 41-49 52" fill="#e1bf7f" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M181 55c0-14 12-26 26-26s25 12 25 26c0 18-25 33-25 33s-26-15-26-33Z" fill="#e6a982" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M194 55c0-6 5-11 11-11" stroke="#fff8ea" strokeWidth="3" strokeLinecap="round" />
                  <path d="M48 124c-5-9-5-20 0-29 5 9 5 20 0 29Zm0 0c-8-5-18-5-26 0 8 5 18 5 26 0Zm0 0c8-5 18-5 26 0-8 5-18 5-26 0Z" fill="#e6bd62" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="48" cy="124" r="4" fill="#f8f3df" stroke="currentColor" strokeWidth="2" />
                  <path d="M133 36c-4-5-4-12 0-17 4 5 4 12 0 17Zm0 0c-5-3-11-3-16 0 5 3 11 3 16 0Zm0 0c5-3 11-3 16 0-5 3-11 3-16 0Z" fill="#a9c98a" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="setup-card">
              <div className="card-heading">
                <span className="step-label">LET'S SET THE SCENE</span>
                <span className="tiny-spark">✳</span>
              </div>
              <label className="field-label">Where are you heading?</label>
              <div className="place-grid">
                {PLACES.map((option) => (
                  <button key={option.value} aria-pressed={place === option.value} className={`place-option ${place === option.value ? "selected" : ""}`} onClick={() => setPlace(option.value)}>
                    <span className="place-icon">{option.icon}</span><span>{option.label}</span>
                  </button>
                ))}
              </div>

              <div className="range-label">
                <label className="field-label" htmlFor="duration">How much time have you got?</label>
                <span className="duration-value">{duration} min</span>
              </div>
              <input id="duration" className="duration-range" type="range" min="10" max="60" step="5" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
              <div className="range-endpoints"><span>10 min</span><span>60 min</span></div>

              <label className="field-label group-label">What's your energy like?</label>
              <div className="choice-row">
                {ENERGY_LEVELS.map((option) => <ChoiceButton key={option.value} option={option} selected={energy === option.value} onClick={() => setEnergy(option.value)} />)}
              </div>

              <label className="field-label group-label">How social are you feeling?</label>
              <div className="choice-row">
                {SOCIAL_LEVELS.map((option) => <ChoiceButton key={option.value} option={option} selected={social === option.value} onClick={() => setSocial(option.value)} />)}
              </div>

              {error && <p className="error-message" role="alert">{error}</p>}
              <button className="primary-button generate-button" onClick={beginOuting} disabled={loading}>
                {loading ? <><span className="spinner" /> Finding your little adventure…</> : <>Find my little adventure <span aria-hidden="true">→</span></>}
              </button>
              <p className="card-footnote">No perfect day needed. Just start where you are.</p>
            </div>
          </section>
        )}

        {screen === "quests" && (
          <section className="quest-page">
            <button className="back-link" onClick={startOver}>← Change my plan</button>
            <div className="quest-header">
              <span className="eyebrow"><span className="sun-icon">☼</span> Your little adventure</span>
              <h1>Out there, <em>your way.</em></h1>
              <p>Three small invitations. Do what feels good; skip anything that doesn't.</p>
              <div className="quest-meta"><span>⌖ {PLACES.find((option) => option.value === place)?.label}</span><span>◷ {duration} minutes</span></div>
            </div>
            {generationMode === "ollama" && <div className="model-note">✳ Freshly generated for these settings by your local model.</div>}
            {error && <p className="error-message quest-error" role="alert">{error}</p>}
            <div className="quest-list">
              {quests.map((quest, index) => (
                <article className={`quest-card ${quest.status === "done" ? "quest-done" : quest.status === "skipped" ? "quest-skipped" : ""}`} key={quest.id}>
                  <div className={`quest-symbol symbol-${quest.skill.toLowerCase()}`}>{quest.icon || ["◉", "♡", "✳"][index % 3]}</div>
                  <div className="quest-main">
                    <div className="quest-tags"><span className={`skill-tag tag-${quest.skill.toLowerCase()}`}>{quest.skill}</span><span>{quest.minutes} min</span><span>{quest.difficulty}</span></div>
                    <h2>{quest.title}</h2>
                    <p>{quest.description}</p>
                    {quest.status === "done" && <span className="done-label">✓ Done · +{quest.points} points</span>}
                    {quest.status === "skipped" && <span className="skipped-label">Skipped, and that's okay</span>}
                  </div>
                  <div className="quest-actions">
                    {quest.status === "open" ? <>
                      <button className="complete-button" onClick={() => setQuestStatus(quest.id, "done")}>I did it <span>✓</span></button>
                      <button className="skip-button" onClick={() => setQuestStatus(quest.id, "skipped")}>Skip</button>
                      <button className="swap-button" aria-label={`Swap ${quest.title}`} title="Try another quest" disabled={Boolean(savingQuest)} onClick={() => replaceQuest(quest.id)}>{savingQuest === quest.id ? <span className="mini-spinner" /> : "↻"}<span className="swap-text">Swap</span></button>
                    </> : <button className="undo-button" onClick={() => setQuestStatus(quest.id, "open")}>Undo</button>}
                  </div>
                </article>
              ))}
            </div>
            <div className="quest-footer">
              <span>{completedThisOuting} of {quests.length} tried <span className="progress-dots">{quests.map((quest) => <i key={quest.id} className={quest.status === "done" ? "dot-done" : ""} />)}</span></span>
              <button className="primary-button" onClick={finishOuting}>Finish my outing <span>→</span></button>
            </div>
            <p className="gentle-reminder">There’s no wrong way to do this. Being out here is already the point.</p>
          </section>
        )}

        {screen === "complete" && (
          <section className="completion-page">
            <div className="celebration">✳</div>
            <span className="eyebrow">A moment for you</span>
            <h1>You made it <em>outside.</em></h1>
            <p className="completion-copy">{reflection}</p>
            <div className="completion-summary">
              <div><span className="summary-value">{completedThisOuting}</span><span className="summary-label">quests tried</span></div>
              <div><span className="summary-value">+{quests.filter((quest) => quest.status === "done").reduce((sum, quest) => sum + (quest.points || 10), 0)}</span><span className="summary-label">little points</span></div>
              <div><span className="summary-value">{progress.completed}</span><span className="summary-label">all-time quests</span></div>
            </div>
            <div className="completion-actions">
              <button className="primary-button" onClick={startOver}>Plan another outing <span>→</span></button>
              <button className="secondary-button" onClick={() => setScreen("progress")}>See my progress</button>
            </div>
            <p className="local-note">Your progress is saved only on this device.</p>
          </section>
        )}

        {screen === "progress" && (
          <section className="progress-page">
            <button className="back-link" onClick={() => setScreen("start")}>← Back to home</button>
            <div className="progress-header">
              <span className="eyebrow"><span className="sun-icon">☼</span> Your own little garden</span>
              <h1>Look how you're <em>growing.</em></h1>
              <p>No comparisons. Just your moments, adding up.</p>
            </div>
            <div className="stat-cards">
              <div className="stat-card"><span className="stat-icon">✳</span><span className="stat-number">{progress.completed}</span><span className="stat-label">quests tried</span></div>
              <div className="stat-card"><span className="stat-icon">✦</span><span className="stat-number">{progress.points}</span><span className="stat-label">little points</span></div>
              <div className="stat-card"><span className="stat-icon">☼</span><span className="stat-number">{progress.outings}</span><span className="stat-label">outings enjoyed</span></div>
            </div>
            <section className="skills-section">
              <div className="section-title"><div><span className="step-label">YOUR SKILLS</span><h2>Little things you're growing</h2></div><span className="skill-caption">Each quest adds a leaf</span></div>
              <div className="skill-list">{SKILLS.map((skill) => {
                const count = progress.skills[skill];
                const level = Math.floor(count / 5) + 1;
                const withinLevel = count % 5;
                return <div className="skill-row" key={skill}><span className={`skill-dot dot-${skill.toLowerCase()}`} /><span className="skill-name">{skill}</span><div className="skill-track"><div className="skill-fill" style={{ width: `${(withinLevel / 5) * 100}%` }} /></div><span className="skill-level">Level {level}</span><span className="skill-count">{count}</span></div>;
              })}</div>
              <p className="level-note">Every 5 quests in a skill helps it grow to the next level.</p>
            </section>
            <section className="badges-section">
              <div className="section-title"><div><span className="step-label">MOMENTS TO CELEBRATE</span><h2>Little badges</h2></div><span className="badge-count">{earnedBadges.length} / {BADGES.length} earned</span></div>
              <div className="badge-grid">{BADGES.map((badge) => {
                const earned = earnedBadges.some((item) => item.id === badge.id);
                return <div className={`badge-card ${earned ? "badge-earned" : ""}`} key={badge.id}><span className="badge-icon">{badge.icon}</span><div><h3>{badge.title}</h3><p>{badge.description}</p></div><span className="badge-check">{earned ? "✓" : "·"}</span></div>;
              })}</div>
            </section>
          </section>
        )}
      </main>

      <footer className="site-footer"><span>Made for looking up from your screen <span className="footer-heart">♥</span></span><span>Take what you need. Leave the rest.</span></footer>
    </div>
  );
}

function ChoiceButton({ option, selected, onClick }) {
  return <button aria-pressed={selected} className={`choice-button ${selected ? "choice-selected" : ""}`} onClick={onClick}><span>{option.label}</span><small>{option.detail}</small></button>;
}

export default App;
