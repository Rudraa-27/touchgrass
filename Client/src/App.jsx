import { useEffect, useMemo, useState } from "react";
import { getCuratedQuests, QUEST_PACKS } from "./questPacks.js";

const STORAGE_KEY = "touchgrass.progress.v1";
const FAVORITES_KEY = "touchgrass.favorites.v1";
const OUTINGS_KEY = "touchgrass.outings.v1";
const SEASON_KEY = "touchgrass.season.v1";
const SEASONS = [
  { id: "spring", label: "Spring", icon: "✿" },
  { id: "summer", label: "Summer", icon: "☼" },
  { id: "autumn", label: "Autumn", icon: "❧" },
  { id: "winter", label: "Winter", icon: "❄" },
];
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
  { id: "first-step", title: "First steps", description: "Complete your first quest", art: "flower", test: (p) => p.completed >= 1 },
  { id: "noticer", title: "Little noticer", description: "Complete 5 noticing quests", art: "eye", test: (p) => p.skills.Noticing >= 5 },
  { id: "good-neighbor", title: "Good neighbor", description: "Complete 5 connection quests", art: "heart", test: (p) => p.skills.Connection >= 5 },
  { id: "playful", title: "Finding the fun", description: "Complete 5 playfulness quests", art: "sun", test: (p) => p.skills.Playfulness >= 5 },
  { id: "wanderer", title: "Wander a little", description: "Complete 5 movement quests", art: "leaf", test: (p) => p.skills.Movement >= 5 },
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

function readStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function readSeason() {
  try {
    const stored = localStorage.getItem(SEASON_KEY);
    return SEASONS.some((season) => season.id === stored) ? stored : getCurrentSeason();
  } catch {
    return getCurrentSeason();
  }
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function getInstallInstructions() {
  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isAppleMobile) return "In Safari, tap Share, then choose Add to Home Screen.";
  if (/Android/i.test(navigator.userAgent)) return "Open your browser menu, then choose Install app or Add to Home screen.";
  return "Open your browser menu and choose Install TouchGrass, or use the install icon in the address bar.";
}

async function getQuests(preferences, exclude = []) {
  const response = await fetch("/api/quests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...preferences, exclude }),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "We couldn't make your quests right now. Please try again.");
  }
  const result = await response.json();
  if (!Array.isArray(result.quests) || result.quests.length !== 3) {
    throw new Error("The quest service returned an incomplete set.");
  }
  return result;
}

async function getQuestSet(preferences, exclude = []) {
  const localQuests = () => ({
    quests: getCuratedQuests({ ...preferences, exclude }),
    mode: navigator.onLine ? "curated" : "offline",
  });
  if (!navigator.onLine) return localQuests();
  try {
    return await getQuests(preferences, exclude);
  } catch {
    return localQuests();
  }
}

