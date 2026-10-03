import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeTripReminderIntents,
  isOverdue,
  newPlan,
  TripPlan,
} from "../src/lib/plans";

const samplePlan: TripPlan = {
  ...newPlan(),
  id: "test-trip-reminder",
  status: "current",
  revision: 1,
  title: "Gothic Basin Day Hike",
  trailhead: "Barlow Pass",
  route: "Monte Cristo road to Gothic Basin trail",
  date: "2026-10-10",
  startTime: "08:00",
  returnDate: "2026-10-10",
  returnTime: "17:00",
  overdueDate: "2026-10-10",
  overdueTime: "20:00",
  timeZone: "America/Los_Angeles",
  partySize: "2",
  travelerName: "Jane Doe",
  travelerPhone: "206 555 0100",
  trustedContactName: "Emergency Contact",
  trustedContactPhone: "206 555 0199",
  vehicle: "Silver Subaru Outback",
  plate: "WA ABC123",
  medical: "",
  comms: ["Cell Phone"],
  members: "",
  allergies: "",
  experience: "",
  outerwear: "",
  shelter: "",
  boots: "",
  extraVehicles: "",
  notes: "",
  remind: true,
};

test("computeTripReminderIntents enforces opt-in invariant: never schedules without consent", () => {
  const optOutPlan = { ...samplePlan, remind: false };
  const intents = computeTripReminderIntents(optOutPlan);
  assert.equal(intents.length, 0);
});

test("computeTripReminderIntents enforces status invariant: only schedules for current active trips", () => {
  const draftPlan = { ...samplePlan, status: "draft" as const };
  assert.equal(computeTripReminderIntents(draftPlan).length, 0);

  const completedPlan = { ...samplePlan, status: "completed" as const };
  assert.equal(computeTripReminderIntents(completedPlan).length, 0);
});

test("computeTripReminderIntents schedules both return and overdue reminders when both are in the future", () => {
  // Reference time: 2026-10-10 at 12:00 PDT (19:00 UTC)
  const now = new Date("2026-10-10T19:00:00Z").getTime();
  const intents = computeTripReminderIntents(samplePlan, now);

  assert.equal(intents.length, 2);

  const returnIntent = intents.find((i) => i.type === "return");
  assert.ok(returnIntent);
  assert.equal(returnIntent.planId, samplePlan.id);
  assert.equal(returnIntent.title, "Expected Return Time");
  // 17:00 PDT is 00:00 UTC on 2026-10-11
  assert.equal(returnIntent.triggerDate.toISOString(), "2026-10-11T00:00:00.000Z");
  assert.match(returnIntent.body, /text your contact/);

  const overdueIntent = intents.find((i) => i.type === "overdue");
  assert.ok(overdueIntent);
  assert.equal(overdueIntent.planId, samplePlan.id);
  assert.equal(overdueIntent.title, "Trip Overdue");
  // 20:00 PDT is 03:00 UTC on 2026-10-11
  assert.equal(overdueIntent.triggerDate.toISOString(), "2026-10-11T03:00:00.000Z");
  assert.match(overdueIntent.body, /contact your designated emergency contact/);
});

test("computeTripReminderIntents drops past triggers and preserves remaining future triggers", () => {
  // Reference time: 2026-10-10 at 18:00 PDT (return was 17:00 PDT, overdue is 20:00 PDT)
  const now = new Date("2026-10-11T01:00:00Z").getTime();
  const intents = computeTripReminderIntents(samplePlan, now);

  assert.equal(intents.length, 1);
  assert.equal(intents[0].type, "overdue");
  assert.equal(intents[0].triggerDate.toISOString(), "2026-10-11T03:00:00.000Z");

  // Reference time: 2026-10-10 at 21:00 PDT (both have passed)
  const laterNow = new Date("2026-10-11T04:00:00Z").getTime();
  assert.equal(computeTripReminderIntents(samplePlan, laterNow).length, 0);
});

test("computeTripReminderIntents accurately respects daylight saving and non-local timezones", () => {
  const estPlan: TripPlan = {
    ...samplePlan,
    timeZone: "America/New_York",
    returnDate: "2026-10-10",
    returnTime: "17:00",
    overdueDate: "2026-10-10",
    overdueTime: "20:00",
  };
  const now = new Date("2026-10-10T12:00:00Z").getTime();
  const intents = computeTripReminderIntents(estPlan, now);

  assert.equal(intents.length, 2);
  // 17:00 EDT (UTC-4) is 21:00 UTC
  assert.equal(intents[0].triggerDate.toISOString(), "2026-10-10T21:00:00.000Z");
  // 20:00 EDT (UTC-4) is 00:00 UTC next day
  assert.equal(intents[1].triggerDate.toISOString(), "2026-10-11T00:00:00.000Z");
});

test("isOverdue correctly evaluates check-in deadlines without false alarms", () => {
  // Before overdue time: 19:59 PDT
  const beforeOverdue = new Date("2026-10-11T02:59:00Z");
  assert.equal(isOverdue(samplePlan, beforeOverdue), false);

  // Exactly at overdue time: 20:00 PDT
  const atOverdue = new Date("2026-10-11T03:00:00Z");
  assert.equal(isOverdue(samplePlan, atOverdue), true);

  // If user completed trip, isOverdue returns false even if past deadline
  const completed = { ...samplePlan, status: "completed" as const };
  assert.equal(isOverdue(completed, atOverdue), false);

  // If user opted out of reminders, isOverdue returns false
  const optedOut = { ...samplePlan, remind: false };
  assert.equal(isOverdue(optedOut, atOverdue), false);
});
