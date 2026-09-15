import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newPlan,
  validatePlan,
  suggestOverdue,
  buildPlanText,
  planHTML,
  isOverdue,
  addDays,
  currentTimeRounded,
  buildSafeReturnDraft,
} from "../src/lib/plans";
import { initialData, parseStoredData } from "../src/lib/persistence";
const p = {
  ...newPlan(),
  title: "Granite Mountain",
  name: "Hiker",
  phone: "206 555 0100",
  partySize: "2",
  trailhead: "Granite Mountain trailhead",
  route: "Summit and return",
  date: "2026-09-06",
  startTime: "08:00",
  returnDate: "2026-09-06",
  returnTime: "23:00",
  overdueDate: "2026-09-07",
  overdueTime: "01:00",
  timeZone: "America/Los_Angeles",
};
test("a complete overnight plan validates", () =>
  assert.deepEqual(validatePlan(p), []));
test("overdue suggestion carries the date across midnight and year end", () => {
  assert.deepEqual(suggestOverdue("2026-12-31", "23:30"), {
    overdueDate: "2027-01-01",
    overdueTime: "01:30",
  });
});
test("invalid dates, times, party sizes, and reversed deadlines are rejected", () => {
  for (const patch of [
    { date: "2026-02-30" },
    { startTime: "25:10" },
    { partySize: "2.5" },
    { overdueDate: "2026-09-06", overdueTime: "22:00" },
    { returnDate: "2026-09-05" },
  ])
    assert.ok(validatePlan({ ...p, ...patch }).length);
});
test("raw multiline route and contact fields survive text output", () => {
  const text = buildPlanText({
    ...p,
    route: "First leg\nSecond leg",
    revision: 2,
  });
  assert.match(text, /UPDATED KCESAR/);
  assert.match(text, /First leg\nSecond leg/);
  assert.match(text, /2026-09-07 01:00 \(America\/Los_Angeles\)/);
  assert.match(text, /Try to call or text me/);
  assert.match(text, /not monitored/);
  assert.match(text, /206 555 0100/);
});
test("PDF output escapes user input", () => {
  const html = planHTML({ ...p, title: '<script>alert("test")</script>' });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});
test("local check-in flag uses saved time zone and requires current plus opt-in", () => {
  const q = { ...p, status: "current" as const, remind: true };
  assert.equal(isOverdue(q, new Date("2026-09-07T07:59:00Z")), false);
  assert.equal(isOverdue(q, new Date("2026-09-07T08:00:00Z")), true);
  assert.equal(
    isOverdue({ ...q, status: "completed" }, new Date("2026-09-08T08:00:00Z")),
    false,
  );
});
test("versioned storage round trips without losing plan details", () => {
  const s = {
    ...initialData,
    plans: [p],
    checks: ["ess-1"],
    format: "UTM" as const,
  };
  assert.deepEqual(parseStoredData(JSON.stringify(s)), s);
});
test("versioned storage supports dual vehicles in profile and migrates legacy profile", () => {
  const withDualCars = {
    ...initialData,
    profile: {
      ...initialData.profile,
      vehicle: "Silver Subaru Outback",
      plate: "WA ABC123",
      vehicle2: "Blue Rivian R1S",
      plate2: "WA XYZ789",
    },
  };
  assert.deepEqual(parseStoredData(JSON.stringify(withDualCars)), withDualCars);

  // Legacy profile with only vehicle and plate (no vehicle2 or plate2)
  const legacyProfile = {
    name: "Hiker",
    phone: "206 555 0100",
    vehicle: "Silver Subaru Outback",
    plate: "WA ABC123",
    medical: "None",
    comms: ["Phone"],
  };
  const legacyRaw = JSON.stringify({
    ...initialData,
    profile: legacyProfile,
  });
  const parsed = parseStoredData(legacyRaw);
  assert.equal(parsed.profile.vehicle, "Silver Subaru Outback");
  assert.equal(parsed.profile.plate, "WA ABC123");
  assert.equal(parsed.profile.vehicle2, "");
  assert.equal(parsed.profile.plate2, "");
});
test("damaged or unknown storage is rejected instead of silently reset", () => {
  for (const raw of [
    "invalid",
    "{}",
    JSON.stringify({ ...initialData, version: 2 }),
    JSON.stringify({ ...initialData, plans: [{}] }),
    JSON.stringify({ ...initialData, plans: [{ ...p, timeZone: "bad-zone" }] }),
  ])
    assert.throws(() => parseStoredData(raw));
});
test("safe return notification draft includes destination and safe confirmation", () => {
  const draft = buildSafeReturnDraft(p);
  assert.match(draft, /Granite Mountain/);
  assert.match(draft, /back safely/);
  assert.match(draft, /TrailSafe/);
});
test("addDays correctly increments dates", () => {
  assert.equal(addDays("2026-09-13", 1), "2026-09-14");
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-12-31", 2), "2027-01-02");
});
test("suggestOverdue with custom hours calculates correct deadline", () => {
  assert.deepEqual(suggestOverdue("2026-09-13", "14:00", 3), {
    overdueDate: "2026-09-13",
    overdueTime: "17:00",
  });
  assert.deepEqual(suggestOverdue("2026-09-13", "22:00", 4), {
    overdueDate: "2026-09-14",
    overdueTime: "02:00",
  });
});
test("currentTimeRounded rounds to five minutes in 24-hour format", () => {
  const d = new Date("2026-09-13T14:12:00");
  assert.equal(currentTimeRounded(d), "14:15");
});

