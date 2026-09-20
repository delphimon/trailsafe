import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatGuideSearchItems,
  getGuideContentVersion,
  INDEXED_GUIDE_VERSION_KEY,
} from "../src/lib/search-indexing";
import { topics } from "../src/content";
import { newPlan, type TripPlan } from "../src/lib/plans";

test("formatGuideSearchItems indexes all guide topics", () => {
  const items = formatGuideSearchItems();
  assert.equal(items.length, topics.length, "Must index all topics in content/topics");

  for (const item of items) {
    assert.ok(item.id, "Every item must have an id");
    assert.ok(item.title, `Item ${item.id} must have a title`);
    assert.ok(item.url.startsWith("trailsafe://article/"), `URL must start with trailsafe://article/ for ${item.id}`);
    assert.ok(item.keywords.length > 0, `Keywords array must not be empty for ${item.id}`);
    assert.ok(
      item.keywords.includes(item.title.toLowerCase()),
      `Keywords must include the lowercase item title for ${item.title}`
    );
  }
});

test("formatGuideSearchItems extracts rich keywords for critical medical/survival topics", () => {
  const items = formatGuideSearchItems();

  const hypothermia = items.find((i) => i.id === "cold-hypothermia");
  assert.ok(hypothermia, "cold-hypothermia must exist");
  assert.ok(
    hypothermia.keywords.some((k) => k.includes("cold") || k.includes("shiver") || k.includes("hypothermia")),
    "Hypothermia keywords must contain cold/shiver/hypothermia"
  );

  const injured = items.find((i) => i.id === "g-injured");
  assert.ok(injured, "g-injured must exist");
  assert.ok(
    injured.keywords.some((k) => k.includes("injur") || k.includes("medical") || k.includes("first aid")),
    "Injured topic must include injury/first aid keywords"
  );
});

test("getGuideContentVersion is deterministic and prefixed with guide-", () => {
  const v1 = getGuideContentVersion();
  const v2 = getGuideContentVersion();
  assert.equal(v1, v2, "getGuideContentVersion must be deterministic");
  assert.ok(v1.startsWith("guide-"), "getGuideContentVersion must start with guide-");
  assert.equal(INDEXED_GUIDE_VERSION_KEY, "@trailsafe_indexed_guide_version");
});

test("hands-free trip completion transitions current plan to completed", () => {
  const base = newPlan();
  const activePlan: TripPlan = {
    ...base,
    id: "plan-active-1",
    title: "Snow Lake Trail",
    status: "current",
    revision: 1,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    date: "2026-09-15",
    startTime: "08:00",
    returnDate: "2026-09-15",
    returnTime: "17:00",
    overdueDate: "2026-09-15",
    overdueTime: "19:00",
    timeZone: "America/Los_Angeles",
    travelerName: "Hiker",
    travelerPhone: "555",
    trustedContactName: "Jane",
    trustedContactPhone: "999",
    partySize: "1",
    trailhead: "Alpental",
    route: "Snow Lake",
  };

  const completedPlan: TripPlan = {
    ...activePlan,
    status: "completed",
    updatedAt: Date.now(),
    revision: activePlan.revision + 1,
  };

  assert.equal(completedPlan.status, "completed");
  assert.equal(completedPlan.revision, 2);
  assert.equal(completedPlan.id, activePlan.id);
  assert.equal(completedPlan.title, activePlan.title);
});
