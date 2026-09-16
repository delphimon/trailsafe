import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSolarTimes,
  formatDurationMinutes,
  getCanopyOffsetMinutes,
  PNW_TRAILHEAD_PRESETS,
} from "../src/lib/solar";

test("solar calculations accurately determine sunrise and sunset for PNW", () => {
  // Seattle: 47.6062° N, 122.3321° W on Autumnal Equinox approx (2026-09-22)
  const equinoxDate = new Date("2026-09-22T12:00:00Z");
  const times = calculateSolarTimes(47.6062, -122.3321, equinoxDate, "open");

  assert.ok(times.sunrise !== null);
  assert.ok(times.sunset !== null);
  assert.ok(times.civilDusk !== null);

  // On equinox, day length is approx 12 hours (720 min ± 25 min due to refraction/latitude)
  assert.ok(
    times.dayLengthMinutes >= 700 && times.dayLengthMinutes <= 745,
    `Expected day length ~720 min, got ${times.dayLengthMinutes}`,
  );

  // Summer Solstice (2026-06-21): Seattle gets ~16 hours of daylight
  const solsticeSummer = calculateSolarTimes(
    47.6062,
    -122.3321,
    new Date("2026-06-21T12:00:00Z"),
    "open",
  );
  assert.ok(
    solsticeSummer.dayLengthMinutes >= 940 &&
      solsticeSummer.dayLengthMinutes <= 980,
    `Expected summer day length ~960 min, got ${solsticeSummer.dayLengthMinutes}`,
  );

  // Winter Solstice (2026-12-21): Seattle gets ~8.5 hours of daylight (~510 min)
  const solsticeWinter = calculateSolarTimes(
    47.6062,
    -122.3321,
    new Date("2026-12-21T12:00:00Z"),
    "open",
  );
  assert.ok(
    solsticeWinter.dayLengthMinutes >= 490 &&
      solsticeWinter.dayLengthMinutes <= 535,
    `Expected winter day length ~510 min, got ${solsticeWinter.dayLengthMinutes}`,
  );
});

test("forest canopy penalties correctly accelerate trail darkness", () => {
  const refDate = new Date("2026-09-15T12:00:00Z");
  const lat = 47.425;
  const lon = -121.414; // Snoqualmie Pass

  const open = calculateSolarTimes(lat, lon, refDate, "open");
  const moderate = calculateSolarTimes(lat, lon, refDate, "moderate");
  const dense = calculateSolarTimes(lat, lon, refDate, "dense");

  assert.equal(getCanopyOffsetMinutes("open"), 0);
  assert.equal(getCanopyOffsetMinutes("moderate"), 30);
  assert.equal(getCanopyOffsetMinutes("dense"), 60);

  assert.equal(
    open.forestDusk?.getTime(),
    open.civilDusk?.getTime(),
    "Open ridge forest dusk should equal civil dusk",
  );

  const diffModerateMs =
    (open.civilDusk?.getTime() ?? 0) - (moderate.forestDusk?.getTime() ?? 0);
  assert.equal(
    diffModerateMs / 60000,
    30,
    "Moderate canopy should be 30 min earlier than civil dusk",
  );

  const diffDenseMs =
    (open.civilDusk?.getTime() ?? 0) - (dense.forestDusk?.getTime() ?? 0);
  assert.equal(
    diffDenseMs / 60000,
    60,
    "Dense old-growth canopy should be 60 min earlier than civil dusk",
  );
});

test("solar position azimuth and elevation remain within physical limits", () => {
  const times = calculateSolarTimes(
    47.425,
    -121.414,
    new Date("2026-09-15T20:00:00Z"), // ~1:00 PM PDT (near solar noon)
  );

  assert.ok(
    times.solarElevationDeg >= -90 && times.solarElevationDeg <= 90,
    `Solar elevation ${times.solarElevationDeg} out of bounds`,
  );
  assert.ok(
    times.solarAzimuthDeg >= 0 && times.solarAzimuthDeg <= 360,
    `Solar azimuth ${times.solarAzimuthDeg} out of bounds`,
  );

  // Near noon in northern hemisphere, sun should be toward the south (~140° to 220°)
  assert.ok(
    times.solarAzimuthDeg >= 140 && times.solarAzimuthDeg <= 220,
    `Expected midday azimuth toward south (140°-220°), got ${times.solarAzimuthDeg}°`,
  );
});

test("PNW trailhead presets are valid and calculate without errors", () => {
  assert.equal(PNW_TRAILHEAD_PRESETS.length, 6);
  const now = new Date("2026-09-15T18:00:00Z");

  for (const preset of PNW_TRAILHEAD_PRESETS) {
    const times = calculateSolarTimes(
      preset.latitude,
      preset.longitude,
      now,
      "dense",
    );
    assert.ok(times.sunrise !== null, `${preset.name} missing sunrise`);
    assert.ok(times.sunset !== null, `${preset.name} missing sunset`);
    assert.ok(times.forestDusk !== null, `${preset.name} missing forest dusk`);
    assert.ok(times.dayLengthMinutes > 0);
  }
});

test("formatDurationMinutes handles edge cases and plural formatting", () => {
  assert.equal(formatDurationMinutes(0), "0m");
  assert.equal(formatDurationMinutes(45), "45m");
  assert.equal(formatDurationMinutes(60), "1h 00m");
  assert.equal(formatDurationMinutes(135), "2h 15m");
  assert.equal(formatDurationMinutes(-90), "1h 30m");
});

test("invalid coordinates reject invalid bounds", () => {
  assert.throws(() => calculateSolarTimes(95, 0));
  assert.throws(() => calculateSolarTimes(0, 195));
  assert.throws(() => calculateSolarTimes(NaN, 0));
});
