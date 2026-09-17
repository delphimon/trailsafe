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

test("24-hour headlamp notification logic distinguishes daylight from nighttime without UTC rollover corruption", () => {
  const lat = 47.6062;
  const lon = -122.3321; // Seattle, WA (UTC-7 PDT in September)

  // 1. Afternoon daylight: 5:30 PM PDT (00:30 UTC next day)
  // Forest dusk on moderate canopy is ~7:15 PM PDT.
  // Must calculate ~1.75 hours (105 min), NOT 25.5 hours.
  const afternoonDate = new Date("2026-09-17T00:30:00Z");
  const afternoonTimes = calculateSolarTimes(lat, lon, afternoonDate, "moderate");

  assert.equal(afternoonTimes.headlampNeededNow, false);
  assert.equal(afternoonTimes.isTrailDaylight, true);
  assert.ok(
    afternoonTimes.minutesUntilForestDusk !== null &&
      afternoonTimes.minutesUntilForestDusk >= 90 &&
      afternoonTimes.minutesUntilForestDusk <= 120,
    `Expected ~105 min until dusk tonight, got ${afternoonTimes.minutesUntilForestDusk}`,
  );
  assert.match(
    afternoonTimes.headlampStatusHeadline,
    /^Headlamp needed in 1h (4[0-9]|5[0-9])m$/,
  );
  assert.match(
    afternoonTimes.headlampStatusSubtext,
    /Forest Dusk tonight/,
  );

  // 2. Evening night: 9:00 PM PDT (04:00 UTC next day)
  // Dusk occurred at ~7:15 PM PDT. It is currently dark!
  // Must indicate headlamp needed NOW until tomorrow morning's sunrise (~6:48 AM, ~9.8 hours away), NOT 22 hours.
  const eveningDate = new Date("2026-09-17T04:00:00Z");
  const eveningTimes = calculateSolarTimes(lat, lon, eveningDate, "moderate");

  assert.equal(eveningTimes.headlampNeededNow, true);
  assert.equal(eveningTimes.isTrailDaylight, false);
  assert.ok(eveningTimes.nextSunrise !== null);
  assert.ok(
    eveningTimes.minutesUntilNextSunrise !== null &&
      eveningTimes.minutesUntilNextSunrise >= 550 &&
      eveningTimes.minutesUntilNextSunrise <= 620,
    `Expected ~587 min until tomorrow sunrise, got ${eveningTimes.minutesUntilNextSunrise}`,
  );
  assert.match(
    eveningTimes.headlampStatusHeadline,
    /^Headlamp needed now until /i,
  );
  assert.match(
    eveningTimes.headlampStatusSubtext,
    /Natural light returns at .* \(in [0-9]+h [0-9]+m\)/,
  );

  // 3. Pre-dawn night: 4:00 AM PDT (11:00 UTC)
  // Sun has not risen yet.
  // Must indicate headlamp needed NOW until today's sunrise (~6:47 AM, ~2.75 hours away).
  const preDawnDate = new Date("2026-09-16T11:00:00Z");
  const preDawnTimes = calculateSolarTimes(lat, lon, preDawnDate, "moderate");

  assert.equal(preDawnTimes.headlampNeededNow, true);
  assert.equal(preDawnTimes.isTrailDaylight, false);
  assert.ok(preDawnTimes.nextSunrise !== null);
  assert.ok(
    preDawnTimes.minutesUntilNextSunrise !== null &&
      preDawnTimes.minutesUntilNextSunrise >= 150 &&
      preDawnTimes.minutesUntilNextSunrise <= 180,
    `Expected ~167 min until today sunrise, got ${preDawnTimes.minutesUntilNextSunrise}`,
  );
  assert.match(
    preDawnTimes.headlampStatusHeadline,
    /^Headlamp needed now until /i,
  );
});

test("invalid coordinates reject invalid bounds", () => {
  assert.throws(() => calculateSolarTimes(95, 0));
  assert.throws(() => calculateSolarTimes(0, 195));
  assert.throws(() => calculateSolarTimes(NaN, 0));
});

