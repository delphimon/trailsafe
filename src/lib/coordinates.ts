import proj4 from "proj4";

export type CoordinateFormat = "DD" | "DDM" | "UTM";
export type Fix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  mocked?: boolean;
};
export const FORMATS: { value: CoordinateFormat; label: string }[] = [
  { value: "DD", label: "Decimal degrees (DD)" },
  { value: "DDM", label: "Degrees & decimal minutes (DDM)" },
  { value: "UTM", label: "Universal Transverse Mercator (UTM)" },
];
export function validCoordinates(lat: number, lon: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}
function ddm(value: number, latitude: boolean) {
  // Round before splitting so 59.99995 minutes correctly carries into degrees.
  const thousandths = Math.round(Math.abs(value) * 60 * 1000);
  const degrees = Math.floor(thousandths / 60000);
  const minutes = ((thousandths % 60000) / 1000).toFixed(3).padStart(6, "0");
  return `${degrees}° ${minutes}′ ${latitude ? (value < 0 ? "S" : "N") : value < 0 ? "W" : "E"}`;
}
export function utmZone(lat: number, lon: number) {
  let zone = Math.min(60, Math.floor((lon + 180) / 6) + 1);
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  if (lat >= 72 && lat < 84 && lon >= 0 && lon < 42)
    zone = lon < 9 ? 31 : lon < 21 ? 33 : lon < 33 ? 35 : 37;
  return zone;
}
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
export function formatCoordinates(
  fix: Pick<Fix, "latitude" | "longitude">,
  format: CoordinateFormat,
) {
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
export function fixAge(fix: Fix, now = Date.now()) {
  return Math.max(0, Math.floor((now - fix.timestamp) / 1000));
}
export function fixWarnings(fix: Fix, now = Date.now()) {
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
export function locationText(
  fix: Fix,
  format: CoordinateFormat,
  now = Date.now(),
) {
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