function App() {
  const [progress, setProgress] = useState(readProgress);
  const [favorites, setFavorites] = useState(() => readStoredList(FAVORITES_KEY));
  const [outings, setOutings] = useState(() => readStoredList(OUTINGS_KEY));
  const [season, setSeason] = useState(readSeason);
  const [screen, setScreen] = useState("start");
  const [place, setPlace] = useState("garden");
  const [duration, setDuration] = useState(30);
  const [energy, setEnergy] = useState("medium");
  const [social, setSocial] = useState("gentle");
  const [pack, setPack] = useState("mixed");
  const [quests, setQuests] = useState([]);
  const [generationMode, setGenerationMode] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingQuest, setSavingQuest] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneApp);
  const [installHelp, setInstallHelp] = useState("");
  const [installError, setInstallError] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [currentOutingId, setCurrentOutingId] = useState("");
  const earnedBadges = useMemo(() => BADGES.filter((badge) => badge.test(progress)), [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      localStorage.setItem(OUTINGS_KEY, JSON.stringify(outings));
      localStorage.setItem(SEASON_KEY, season);
      setStorageWarning("");
    } catch {
      setStorageWarning("This browser couldn't save your latest changes. Check available device storage.");
    }
  }, [progress, favorites, outings, season]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    const captureInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => {
      const installed = displayMode.matches || navigator.standalone === true;
      setIsInstalled(installed);
      if (installed) {
        setInstallPrompt(null);
        setInstallHelp("");
      }
    };
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", updateInstalled);
    displayMode.addEventListener("change", updateInstalled);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", updateInstalled);
      displayMode.removeEventListener("change", updateInstalled);
    };
  }, []);

  const preferences = { place, duration, energy, social, pack };

  async function beginOuting() {
    setLoading(true);
    const result = await getQuestSet(preferences);
    setQuests(result.quests.map((quest) => ({ ...quest, status: "open" })));
    setGenerationMode(result.mode);
    setLoading(false);
    setScreen("quests");
  }

  async function replaceQuest(questId) {
    setSavingQuest(questId);
    const current = quests.find((quest) => quest.id === questId);
    const result = await getQuestSet(preferences, quests.map((quest) => quest.title));
    const replacement = result.quests.find((quest) => quest.skill === current.skill) || result.quests[0];
    if (replacement) {
      setQuests((currentQuests) => currentQuests.map((quest) => (
        quest.id === questId ? { ...replacement, status: "open" } : quest
      )));
    }
    setGenerationMode(result.mode);
    setSavingQuest("");
  }

  function setQuestStatus(questId, status) {
    setQuests((current) => current.map((quest) => quest.id === questId ? { ...quest, status } : quest));
  }

  function finishOuting() {
    const completedQuests = quests.filter((quest) => quest.status === "done");
    const id = globalThis.crypto?.randomUUID?.() || `outing-${Date.now()}`;
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
    setOutings((current) => [{
      id,
      date: new Date().toISOString(),
      place,
      duration,
      pack,
      completed: completedQuests.length,
      quests: completedQuests.map((quest) => ({ id: quest.id, title: quest.title, skill: quest.skill })),
      reflection: "",
    }, ...current].slice(0, 100));
    setCurrentOutingId(id);
    setScreen("complete");
  }

  function startOver() {
    setQuests([]);
    setScreen("start");
  }

  function toggleFavorite(quest) {
    setFavorites((current) => current.some((favorite) => favorite.id === quest.id)
      ? current.filter((favorite) => favorite.id !== quest.id)
      : [{ ...quest, status: undefined }, ...current]);
  }

  function updateReflection(reflection) {
    setOutings((current) => current.map((outing) => (
      outing.id === currentOutingId ? { ...outing, reflection } : outing
    )));
  }

  async function installApp() {
    setInstallError("");
    if (!installPrompt) {
      setInstallHelp(getInstallInstructions());
      return;
    }
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);
      setInstallHelp(outcome === "accepted"
        ? "Your browser accepted the install request. Follow any remaining prompt to finish."
        : getInstallInstructions());
    } catch (error) {
      console.error("TouchGrass could not open the browser install prompt:", error);
      setInstallPrompt(null);
      setInstallError("Your browser couldn't open its install prompt. You can still install TouchGrass from the browser menu.");
      setInstallHelp(getInstallInstructions());
    }
    setInstallPrompt(null);
  }

  function resetProgress() {
    if (!window.confirm("Reset your progress on this device? This can't be undone.")) return;
    const blank = { completed: 0, points: 0, skills: Object.fromEntries(SKILLS.map((skill) => [skill, 0])), outings: 0 };
    setProgress(blank);
    setFavorites([]);
    setOutings([]);
    setSeason(getCurrentSeason());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blank));
      localStorage.removeItem(FAVORITES_KEY);
      localStorage.removeItem(OUTINGS_KEY);
      localStorage.removeItem(SEASON_KEY);
      setStorageWarning("");
    } catch {
      setStorageWarning("Progress couldn't be cleared from this browser. Try clearing this site's data in browser settings.");
    }
  }

  const completedThisOuting = quests.filter((quest) => quest.status === "done").length;
  const currentOuting = outings.find((outing) => outing.id === currentOutingId);
  const currentPack = QUEST_PACKS.find((option) => option.id === pack);
  const defaultReflection = PRAISE[Math.floor(Date.now() / 86400000) % PRAISE.length];

  return (
    <div className="app-shell" data-season={season}>
      <header className="topbar">
        <button className="brand" onClick={startOver} aria-label="TouchGrass home">
          <span className="brand-mark">tg<span>✳</span></span>
          <span>touchgrass</span>
        </button>
        <div className="topbar-right">
          <span className={`network-status ${isOnline ? "" : "network-offline"}`}><i />{isOnline ? "Ready offline" : "Offline · still works"}</span>
          {!isInstalled && <button className="text-button install-link" onClick={installApp} aria-expanded={Boolean(installHelp)} aria-controls="install-help">Install this app <span aria-hidden="true">↓</span></button>}
          <button className="text-button progress-link" onClick={() => setScreen(screen === "progress" ? "start" : "progress")}>My garden <span aria-hidden="true">↗</span></button>
        </div>
        {installHelp && (
          <div className="install-help" id="install-help" role="status">
            <button className="install-help-close" onClick={() => { setInstallHelp(""); setInstallError(""); }} aria-label="Close installation help">×</button>
            <strong>Take TouchGrass with you</strong>
            <p>{installHelp}</p>
            {installError && <p className="install-error" role="alert">{installError}</p>}
          </div>
        )}
      </header>

      <main>
        {storageWarning && <p className="storage-warning" role="status">{storageWarning}</p>}
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
                {SOCIAL_LEVELS.map((option) => <ChoiceButton key={option.value} option={option} selected={social === option.value} onClick={() => { setSocial(option.value); if (option.value === "solo" && pack === "connection") setPack("mixed"); }} />)}
              </div>

              <label className="field-label group-label">Pick a little quest pack</label>
              <div className="pack-grid">
                {QUEST_PACKS.map((option) => {
                  const unavailable = option.id === "connection" && social === "solo";
                  return (
                    <button
                      key={option.id}
                      aria-pressed={pack === option.id}
                      aria-disabled={unavailable}
                      className={`pack-option ${pack === option.id ? "pack-selected" : ""} ${unavailable ? "pack-disabled" : ""}`}
                      onClick={() => { if (!unavailable) setPack(option.id); }}
                    >
                      <span className="pack-icon">{option.icon}</span>
                      <span><strong>{option.name}</strong><small>{option.subtitle}</small></span>
                    </button>
                  );
                })}
              </div>
              <button className="primary-button generate-button" onClick={beginOuting} disabled={loading}>
                {loading ? <><span className="spinner" /> Finding your little adventure…</> : <>Find my little adventure <span aria-hidden="true">→</span></>}
              </button>
              <p className="card-footnote">No perfect day needed. Just start where you are. Works offline, too.</p>
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
            <div className="model-note">
              <span>{generationMode === "ollama" ? "✳ Freshly made with your local model." : "✳ A little inspiration from your " + (currentPack?.name || "quest") + " pack."}</span>
              {!isOnline && <span className="offline-caption">Your outing works just fine without a connection.</span>}
            </div>
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
                    <button
                      className={`favorite-button ${favorites.some((favorite) => favorite.id === quest.id) ? "is-favorite" : ""}`}
                      aria-label={favorites.some((favorite) => favorite.id === quest.id) ? `Remove ${quest.title} from favorites` : `Save ${quest.title} to favorites`}
                      aria-pressed={favorites.some((favorite) => favorite.id === quest.id)}
                      onClick={() => toggleFavorite(quest)}
                    >{favorites.some((favorite) => favorite.id === quest.id) ? "♥" : "♡"}<span>Save</span></button>
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
            <p className="completion-copy">{defaultReflection}</p>
            <div className="completion-summary">
              <div><span className="summary-value">{completedThisOuting}</span><span className="summary-label">quests tried</span></div>
              <div><span className="summary-value">+{quests.filter((quest) => quest.status === "done").reduce((sum, quest) => sum + (quest.points || 10), 0)}</span><span className="summary-label">little points</span></div>
              <div><span className="summary-value">{progress.completed}</span><span className="summary-label">all-time quests</span></div>
            </div>
            <label className="reflection-label" htmlFor="outing-reflection">A little note for future you <span>optional</span></label>
            <textarea
              id="outing-reflection"
              className="reflection-input"
              maxLength={400}
              placeholder="What did you notice? How do you feel now?"
              value={currentOuting?.reflection || ""}
              onChange={(event) => updateReflection(event.target.value)}
            />
            <p className="reflection-privacy">Only saved on this device. No need to write anything if you don't feel like it.</p>
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
            <section className="season-section">
              <div className="section-title"><div><span className="step-label">YOUR LITTLE WORLD</span><h2>Choose a seasonal feel</h2></div></div>
              <div className="season-picker">
                {SEASONS.map((option) => (
                  <button key={option.id} className={`season-choice ${season === option.id ? "season-selected" : ""}`} aria-pressed={season === option.id} onClick={() => setSeason(option.id)}>
                    <span>{option.icon}</span>{option.label}
                  </button>
                ))}
              </div>
            </section>
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
                return <div className={`badge-card ${earned ? "badge-earned" : ""}`} key={badge.id}><BadgeIllustration art={badge.art} /><div><h3>{badge.title}</h3><p>{badge.description}</p></div><span className="badge-check">{earned ? "✓" : "·"}</span></div>;
              })}</div>
            </section>
            <section className="saved-section">
              <div className="section-title"><div><span className="step-label">KEEP CLOSE</span><h2>Saved little quests</h2></div><span className="badge-count">{favorites.length} saved</span></div>
              {favorites.length ? <div className="saved-list">{favorites.map((quest) => (
                <article className="saved-card" key={quest.id}>
                  <div className={`quest-symbol symbol-${quest.skill.toLowerCase()}`}>{quest.icon || "✳"}</div>
                  <div><h3>{quest.title}</h3><p>{quest.description}</p><span className="saved-skill">{quest.skill}</span></div>
                  <button className="remove-favorite" aria-label={`Remove ${quest.title} from favorites`} onClick={() => toggleFavorite(quest)}>♥</button>
                </article>
              ))}</div> : <p className="empty-state">Save a quest you like and it will be here for another day.</p>}
            </section>
            <section className="journal-section">
              <div className="section-title"><div><span className="step-label">LITTLE MOMENTS, KEPT</span><h2>Your outside journal</h2></div><span className="badge-count">On this device</span></div>
              {outings.length ? <div className="journal-list">{outings.slice(0, 12).map((outing) => (
                <article className="journal-card" key={outing.id}>
                  <div className="journal-date"><strong>{formatOutingDate(outing.date)}</strong><span>{outing.completed} {outing.completed === 1 ? "quest" : "quests"} tried</span></div>
                  <div className="journal-content">
                    <span className="journal-place">{PLACES.find((option) => option.value === outing.place)?.label || "A little outing"} · {outing.duration} min</span>
                    {outing.quests?.length > 0 && <p>{outing.quests.map((quest) => quest.title).join(" · ")}</p>}
                    {outing.reflection && <blockquote>“{outing.reflection}”</blockquote>}
                  </div>
                  <span className="journal-leaf">✿</span>
                </article>
              ))}</div> : <p className="empty-state">Your little outside moments will collect here when you finish an outing.</p>}
            </section>
            <div className="progress-bottom"><p>All of this lives only on your device. No account, no leaderboard, no pressure.</p><button className="reset-button" onClick={resetProgress}>Reset my local data</button></div>
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

