import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEmergencyDraft,
  performEmergencyAction,
  smsOutcomeMessage,
} from "../src/lib/emergency";
import library from "../src/content/library.json";
test("emergency actions invoke only the requested inert handler", async () => {
  const recorded: string[] = [];
  const handlers = {
    call: async () => {
      recorded.push("call");
    },
    text: async () => {
      recorded.push("text");
    },
  };
  await performEmergencyAction("call", handlers);
  assert.deepEqual(recorded, ["call"]);
  await performEmergencyAction("text", handlers);
  assert.deepEqual(recorded, ["call", "text"]);
});
test("missing GPS is explicit and never invents a county or position", () => {
  const text = buildEmergencyDraft(null, "Lost");
  assert.match(text, /Location: unknown/);
  assert.ok(!text.includes("KING COUNTY"));
  assert.ok(!text.includes("Get Location"));
});
test("overdue and missing person drafts never present the caller GPS as the subject location", () => {
  const fix = {
    latitude: 47,
    longitude: -122,
    accuracy: 5,
    timestamp: Date.now(),
  };

  // Overdue case
  const overdueText = buildEmergencyDraft(fix, "Overdue Person");
  assert.match(overdueText, /Missing person’s last known location/);
  assert.ok(!overdueText.includes("47.00000"));

  // Party member missing case
  const missingText = buildEmergencyDraft(fix, "Party Member Missing");
  assert.match(missingText, /Missing person’s last known location/);
  assert.ok(!missingText.includes("47.00000"));
});

test("explicit third-party location omits caller GPS even for generic incident titles", () => {
  const fix = {
    latitude: 47.42537,
    longitude: -121.41382,
    accuracy: 5,
    timestamp: Date.now(),
  };
  const here = buildEmergencyDraft(
    fix,
    "Injured",
    undefined,
    undefined,
    "here",
  );
  assert.match(here, /Emergency at my location/);
  assert.match(here, /47.42537/);
  const elsewhere = buildEmergencyDraft(
    fix,
    "Injured",
    undefined,
    undefined,
    "elsewhere",
  );
  assert.doesNotMatch(elsewhere, /47.42537/);
  assert.match(elsewhere, /last known location/);
});
test("all bundled article targets resolve; no prototype placeholder topic exposed", () => {
  for (const topic of library.GUIDE_TOPICS) {
    assert.notEqual(topic.kind, "soon");
    assert.ok(
      topic.target === "g-missing-split" ||
        Object.hasOwn(library.ARTICLES, topic.target),
      topic.target,
    );
  }
  for (const article of Object.values(library.ARTICLES)) {
    assert.ok(article.blocks.length);
    for (const source of article.sources) assert.ok(source.trim());
    assert.ok(!Object.hasOwn(article, "reviewStatus"));
  }
});

test("bundled content cites sources without implying sponsorship or endorsement", () => {
  const text = JSON.stringify(library);
  // Cited organizations (e.g. KCSAR) are fine as sources; the app must not
  // claim to be their product, voice their volunteers, or carry their review.
  assert.doesNotMatch(text, /KCESAR volunteers|official (KCESAR|KCSAR)/i);
  assert.doesNotMatch(
    text,
    /review pending|reviewed by|endorsed by|sponsored by/i,
  );
});

test("unknown SMS outcome never claims success or failure", () => {
  assert.match(smsOutcomeMessage("unknown"), /cannot verify sending/);
  assert.doesNotMatch(smsOutcomeMessage("unknown"), /not sent/);
  assert.match(smsOutcomeMessage("cancelled"), /cancelled/);
  assert.match(smsOutcomeMessage("sent"), /cannot verify delivery/);
});
