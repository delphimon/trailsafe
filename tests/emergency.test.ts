import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEmergencyDraft,
  performEmergencyAction,
} from "../src/lib/emergency";
import library from "../src/content/library.json";
test("every practice action blocks both native handoffs", async () => {
  let calls = 0,
    texts = 0;
  const simulated: string[] = [];
  for (const action of ["call", "text"] as const)
    await performEmergencyAction(true, action, {
      simulate: (a) => simulated.push(a),
      call: async () => {
        calls++;
      },
      text: async () => {
        texts++;
      },
    });
  assert.equal(calls, 0);
  assert.equal(texts, 0);
  assert.deepEqual(simulated, ["call", "text"]);
});
test("live action routes only to the requested injected handoff", async () => {
  let calls = 0,
    texts = 0;
  await performEmergencyAction(false, "text", {
    simulate: () => assert.fail(),
    call: async () => {
      calls++;
    },
    text: async () => {
      texts++;
    },
  });
  assert.equal(calls, 0);
  assert.equal(texts, 1);
});
test("missing GPS is explicit and never invents a county or position", () => {
  const text = buildEmergencyDraft(null, "Lost");
  assert.match(text, /Location: unknown/);
  assert.ok(!text.includes("KING COUNTY"));
  assert.ok(!text.includes("Get Location"));
});
test("overdue and missing person drafts never present the caller GPS as the subject location", () => {
  const fix = { latitude: 47, longitude: -122, accuracy: 5, timestamp: Date.now() };
  
  // Overdue case
  const overdueText = buildEmergencyDraft(fix, "Overdue Person");
  assert.match(overdueText, /Missing person’s last known location/);
  assert.ok(!overdueText.includes("47.00000"));

  // Party member missing case
  const missingText = buildEmergencyDraft(fix, "Party Member Missing");
  assert.match(missingText, /Missing person’s last known location/);
  assert.ok(!missingText.includes("47.00000"));
});

test("generic emergency drafts clearly label caller location with prompt for third-party reporting", () => {
  const fix = { latitude: 47.42537, longitude: -121.41382, accuracy: 5, timestamp: Date.now() };
  const genericText = buildEmergencyDraft(fix, "Describe what happened");
  assert.match(genericText, /47\.42537° N, 121\.41382° W/);
  assert.match(genericText, /If reporting someone else, replace with their last known location/);
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
  assert.doesNotMatch(text, /review pending|reviewed by|endorsed by|sponsored by/i);
});
