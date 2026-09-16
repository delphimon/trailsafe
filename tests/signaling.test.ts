import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getMorseSOSElements,
  WHISTLE_CADENCE_STEPS,
  TOTAL_WHISTLE_CYCLE_SECONDS,
} from "../src/lib/signaling";
import {
  calculateHikingTime,
  getSlopeAvalancheRisk,
  WATER_TREATMENT_PRESETS,
} from "../src/lib/hiking-tools";

test("optical Morse SOS sequence complies with ITU-R ratio standard", () => {
  const elements = getMorseSOSElements();
  assert.ok(elements.length >= 18);

  const lightElements = elements.filter((e) => e.light);
  assert.equal(lightElements.length, 9, "SOS requires 9 light flashes (3 dots, 3 dashes, 3 dots)");

  // Verify first 3 are dots (200ms)
  assert.equal(lightElements[0].durationMs, 200);
  assert.equal(lightElements[1].durationMs, 200);
  assert.equal(lightElements[2].durationMs, 200);

  // Verify middle 3 are dashes (600ms)
  assert.equal(lightElements[3].durationMs, 600);
  assert.equal(lightElements[4].durationMs, 600);
  assert.equal(lightElements[5].durationMs, 600);

  // Verify last 3 are dots (200ms)
  assert.equal(lightElements[6].durationMs, 200);
  assert.equal(lightElements[7].durationMs, 200);
  assert.equal(lightElements[8].durationMs, 200);

  // Verify cycle ends with word pause
  const lastPause = elements[elements.length - 1];
  assert.equal(lastPause.light, false);
  assert.equal(lastPause.durationMs, 2000);
});

test("alpine SAR whistle cadence mandates 3 blasts and 60-second listening window", () => {
  assert.equal(WHISTLE_CADENCE_STEPS.length, 6);
  assert.equal(TOTAL_WHISTLE_CYCLE_SECONDS, 71);

  const blasts = WHISTLE_CADENCE_STEPS.filter((s) => s.isBlasting);
  assert.equal(blasts.length, 3, "SAR distress standard strictly requires 3 blasts");

  const listeningPhase = WHISTLE_CADENCE_STEPS.find(
    (s) => s.phase === "listening",
  );
  assert.ok(listeningPhase, "Must include explicit listening phase");
  assert.equal(
    listeningPhase.durationSeconds,
    60,
    "Listening window must be at least 60 seconds",
  );
  assert.match(
    listeningPhase.displayInstruction,
    /2 blasts/i,
    "Instruction must teach hiker that responders reply with 2 blasts",
  );
});

test("Naismith's Rule calculation factors in elevation gain and pack weight", () => {
  // 3 miles flat at moderate (2.8 mph) with light pack -> ~64 min
  const flat = calculateHikingTime(3, 0, 0, "moderate", "light");
  assert.equal(flat.ascentMinutes, 0);
  assert.ok(flat.totalMinutes >= 60 && flat.totalMinutes <= 70);

  // 3 miles + 2,000 ft ascent (+60 min ascent)
  const mountain = calculateHikingTime(3, 2000, 0, "moderate", "light");
  assert.equal(mountain.ascentMinutes, 60);
  assert.equal(mountain.totalMinutes, flat.totalMinutes + 60);

  // Overnight pack increases total duration
  const overnight = calculateHikingTime(3, 2000, 0, "moderate", "overnight");
  assert.ok(
    overnight.totalMinutes > mountain.totalMinutes,
    "Overnight pack should take longer than light pack",
  );

  // Zero distance returns zero
  const zero = calculateHikingTime(0, 0);
  assert.equal(zero.totalMinutes, 0);
  assert.equal(zero.formattedDuration, "0m");
});

test("slope avalanche risk flags 30°-45° as prime hazard zone", () => {
  const low = getSlopeAvalancheRisk(22);
  assert.equal(low.level, "low");
  assert.equal(low.color, "#2D6A4F");

  const prime34 = getSlopeAvalancheRisk(34);
  assert.equal(prime34.level, "prime");
  assert.equal(prime34.color, "#E4572E");
  assert.match(prime34.title, /PRIME AVALANCHE ZONE/);

  const prime38 = getSlopeAvalancheRisk(38);
  assert.equal(prime38.level, "prime");

  const prime45 = getSlopeAvalancheRisk(45);
  assert.equal(prime45.level, "prime");

  const extreme = getSlopeAvalancheRisk(52);
  assert.equal(extreme.level, "extreme");
  assert.equal(extreme.color, "#C98A2C");
});

test("water treatment presets contain essential cold-water and boil variations", () => {
  assert.equal(WATER_TREATMENT_PRESETS.length, 6);

  const cold = WATER_TREATMENT_PRESETS.find((p) => p.id === "aquamira-cold");
  assert.ok(cold);
  assert.equal(cold.durationSeconds, 1800); // 30 min

  const warm = WATER_TREATMENT_PRESETS.find((p) => p.id === "aquamira-warm");
  assert.ok(warm);
  assert.equal(warm.durationSeconds, 900); // 15 min

  const boilHigh = WATER_TREATMENT_PRESETS.find((p) => p.id === "boil-high");
  assert.ok(boilHigh);
  assert.equal(boilHigh.durationSeconds, 180); // 3 min

  const steripen = WATER_TREATMENT_PRESETS.find((p) => p.id === "steripen");
  assert.ok(steripen);
  assert.equal(steripen.durationSeconds, 90);
});
