import { test } from "node:test";
import assert from "node:assert/strict";
import { commitTripCommand } from "../src/lib/trip-commands";
import { initialData, type StoredData } from "../src/lib/persistence";
import { completeTrip, newPlan } from "../src/lib/plans";

test("trip command waits for durable save and rejects storage failure", async () => {
  const plan = newPlan();
  const data = { ...initialData, plans: [plan] };
  let finish!: () => void;
  let returned = false;
  const pending = commitTripCommand(
    async (fn) => {
      fn(data);
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
    },
    (plans) => completeTrip(plan.id, plans),
  ).then(() => {
    returned = true;
  });
  await Promise.resolve();
  assert.equal(returned, false);
  finish();
  await pending;
  assert.equal(returned, true);
  await assert.rejects(
    commitTripCommand(
      async (fn) => {
        fn(data);
        throw new Error("disk failure");
      },
      (plans) => completeTrip(plan.id, plans),
    ),
    /disk failure/,
  );
});
test("queued trip changes use the newest snapshot and preserve unrelated plans", async () => {
  const plan = newPlan();
  let data: StoredData = { ...initialData, plans: [plan] };
  const other = { ...newPlan(), id: "other" };
  const update = async (fn: (d: StoredData) => StoredData) => {
    data = { ...data, plans: [...data.plans, other] };
    data = fn(data);
  };
  await commitTripCommand(update, (plans) => completeTrip(plan.id, plans));
  assert.equal(data.plans.length, 2);
  assert.equal(data.plans[0].status, "completed");
  assert.equal(data.plans[1].id, "other");
});
