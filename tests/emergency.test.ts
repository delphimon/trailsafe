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
test("overdue drafts never present the caller GPS as the missing person location", () => {
  const text = buildEmergencyDraft(
    { latitude: 47, longitude: -122, accuracy: 5, timestamp: Date.now() },
    "Overdue Person",
  );
  assert.match(text, /Missing person’s last known location/);
  assert.ok(!text.includes("47.00000"));
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
    assert.ok(article.sources.length);
    assert.match(article.reviewStatus, /pending/);
  }
});
