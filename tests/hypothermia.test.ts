import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assessHypothermiaRisk,
  calculateWindChill,
  
  HYPOTHERMIA_CORE_PRINCIPLES,
  HYPOTHERMIA_FIELD_STEPS,
  HYPOTHERMIA_PRESETS,
  HYPOTHERMIA_UMBLES_MARKERS,
  SHIVERING_CESSATION_WARNING,
} from "../src/lib/hypothermia";

test("calculateWindChill correctly computes NWS wind chill formula", () => {
  // 1. Wind chill undefined / equal to air temp if T > 50°F or wind < 3 mph
  assert.equal(calculateWindChill(55, 15), 55);
  assert.equal(calculateWindChill(40, 2), 40);
  assert.equal(calculateWindChill(32, 0), 32);

  // 2. 32°F with 15 mph wind should be ~22°F according to NOAA tables
  const wc32_15 = calculateWindChill(32, 15);
  assert.equal(wc32_15, 22);

  // 3. 20°F with 25 mph wind should be ~3°F
  const wc20_25 = calculateWindChill(20, 25);
  assert.equal(wc20_25, 3);

  // 4. 40°F with 20 mph wind should be ~30°F
  const wc40_20 = calculateWindChill(40, 20);
  assert.equal(wc40_20, 30);
});


test("assessHypothermiaRisk identifies PNW Cascade Concrete wet cold hazard", () => {
  // Classic Cascade Concrete scenario: 38°F, 25 mph wind, soaked clothing
  const cascade = assessHypothermiaRisk(38, 25, "soaked");
  assert.equal(cascade.isCascadeConcreteHazard, true);
  assert.equal(cascade.riskLevel, "critical");
  assert.match(cascade.riskTitle, /CASCADE CONCRETE/i);
      // Dry windchill is 27°F, minus 22°F wet penalty = effective 5°F
  assert.equal(cascade.windChillF, 27);
  assert.equal(cascade.windChillF, 27);
});

test("assessHypothermiaRisk grades moderate vs high vs low risk states", () => {
  // 1. Warm mild dry day (55°F, 5 mph, dry) -> low
  const low = assessHypothermiaRisk(55, 5, "dry");
  assert.equal(low.riskLevel, "low");
  assert.equal(low.isCascadeConcreteHazard, false);

  // 2. Cool damp day (50°F, 5 mph, damp) -> moderate
  const moderate = assessHypothermiaRisk(50, 5, "damp");
  assert.equal(moderate.riskLevel, "moderate");

  // 3. Cold rainy day (45°F, 8 mph, soaked) -> high
  const high = assessHypothermiaRisk(45, 8, "soaked");
  assert.equal(high.riskLevel, "high");
});

test("all hypothermia presets are valid and calculate correctly", () => {
  assert.equal(HYPOTHERMIA_PRESETS.length, 5);

  for (const preset of HYPOTHERMIA_PRESETS) {
    const assessment = assessHypothermiaRisk(
      preset.airTempF,
      preset.windMph,
      preset.moisture,
    );
    assert.ok(assessment.riskLevel);
    assert.ok(assessment.riskTitle);
    assert.ok(assessment.riskDescription);
      }
});

test("The Umbles markers and SAR field steps are complete and medically sound", () => {
  assert.equal(HYPOTHERMIA_UMBLES_MARKERS.length, 4);
  const names = HYPOTHERMIA_UMBLES_MARKERS.map((m) => m.name);
  assert.deepEqual(names, ["Stumbles", "Mumbles", "Fumbles", "Grumbles"]);

  assert.match(SHIVERING_CESSATION_WARNING, /STOPS shivering/i);
  assert.match(SHIVERING_CESSATION_WARNING, /below 90°F/i);

  assert.equal(HYPOTHERMIA_FIELD_STEPS.length, 5);
  assert.match(HYPOTHERMIA_FIELD_STEPS[0].title, /Stop & Shelter/i);
  assert.match(HYPOTHERMIA_FIELD_STEPS[1].title, /Vapor Barrier|Burrito/i);
  assert.match(HYPOTHERMIA_FIELD_STEPS[2].title, /Ground/i);
});

test("HYPOTHERMIA_CORE_PRINCIPLES and plainExplanation explain the 4 critical life-safety principles", () => {
  assert.equal(HYPOTHERMIA_CORE_PRINCIPLES.length, 4);

  // 1. Cascade Concrete
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[0].title, /Cascade Concrete/i);
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[0].explanation, /35°F and 50°F/i);

  // 2. 25x Water Conductivity
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[1].title, /25x/i);
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[1].explanation, /25 times faster/i);

  // 3. Wind Convection
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[2].title, /Wind Convection/i);
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[2].explanation, /45–60 minutes/i);

  // 4. The Umbles
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[3].title, /Umbles/i);
  assert.match(HYPOTHERMIA_CORE_PRINCIPLES[3].explanation, /Stumbles.*Mumbles.*Fumbles/i);

  // Test plainExplanation
  const cascade = assessHypothermiaRisk(38, 25, "soaked");
  assert.match(cascade.plainExplanation, /25x faster/i);
  assert.match(cascade.plainExplanation, /38°F/);

  const dry = assessHypothermiaRisk(55, 5, "dry");
  assert.match(dry.plainExplanation, /55°F/);
});
