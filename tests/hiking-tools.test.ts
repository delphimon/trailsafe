import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateHikingTime } from "../src/lib/hiking-tools";

test("Naismith's Rule calculation factors in elevation gain and pack weight", () => {
  // 3 miles flat at moderate (2.5 mph) with light pack -> ~72 min moving + ~12m breaks
  const flat = calculateHikingTime(3, 0, 0, "moderate", "light", "standard");
  assert.equal(flat.ascentMinutes, 0);
  assert.ok(flat.totalMinutes >= 80 && flat.totalMinutes <= 90);

  // 3 miles + 2,000 ft ascent (+60 min ascent) -> 132 min moving + 22m breaks
  const mountain = calculateHikingTime(
    3,
    2000,
    0,
    "moderate",
    "light",
    "standard",
  );
  assert.equal(mountain.ascentMinutes, 60);
  assert.equal(mountain.breaksMinutes, 22);

  // Overnight pack increases total duration
  const overnight = calculateHikingTime(
    3,
    2000,
    0,
    "moderate",
    "overnight",
    "standard",
  );
  assert.ok(
    overnight.totalMinutes > mountain.totalMinutes,
    "Overnight pack should take longer than light pack",
  );

  // Zero distance returns zero
  const zero = calculateHikingTime(0, 0);
  assert.equal(zero.totalMinutes, 0);
  assert.equal(zero.formattedDuration, "0m");
});