function BadgeIllustration({ art }) {
  const shapes = {
    flower: <><path d="M24 9c-4 6-4 10 0 13 4-3 4-7 0-13Zm0 14c-7-2-10 0-10 4 5 2 8 1 10-4Zm0 0c7-2 10 0 10 4-5 2-8 1-10-4Z" /><circle cx="24" cy="24" r="3" /></>,
    eye: <><path d="M9 24s6-9 15-9 15 9 15 9-6 9-15 9S9 24 9 24Z" /><circle cx="24" cy="24" r="5" /><circle cx="25.5" cy="22.5" r="1" className="badge-highlight" /></>,
    heart: <><path d="M24 35 11 23c-7-8 4-17 13-7 9-10 20-1 13 7L24 35Z" /><path d="m16 23 5 5 10-11" className="badge-detail" /></>,
    sun: <><circle cx="24" cy="24" r="8" /><path d="M24 8v5m0 22v5M8 24h5m22 0h5M13 13l4 4m14 14 4 4m0-22-4 4m-14 14-4 4" /></>,
    leaf: <><path d="M12 35c2-16 11-24 26-26-1 15-9 24-26 26Z" /><path d="M12 35 30 17" className="badge-detail" /></>,
  };
  return <span className={`badge-icon badge-${art}`}><svg viewBox="0 0 48 48" aria-hidden="true">{shapes[art]}</svg></span>;
}

function formatOutingDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "A little while ago";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export default App;
