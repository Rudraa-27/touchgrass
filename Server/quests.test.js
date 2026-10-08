import test from "node:test";
import assert from "node:assert/strict";
import { generateQuests, validatePreferences } from "./quests.js";
import { app } from "./server.js";

const validPreferences = { place: "garden", duration: 30, energy: "medium", social: "gentle", pack: "mixed", exclude: [] };
const sampleQuests = [
  { title: "Notice a pattern", description: "Take a moment to notice a pattern in the world nearby.", skill: "Noticing", minutes: 3, difficulty: "Easy" },
  { title: "Say a hello", description: "Offer a hello to someone if it feels right in the moment.", skill: "Connection", minutes: 2, difficulty: "Gentle" },
  { title: "Make a story", description: "Make up a short story about an everyday object nearby.", skill: "Playfulness", minutes: 2, difficulty: "Easy" },
];
const ollamaResponse = (quests) => ({
  ok: true,
  json: async () => ({ message: { content: JSON.stringify({ quests }) } }),
});

test("validates the outing settings and rejects malformed values", () => {
  assert.deepEqual(validatePreferences(validPreferences), { value: validPreferences });
  assert.equal(validatePreferences({ ...validPreferences, duration: 5 }).error, "Time must be between 10 and 60 minutes.");
  assert.equal(validatePreferences({ ...validPreferences, place: "unknown" }).error, "Choose a valid place type.");
  assert.equal(validatePreferences({ ...validPreferences, pack: "unknown" }).error, "Choose a valid quest pack.");
  assert.ok(validatePreferences(null).error);
});

test("generates quests with Ollama using outing settings and fast inference options", async () => {
  let request;
  const result = await generateQuests(validPreferences, {
    fetchImpl: async (_url, options) => {
      request = JSON.parse(options.body);
      return ollamaResponse(sampleQuests);
    },
  });

  assert.equal(result.mode, "ollama");
  assert.equal(result.quests.length, 3);
  assert.equal(request.think, false);
  assert.equal(request.keep_alive, "10m");
  assert.deepEqual(request.options, { temperature: 0.9, num_predict: 256, num_ctx: 2048 });
  assert.ok(request.messages[1].content.includes('"place":"garden"'));
  assert.ok(request.messages[1].content.includes('"duration":30'));
  assert.ok(request.messages[1].content.includes('"social":"gentle"'));
  assert.ok(request.messages[1].content.includes('"pack":"mixed"'));
});

test("reports generation failures instead of returning fixed quests", async () => {
  await assert.rejects(
    generateQuests(validPreferences, { fetchImpl: async () => { throw new Error("offline"); } }),
    /offline/,
  );
});

test("rejects quests that violate solo comfort, safety, exclusions, or outing time", async () => {
  const unsafe = [
    { ...sampleQuests[0], title: "Pet a dog", description: "Pet a dog you see nearby if it seems friendly." },
    sampleQuests[1],
    sampleQuests[2],
  ];
  await assert.rejects(
    generateQuests({ ...validPreferences, social: "solo" }, { fetchImpl: async () => ollamaResponse(sampleQuests) }),
    /ignored the solo preference/,
  );
  await assert.rejects(
    generateQuests(validPreferences, { fetchImpl: async () => ollamaResponse(unsafe) }),
    /safety checks/,
  );
  const personFocused = [
    { ...sampleQuests[0], title: "Echo the shoppers", description: "Imitate a shopper as they walk through the market." },
    sampleQuests[1],
    sampleQuests[2],
  ];
  await assert.rejects(
    generateQuests(validPreferences, { fetchImpl: async () => ollamaResponse(personFocused) }),
    /safety checks/,
  );
  await assert.rejects(
    generateQuests({ ...validPreferences, exclude: ["Notice a pattern"] }, {
      fetchImpl: async () => ollamaResponse(sampleQuests),
    }),
    /repeated an excluded quest/,
  );
  await assert.rejects(
    generateQuests({ ...validPreferences, duration: 10 }, {
      fetchImpl: async () => ollamaResponse(sampleQuests.map((quest) => ({ ...quest, minutes: 5 }))),
    }),
    /exceed the available time/,
  );
});

test("rejects model output that ignores a selected skill pack", async () => {
  await assert.rejects(
    generateQuests({ ...validPreferences, pack: "noticing" }, {
      fetchImpl: async () => ollamaResponse(sampleQuests),
    }),
    /ignored the selected quest pack/,
  );
});

test("generates a connection-only set for the connection pack", async () => {
  const connectionQuests = [
    { title: "Say a hello", description: "Offer a simple hello if it feels comfortable to you.", skill: "Connection", minutes: 2, difficulty: "Gentle" },
    { title: "Share a kind word", description: "Offer a sincere kind word if the moment feels welcome.", skill: "Connection", minutes: 2, difficulty: "Gentle" },
    { title: "Say a small thank-you", description: "Thank someone for something they did if it comes up naturally.", skill: "Connection", minutes: 2, difficulty: "Easy" },
  ];
  const result = await generateQuests({ ...validPreferences, pack: "connection" }, {
    fetchImpl: async () => ollamaResponse(connectionQuests),
  });
  assert.equal(result.mode, "ollama");
  assert.ok(result.quests.every((quest) => quest.skill === "Connection"));
});

test("quest endpoint rejects invalid preferences with a readable response", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/quests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ place: "moon", duration: 90, energy: "high", social: "solo" }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Choose a valid place type." });
});

test("quest endpoint explains when Ollama is unavailable", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await new Promise((resolve) => server.once("listening", resolve));
  const originalBaseUrl = process.env.OLLAMA_BASE_URL;
  process.env.OLLAMA_BASE_URL = "http://127.0.0.1:1";
  t.after(() => {
    if (originalBaseUrl === undefined) delete process.env.OLLAMA_BASE_URL;
    else process.env.OLLAMA_BASE_URL = originalBaseUrl;
  });

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/quests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPreferences),
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Ollama could not generate quests/);
});
