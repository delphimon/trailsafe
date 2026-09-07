import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCoordinates,
  toUTM,
  utmZone,
  fixWarnings,
  locationText,
  validCoordinates,
} from "../src/lib/coordinates";
const fix = {
  latitude: 47.42537,
  longitude: -121.41382,
  accuracy: 8,
  timestamp: Date.UTC(2026, 8, 6, 10),
};
test("decimal degrees retain correct hemisphere and WGS84", () => {
  assert.equal(formatCoordinates(fix, "DD"), "47.42537° N\n121.41382° W");
  assert.match(locationText(fix, "DD", fix.timestamp)!, /DD, WGS84/);
});
test("DDM conversion agrees with the product definition example", () =>
  assert.equal(formatCoordinates(fix, "DDM"), "47° 25.522′ N\n121° 24.829′ W"));
test("DDM rounds through degree boundary without producing 60 minutes", () =>
  assert.equal(
    formatCoordinates(
      { latitude: -12.99999999, longitude: 179.99999999 },
      "DDM",
    ),
    "13° 00.000′ S\n180° 00.000′ E",
  ));
test("UTM central meridian has false easting 500000 and equatorial northing zero", () => {
  const p = toUTM(0, 3)!;
  assert.equal(p.zone, 31);
  assert.equal(p.easting, 500000);
  assert.equal(p.northing, 0);
  assert.equal(p.hemisphere, "N");
});
test("UTM equator western zone boundary is the known WGS84 fixture", () => {
  const p = toUTM(0, 0)!;
  assert.equal(p.easting, 166021);
  assert.equal(p.northing, 0);
});
test("southern hemisphere uses false northing", () => {
  const p = toUTM(-45, 3)!;
  assert.equal(p.easting, 500000);
  assert.ok(Math.abs(p.northing - 5017050) <= 1);
  assert.equal(p.hemisphere, "S");
  assert.equal(p.band, "G");
});
test("Norway and Svalbard zone exceptions and antimeridian boundaries", () => {
  assert.equal(utmZone(60, 6), 32);
  assert.equal(utmZone(75, 8), 31);
  assert.equal(utmZone(75, 10), 33);
  assert.equal(utmZone(75, 22), 35);
  assert.equal(utmZone(75, 35), 37);
  assert.equal(utmZone(0, 180), 60);
  assert.equal(utmZone(0, -180), 1);
});
test("UTM rejects polar positions while DD remains usable", () => {
  assert.equal(toUTM(85, 0), null);
  assert.equal(toUTM(-81, 0), null);
  assert.ok(formatCoordinates({ latitude: 85, longitude: 0 }, "DD"));
  assert.ok(toUTM(84, 0));
  assert.ok(toUTM(-80, 0));
});
test("invalid coordinates are never rendered", () => {
  assert.equal(validCoordinates(NaN, 0), false);
  assert.equal(formatCoordinates({ latitude: 91, longitude: 0 }, "DD"), null);
  assert.equal(toUTM(0, 181), null);
});
test("stale and low-accuracy warnings travel with copied coordinates", () => {
  const f = { ...fix, accuracy: 300 };
  const text = locationText(f, "UTM", f.timestamp + 120000)!;
  assert.match(text, /STALE LOCATION/);
  assert.match(text, /LOW ACCURACY/);
  assert.match(text, /120 seconds old/);
  assert.match(text, /±300 m/);
  assert.match(text, /2026-09-06T10:00:00.000Z/);
});
test("unknown accuracy is not reported as zero; mocked position is labeled", () => {
  assert.match(
    locationText({ ...fix, accuracy: null }, "DD", fix.timestamp)!,
    /Accuracy: unknown/,
  );
  assert.match(
    fixWarnings({ ...fix, mocked: true }, fix.timestamp).join(" "),
    /SIMULATED/,
  );
});
