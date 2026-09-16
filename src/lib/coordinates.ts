/**
 * @file coordinates.ts
 * @description Coordinate transformation, validation, and formatting for emergency SAR operations.
 *
 * Supports three primary coordinate systems used by search and rescue in North America:
 * 1. Decimal Degrees (DD, WGS84) - Standard for dispatch, text-to-911, and modern digital mapping.
 * 2. Degrees & Decimal Minutes (DDM, WGS84) - Standard for aviation SAR (King County Sheriff Air Support).
 * 3. Universal Transverse Mercator (UTM, WGS84) - Standard for ground search teams, topographic quad maps, and USNG.
 */

import proj4 from "proj4";

/** Supported coordinate display formats in TrailSafe. */
export type CoordinateFormat = "DD" | "DDM" | "UTM";

/**
 * In-memory location fix captured from the device GPS or browser geolocation.
 * Fixes are held in transient memory only and never saved to persistent storage.
 */
export type Fix = {
  /** Latitude in decimal degrees [-90, +90]. */
  latitude: number;
  /** Longitude in decimal degrees [-180, +180]. */
  longitude: number;
  /** Horizontal uncertainty in meters (null if unknown). */
  accuracy: number | null;
  /** Epoch timestamp in milliseconds when the fix was acquired. */
  timestamp: number;
  /** Altitude in meters above WGS84 ellipsoid or sea level (optional). */
  altitude?: number | null;
  /** Vertical accuracy in meters (optional). */
  altitudeAccuracy?: number | null;
  /** True if the location provider explicitly flagged the coordinate as simulated/mocked. */
  mocked?: boolean;
};

/** Formats list for dropdown selection and user configuration. */
export const FORMATS: { value: CoordinateFormat; label: string }[] = [
  { value: "DD", label: "Decimal degrees (DD)" },
  { value: "DDM", label: "Degrees & decimal minutes (DDM)" },
  { value: "UTM", label: "Universal Transverse Mercator (UTM)" },
];

/**
 * Validates that latitude and longitude are finite numbers within physical geographic bounds.
 *
 * @param lat Latitude in decimal degrees.
 * @param lon Longitude in decimal degrees.
 * @returns True if coordinates are valid WGS84 points.
 */
export function validCoordinates(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}

/**
 * Converts a single decimal degree coordinate to degrees and decimal minutes (DDM).
 * Rounds to 3 decimal places (thousandths of a minute, ~6 feet precision).
 * Properly carries over 59.99995+ minutes into degree increments to prevent "60.000′".
 *
 * @param value Decimal degree value.
 * @param latitude True for latitude (N/S), false for longitude (E/W).
 * @returns Formatted string, e.g. "47° 25.522′ N".
 */
function ddm(value: number, latitude: boolean): string {
  // Round before splitting so 59.99995 minutes correctly carries into degrees.
  const thousandths = Math.round(Math.abs(value) * 60 * 1000);
  const degrees = Math.floor(thousandths / 60000);
  const minutes = ((thousandths % 60000) / 1000).toFixed(3).padStart(6, "0");
  return `${degrees}° ${minutes}′ ${latitude ? (value < 0 ? "S" : "N") : value < 0 ? "W" : "E"}`;
}

/**
 * Calculates the UTM longitudinal zone number (1-60), taking into account
 * international exceptions for southwest Norway and Svalbard.
 *
 * @param lat Latitude in decimal degrees.
 * @param lon Longitude in decimal degrees.
 * @returns UTM zone number (1 to 60).
 */
export function utmZone(lat: number, lon: number): number {
  let zone = Math.min(60, Math.floor((lon + 180) / 6) + 1);
  // Norway zone 32V exception (between 56°N and 64°N, 3°E and 12°E)
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  // Svalbard zone 31X, 33X, 35X, 37X exceptions (between 72°N and 84°N)
  if (lat >= 72 && lat < 84 && lon >= 0 && lon < 42)
    zone = lon < 9 ? 31 : lon < 21 ? 33 : lon < 33 ? 35 : 37;
  return zone;
}

/**
 * Projects a WGS84 coordinate into the Universal Transverse Mercator (UTM) system.
 * Polar coordinates outside 80°S to 84°N are rejected as UTM is undefined there.
 *
 * @param lat Latitude in decimal degrees.
 * @param lon Longitude in decimal degrees.
 * @returns UTM object containing zone, band letter, hemisphere, easting, northing, or null if invalid.
 */
