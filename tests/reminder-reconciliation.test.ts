import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reconcileReminders,
  type PendingReminder,
  type ReminderAdapter,
  reminderId,
} from "../src/lib/reminder-reconciliation";
import { newPlan, computeTripReminderIntents } from "../src/lib/plans";
const plan = {
  ...newPlan(),
  status: "current" as const,
  remind: true,
  returnDate: "2027-01-01",
  returnTime: "15:00",
  overdueDate: "2027-01-01",
  overdueTime: "18:00",
  timeZone: "America/Los_Angeles",
};
function adapter(pending: PendingReminder[], granted = true) {
  const cancelled: string[] = [],
    scheduled: string[] = [];
  const api: ReminderAdapter = {
    list: async () => pending,
    cancel: async (id) => {
      cancelled.push(id);
    },
    permission: async () => granted,
    schedule: async (id) => {
      scheduled.push(id);
    },
  };
  return { api, cancelled, scheduled };
}
test("delete, completion and reset remove only owned reminders", async () => {
  for (const plans of [[], [{ ...plan, status: "completed" as const }]]) {
    const a = adapter([
      { identifier: "legacy", data: { planId: plan.id, type: "overdue" } },
      { identifier: "unrelated", data: { other: true } },
    ]);
    assert.equal(await reconcileReminders(plans, a.api, false, 0), "idle");
    assert.deepEqual(a.cancelled, ["legacy"]);
    assert.deepEqual(a.scheduled, []);
  }
});
test("valid pending reminders are retained and missing ones scheduled", async () => {
  const intents = computeTripReminderIntents(plan, 0);
  const a = adapter([
    { identifier: reminderId(intents[0]), data: { owner: "trailsafe" } },
  ]);
  assert.equal(await reconcileReminders([plan], a.api, true, 0), "scheduled");
  assert.deepEqual(a.cancelled, []);
  assert.deepEqual(a.scheduled, [reminderId(intents[1])]);
});
test("denied permissions and native failures are observable", async () => {
  const a = adapter(
    [{ identifier: "old", data: { owner: "trailsafe" } }],
    false,
  );
  assert.equal(await reconcileReminders([plan], a.api, true, 0), "denied");
  assert.deepEqual(a.cancelled, ["old"]);
  a.api.cancel = async () => {
    throw new Error("cancel failed");
  };
  await assert.rejects(reconcileReminders([], a.api), /cancel failed/);
  const b = adapter([]);
  b.api.schedule = async () => {
    throw new Error("schedule failed");
  };
  await assert.rejects(
    reconcileReminders([plan], b.api, true, 0),
    /schedule failed/,
  );
});

test("editing a plan replaces stale reminder text even when deadlines stay the same", async () => {
  const old = computeTripReminderIntents(plan, 0);
  const changed = {
    ...plan,
    title: "Changed destination",
    revision: plan.revision + 1,
  };
  const a = adapter(
    old.map((i) => ({
      identifier: reminderId(i),
      data: { owner: "trailsafe" },
    })),
  );
  await reconcileReminders([changed], a.api, true, 0);
  assert.deepEqual(a.cancelled, old.map(reminderId));
  assert.deepEqual(
    a.scheduled,
    computeTripReminderIntents(changed, 0).map(reminderId),
  );
});
