const SKILLS = ["Noticing", "Connection", "Playfulness", "Movement"];
const PLACE_TYPES = ["garden", "market", "neighborhood", "other"];
const ENERGY_LEVELS = ["low", "medium", "high"];
const SOCIAL_LEVELS = ["solo", "gentle", "open"];
const QUEST_PACKS = ["mixed", "noticing", "connection", "playfulness", "movement"];

export function validatePreferences(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Please send your outing preferences." };
  }
  const { place, duration, energy, social, pack = "mixed", exclude = [] } = input;
  if (!PLACE_TYPES.includes(place)) return { error: "Choose a valid place type." };
  if (!Number.isInteger(duration) || duration < 10 || duration > 60) {
    return { error: "Time must be between 10 and 60 minutes." };
  }
  if (!ENERGY_LEVELS.includes(energy)) return { error: "Choose a valid energy level." };
  if (!SOCIAL_LEVELS.includes(social)) return { error: "Choose a valid social comfort level." };
  if (!QUEST_PACKS.includes(pack)) return { error: "Choose a valid quest pack." };
  if (!Array.isArray(exclude) || exclude.length > 30 || exclude.some((item) => typeof item !== "string" || item.length > 120)) {
    return { error: "Excluded quest titles must be a list of short strings." };
  }
  return { value: { place, duration, energy, social, pack, exclude } };
}

function questId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseModelQuests(content) {
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed.quests) || parsed.quests.length !== 3) throw new Error("Model response must contain exactly three quests.");
  return parsed.quests.map((quest) => {
    if (
      !quest || typeof quest.title !== "string" || quest.title.length < 3 || quest.title.length > 70
      || typeof quest.description !== "string" || quest.description.length < 15 || quest.description.length > 240
      || !SKILLS.includes(quest.skill)
      || !Number.isInteger(quest.minutes) || quest.minutes < 1 || quest.minutes > 30
      || !["Easy", "Gentle", "A little brave"].includes(quest.difficulty)
    ) throw new Error("Model returned a quest with an invalid shape.");
    return {
      id: questId(quest.title),
      title: quest.title,
      description: quest.description,
      skill: quest.skill,
      minutes: quest.minutes,
      difficulty: quest.difficulty,
      points: 10,
      icon: { Noticing: "◉", Connection: "♡", Playfulness: "✳", Movement: "↗" }[quest.skill],
    };
  });
}

function isSafeQuest(quest) {
  const text = `${quest.title} ${quest.description}`;
  const personFocused = /\b(?:mimic|imitate|follow|track|watch|approach)\b.{0,40}\b(?:person|people|shopper|stranger|someone|anyone)\b|\b(?:person|people|shopper|stranger|someone|anyone)\b.{0,40}\b(?:mimic|imitate|follow|track|watch|approach)\b/i;
  return !(
    /\b(?:touch|pet|feed|pick|collect|buy|purchase|spend|photograph|photo|selfie|camera|phone|run|climb|trespass|dare|challenge|stranger|cross the (?:street|road))\b/i.test(text)
    || personFocused.test(text)
  );
}

export async function generateQuests(preferences, {
  baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model = process.env.OLLAMA_MODEL || "llama3.1",
  fetchImpl = fetch,
  timeoutMs = 12000,
} = {}) {
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      keep_alive: "10m",
      format: "json",
      options: { temperature: 0.9, num_predict: 256, num_ctx: 2048 },
      messages: [
        {
          role: "system",
          content: `Generate exactly 3 original, safe, optional outdoor quests as JSON: {"quests":[{"title":"...","description":"...","skill":"Noticing|Connection|Playfulness|Movement","minutes":3,"difficulty":"Easy|Gentle|A little brave"}]}. Make every quest concrete and specific to the place, available time, energy, social comfort, and selected quest pack. Prefer the pack's skill when one is selected; mixed means a variety. Keep descriptions under 18 words. The three quest durations together must fit within the available time. Do not use excluded titles or generic repeated templates. Never require approaching, following, watching, or imitating people; touching animals or plants; photographing people; spending money; entering private property; sharing personal details; or using a phone while moving. Make social quests optional and omit them for solo outings. Avoid dangerous, humiliating, competitive, or judgmental tasks. Return JSON only, with no reasoning, markdown, or extra keys.`,
        },
        { role: "user", content: JSON.stringify(preferences) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
  const data = await response.json();
  if (typeof data.message?.content !== "string") throw new Error("Ollama response did not contain message content.");
  const quests = parseModelQuests(data.message.content);
  const excluded = new Set(preferences.exclude.map((title) => title.toLowerCase()));
  if (new Set(quests.map((quest) => quest.title.toLowerCase())).size !== quests.length) {
    throw new Error("Model returned duplicate quest titles.");
  }
  if (quests.some((quest) => excluded.has(quest.title.toLowerCase()))) {
    throw new Error("Model repeated an excluded quest.");
  }
  if (quests.reduce((total, quest) => total + quest.minutes, 0) > preferences.duration) {
    throw new Error("Model returned quests that exceed the available time.");
  }
  if (quests.some((quest) => !isSafeQuest(quest))) {
    throw new Error("Model returned a quest that did not pass safety checks.");
  }
  if (preferences.social === "solo" && quests.some((quest) => quest.skill === "Connection")) {
    throw new Error("Model ignored the solo preference.");
  }
  if (preferences.pack === "connection" && preferences.social === "solo") {
    throw new Error("Connection quests cannot be generated for a solo outing.");
  }
  if (preferences.pack === "connection" && quests.some((quest) => quest.skill !== "Connection")) {
    throw new Error("Model ignored the connection quest pack.");
  }
  if (preferences.pack !== "mixed" && preferences.pack !== "connection") {
    const expectedSkill = preferences.pack[0].toUpperCase() + preferences.pack.slice(1);
    if (quests.some((quest) => quest.skill !== expectedSkill)) {
      throw new Error("Model ignored the selected quest pack.");
    }
  }
  return { quests, mode: "ollama" };
}