export function toUTM(lat: number, lon: number) {
  if (!validCoordinates(lat, lon) || lat < -80 || lat > 84) return null;
  const zone = utmZone(lat, lon);
  const [easting, northing] = proj4(
    "EPSG:4326",
    `+proj=utm +zone=${zone} ${lat < 0 ? "+south " : ""}+datum=WGS84 +units=m +no_defs`,
    [lon, lat],
  );
  const band = "CDEFGHJKLMNPQRSTUVWXX"[Math.floor((lat + 80) / 8)];
  return {
    zone,
    band,
    hemisphere: lat < 0 ? "S" : "N",
    easting: Math.round(easting),
    northing: Math.round(northing),
  };
}

/**
 * Formats coordinates for high-legibility display on emergency cards and text drafts.
 *
 * @param fix Object containing latitude and longitude.
 * @param format Requested coordinate format ("DD", "DDM", or "UTM").
 * @returns Two-line formatted coordinate string, or null if coordinates are invalid.
 */
export function formatCoordinates(
  fix: Pick<Fix, "latitude" | "longitude">,
  format: CoordinateFormat,
): string | null {
  const { latitude: lat, longitude: lon } = fix;
  if (!validCoordinates(lat, lon)) return null;
  if (format === "DDM") return `${ddm(lat, true)}\n${ddm(lon, false)}`;
  if (format === "UTM") {
    const u = toUTM(lat, lon);
    return u
      ? `${u.zone}${u.band} · ${u.hemisphere === "N" ? "Northern" : "Southern"} hemisphere\n${u.easting} m E  ${u.northing} m N`
      : null;
  }
  return `${Math.abs(lat).toFixed(5)}° ${lat < 0 ? "S" : "N"}\n${Math.abs(lon).toFixed(5)}° ${lon < 0 ? "W" : "E"}`;
}

/**
 * Calculates the age of a GPS fix in seconds relative to a given timestamp.
 *
 * @param fix The location fix to inspect.
 * @param now Current epoch timestamp in milliseconds (defaults to Date.now()).
 * @returns Non-negative age in seconds.
 */
export function fixAge(fix: Fix, now = Date.now()): number {
  return Math.max(0, Math.floor((now - fix.timestamp) / 1000));
}

/**
 * Evaluates safety warning conditions for a location fix:
 * - Stale fix: >= 120 seconds old.
 * - Unknown accuracy: accuracy is missing or negative.
 * - Low accuracy: uncertainty exceeds 100 meters (~328 feet).
 * - Simulated location: fix is flagged as mock by the OS.
 *
 * @param fix The location fix to evaluate.
 * @param now Current epoch timestamp in milliseconds.
 * @returns Array of active warning strings.
 */
export function fixWarnings(fix: Fix, now = Date.now()): string[] {
  return [
    fixAge(fix, now) >= 120
      ? "STALE LOCATION — this fix is over 2 minutes old. It may no longer represent your position."
      : "",
    fix.accuracy == null || fix.accuracy < 0
      ? "Accuracy unknown — describe landmarks to 911."
      : fix.accuracy > 100
        ? "LOW ACCURACY — this position may be imprecise. Tell 911 the uncertainty."
        : "",
    fix.mocked
      ? "SIMULATED LOCATION — the device reports this position as mocked."
      : "",
  ].filter(Boolean);
}

/**
 * Assembles a comprehensive, copyable plain-text location summary including
 * datum (WGS84), elevation (in feet), accuracy (in feet), fix timestamp, age, and warnings.
 *
 * @param fix Location fix.
 * @param format Display format.
 * @param now Current epoch timestamp.
 * @returns Multi-line text block suitable for clipboard copy or sharing.
 */
export function locationText(
  fix: Fix,
  format: CoordinateFormat,
  now = Date.now(),
): string | null {
  const formatted = formatCoordinates(fix, format);
  if (!formatted) return null;
  return [
    `Location (${format}, WGS84): ${formatted.replace("\n", ", ")}`,
    ...(fix.altitude != null ? [`Elevation: ${Math.round(fix.altitude * 3.28084)} ft`] : []),
    `Accuracy: ${fix.accuracy != null && fix.accuracy >= 0 ? `±${Math.round(fix.accuracy * 3.28084)} ft` : "unknown"}`,
    `Fix recorded: ${new Date(fix.timestamp).toISOString()} (${fixAge(fix, now)} seconds old)`,
    ...fixWarnings(fix, now),
  ].join("\n");
}

/**
 * Calculates the exact magnetic declination (variation) for the current date and location
 * using the World Magnetic Model (WMM). Positive is East, negative is West.
 */
export function getMagneticDeclination(latitude: number, longitude: number): number | null {
  try {
    const geo = require("geomagnetism");
    const result = geo.model().point([latitude, longitude]);
    return result ? result.decl : null;
  } catch (error) {
    return null;
  }
}
