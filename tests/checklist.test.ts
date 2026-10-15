import { test } from "node:test";
import assert from "node:assert/strict";
import { toggleChecklist } from "../src/lib/checklist";
import { initialData } from "../src/lib/persistence";
import { newPlan } from "../src/lib/plans";
const current = {
  ...newPlan(),
  id: "current-trip",
  status: "current" as const,
};
test("first check attaches empty progress to the latest current trip", () => {
  const result = toggleChecklist(
    { ...initialData, plans: [current] },
    "essential:Water",
    100,
  );
  assert.equal(result.planId, current.id);
  assert.equal(result.startedAt, 100);
  assert.equal(result.updatedAt, 100);
  assert.deepEqual(result.checks, ["essential:Water"]);
});
test("existing older progress keeps its identity until cleared", () => {
  const checklist = {
    checks: ["essential:Water"],
    planId: "old-trip",
    startedAt: 1,
    updatedAt: 2,
  };
  const result = toggleChecklist(
    { ...initialData, plans: [current], checklist },
    "essential:Food",
    100,
  );
  assert.equal(result.planId, "old-trip");
  assert.equal(result.startedAt, 1);
  const empty = toggleChecklist(
    { ...initialData, plans: [current], checklist },
    "essential:Water",
    100,
  );
  assert.deepEqual(empty.checks, []);
  assert.equal(
    toggleChecklist(
      { ...initialData, plans: [current], checklist: empty },
      "essential:Water",
      101,
    ).planId,
    current.id,
  );
});
test("empty progress without a current trip never retains a previous trip association", () => {
  const result = toggleChecklist(
    {
      ...initialData,
      checklist: { ...initialData.checklist, planId: "old-trip" },
    },
    "essential:Water",
    100,
  );
  assert.equal(result.planId, undefined);
});
