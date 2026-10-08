export const QUEST_PACKS = [
  { id: "mixed", name: "A bit of everything", subtitle: "A little noticing, play, and movement", icon: "✳", skill: null },
  { id: "noticing", name: "Little noticer", subtitle: "Slow down and spot the small things", icon: "◉", skill: "Noticing" },
  { id: "connection", name: "Tiny connections", subtitle: "Gentle hellos, only if they feel right", icon: "♡", skill: "Connection" },
  { id: "playfulness", name: "Playful detours", subtitle: "Find a little wonder in the ordinary", icon: "☀", skill: "Playfulness" },
  { id: "movement", name: "Gentle wandering", subtitle: "Easy ways to move and explore", icon: "↗", skill: "Movement" },
];

export const CURATED_QUESTS = [
  { id: "notice-a-color", title: "Follow a color", description: "Choose a color and spot three different places it appears around you.", skill: "Noticing", minutes: 3, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "notice-a-sound", title: "Listen for a layer", description: "Pause somewhere comfortable and notice three sounds, near or far.", skill: "Noticing", minutes: 3, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "notice-a-detail", title: "Find a tiny detail", description: "Give one small thing you might usually walk past ten seconds of attention.", skill: "Noticing", minutes: 2, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "notice-the-weather", title: "Check in with the sky", description: "Notice the shape, color, or movement of the sky from a safe spot.", skill: "Noticing", minutes: 2, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "notice-growing", title: "Notice something growing", description: "Look for a plant or tree and notice its shape without touching it.", skill: "Noticing", minutes: 3, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["garden", "neighborhood", "other"] },
  { id: "notice-patterns", title: "Spot a repeating pattern", description: "Find a pattern in a path, building, leaf, or display around you.", skill: "Noticing", minutes: 3, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "notice-a-change", title: "Spot a little change", description: "Notice something that has changed with the season, weather, or time.", skill: "Noticing", minutes: 3, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["garden", "neighborhood", "other"] },
  { id: "notice-a-reflection", title: "Find a reflection", description: "From a safe place, spot a reflection in a window, puddle, or shiny surface.", skill: "Noticing", minutes: 2, difficulty: "Easy", icon: "◉", packs: ["noticing"], places: ["market", "neighborhood", "other"] },

  { id: "connection-kind-word", title: "Share a kind word", description: "If it feels welcome, offer someone a simple, sincere compliment. Skipping is okay.", skill: "Connection", minutes: 2, difficulty: "Gentle", icon: "♡", packs: ["connection"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "connection-friendly-nod", title: "Give a friendly nod", description: "If it feels comfortable, share a small smile or nod. No reply is needed.", skill: "Connection", minutes: 1, difficulty: "Easy", icon: "♡", packs: ["connection"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "connection-hello", title: "Offer a simple hello", description: "If it feels natural, say hello to someone you already know or a shopkeeper.", skill: "Connection", minutes: 2, difficulty: "Gentle", icon: "♡", packs: ["connection"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "connection-thanks", title: "Say a small thank-you", description: "If a moment comes up naturally, thank someone for something they did.", skill: "Connection", minutes: 2, difficulty: "Easy", icon: "♡", packs: ["connection"], places: ["market", "neighborhood", "other"] },
  { id: "connection-share-space", title: "Make room for someone", description: "Notice a shared space and make a small considerate gesture if one comes naturally.", skill: "Connection", minutes: 2, difficulty: "Easy", icon: "♡", packs: ["connection"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "connection-shopkeeper", title: "Ask a familiar question", description: "If it feels comfortable, ask a shopkeeper a simple question about something you know.", skill: "Connection", minutes: 3, difficulty: "Gentle", icon: "♡", packs: ["connection"], places: ["market", "other"] },

  { id: "play-tiny-story", title: "Make up a tiny story", description: "Choose an ordinary object nearby and invent a one-sentence story about it.", skill: "Playfulness", minutes: 2, difficulty: "Easy", icon: "✳", packs: ["playfulness"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "play-silly-name", title: "Collect a silly name", description: "Give a nearby bench, building, or plant a ridiculous affectionate nickname.", skill: "Playfulness", minutes: 2, difficulty: "Easy", icon: "✳", packs: ["playfulness"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "play-cloud-shape", title: "Find a sky shape", description: "Look up and find a shape in the clouds—or imagine one if the sky is clear.", skill: "Playfulness", minutes: 2, difficulty: "Easy", icon: "✳", packs: ["playfulness"], places: ["garden", "neighborhood", "other"] },
  { id: "play-unexpected", title: "Find the unexpected", description: "Spot one detail that makes you smile or surprises you in a small way.", skill: "Playfulness", minutes: 3, difficulty: "Easy", icon: "✳", packs: ["playfulness"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "play-shape-hunt", title: "Go on a shape hunt", description: "Choose a simple shape and notice three safe, everyday places it appears.", skill: "Playfulness", minutes: 3, difficulty: "Easy", icon: "✳", packs: ["playfulness"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "play-imagine-a-soundtrack", title: "Imagine a soundtrack", description: "Pick a nearby view and imagine what kind of music would suit this scene.", skill: "Playfulness", minutes: 2, difficulty: "Easy", icon: "✳", packs: ["playfulness"], places: ["garden", "market", "neighborhood", "other"] },

  { id: "movement-scenic-turn", title: "Take a scenic turn", description: "If safe and accessible, choose a different familiar path for a few minutes.", skill: "Movement", minutes: 5, difficulty: "Gentle", icon: "↗", packs: ["movement"], places: ["garden", "neighborhood", "other"] },
  { id: "movement-stretch", title: "Stretch like you mean it", description: "Find a comfortable spot and gently stretch your shoulders, hands, or legs.", skill: "Movement", minutes: 2, difficulty: "Easy", icon: "↗", packs: ["movement"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "movement-pause", title: "Find a place to pause", description: "Find a safe, comfortable spot to stand or sit and let your body rest.", skill: "Movement", minutes: 2, difficulty: "Easy", icon: "↗", packs: ["movement"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "movement-noticing-speed", title: "Walk at noticing speed", description: "On a safe, familiar path, slow down and let your eyes wander for a moment.", skill: "Movement", minutes: 4, difficulty: "Gentle", icon: "↗", packs: ["movement"], places: ["garden", "neighborhood", "other"] },
  { id: "movement-posture", title: "Uncurl for a moment", description: "If comfortable, stand or sit tall and give your body a gentle reset.", skill: "Movement", minutes: 1, difficulty: "Easy", icon: "↗", packs: ["movement"], places: ["garden", "market", "neighborhood", "other"] },
  { id: "movement-new-view", title: "See it from a new spot", description: "From a safe accessible route, move a little and notice how the view changes.", skill: "Movement", minutes: 4, difficulty: "Gentle", icon: "↗", packs: ["movement"], places: ["garden", "neighborhood", "other"] },
];

export function getCuratedQuests(preferences, count = 3) {
  const excluded = new Set((preferences.exclude || []).map((title) => title.toLocaleLowerCase()));
  const selectedPack = QUEST_PACKS.find((pack) => pack.id === preferences.pack) || QUEST_PACKS[0];
  const filterCandidates = (easyOnly) => CURATED_QUESTS.filter((quest) => (
    quest.places.includes(preferences.place)
    && !excluded.has(quest.title.toLocaleLowerCase())
    && (preferences.social !== "solo" || quest.skill !== "Connection")
    && (!easyOnly || quest.difficulty === "Easy")
  ));
  let available = filterCandidates(preferences.energy === "low");
  if (available.length < count && preferences.energy === "low") available = filterCandidates(false);
  const packQuests = selectedPack.id === "mixed"
    ? available
    : available.filter((quest) => quest.packs.includes(selectedPack.id));
  const candidates = selectedPack.id === "mixed"
    ? available
    : [...packQuests, ...available.filter((quest) => !quest.packs.includes(selectedPack.id))];

  const selected = [];
  let usedMinutes = 0;
  const shuffled = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  };
  const addFrom = (pool, limit = count) => {
    for (const quest of shuffled(pool)) {
      if (selected.length >= limit) break;
      if (selected.includes(quest) || usedMinutes + quest.minutes > preferences.duration) continue;
      selected.push(quest);
      usedMinutes += quest.minutes;
    }
  };

  if (selectedPack.skill) {
    addFrom(candidates.filter((quest) => quest.skill === selectedPack.skill));
  } else {
    const skillOrder = preferences.social === "solo"
      ? ["Noticing", "Playfulness", "Movement"]
      : ["Noticing", "Connection", "Playfulness", "Movement"];
    for (const skill of skillOrder) {
      addFrom(candidates.filter((quest) => quest.skill === skill), selected.length + 1);
      if (selected.length === count) break;
    }
  }
  addFrom(candidates);
  return selected.slice(0, count).map((quest) => ({ ...quest, points: 10 }));
}
