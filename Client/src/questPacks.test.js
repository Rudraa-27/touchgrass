import test from "node:test";
import assert from "node:assert/strict";
import { CURATED_QUESTS, getCuratedQuests, QUEST_PACKS } from "./questPacks.js";

const preferences = { place: "garden", duration: 30, energy: "medium", social: "gentle", pack: "mixed" };

test("bundled quest packs provide three distinct quests for every place", () => {
  for (const place of ["garden", "market", "neighborhood", "other"]) {
    const quests = getCuratedQuests({ ...preferences, place });
    assert.equal(quests.length, 3, place);
    assert.equal(new Set(quests.map((quest) => quest.id)).size, 3, place);
    assert.ok(quests.every((quest) => Number.isFinite(quest.points) && quest.points > 0));
  }
});

test("solo outings never include connection quests", () => {
  for (const pack of QUEST_PACKS) {
    const quests = getCuratedQuests({ ...preferences, social: "solo", pack: pack.id });
    assert.ok(quests.every((quest) => quest.skill !== "Connection"), pack.id);
  }
});

test("themed packs keep their focus when a low-energy outing needs variety", () => {
  const quests = getCuratedQuests({ ...preferences, energy: "low", pack: "connection" });
  assert.ok(quests.some((quest) => quest.skill === "Connection"));
  assert.equal(quests.length, 3);
});

test("themed packs prioritize their skill and swaps exclude previous titles", () => {
  const themed = getCuratedQuests({ ...preferences, pack: "playfulness" });
  assert.equal(themed[0].skill, "Playfulness");
  assert.ok(themed.every((quest) => quest.skill === "Playfulness"));

  const replacements = getCuratedQuests({
    ...preferences,
    pack: "noticing",
    exclude: themed.map((quest) => quest.title),
  });
  assert.ok(replacements.every((quest) => !themed.some((oldQuest) => oldQuest.title === quest.title)));
});

test("offline quests fit the selected outing duration", () => {
  for (const place of ["garden", "market", "neighborhood", "other"]) {
    for (const pack of QUEST_PACKS) {
      const quests = getCuratedQuests({ ...preferences, place, duration: 10, pack: pack.id });
      assert.equal(quests.length, 3, `${place} / ${pack.id}`);
      assert.ok(quests.reduce((sum, quest) => sum + quest.minutes, 0) <= 10, `${place} / ${pack.id}`);
    }
  }
});

test("curated quests contain enough content for the offline catalog", () => {
  assert.ok(CURATED_QUESTS.length >= 20);
  assert.ok(CURATED_QUESTS.every((quest) => quest.description.length <= 160));
});
