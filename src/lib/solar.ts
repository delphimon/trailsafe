/**
 * @file solar.ts
 * @description Offline astronomical solar calculation engine for wilderness navigation.
 *
 * Operational Principles:
 * 1. 100% Offline: Calculates sunrise, solar noon, sunset, civil twilight, and forest dusk
 *    entirely through standard NOAA astronomical ephemeris equations without network calls.
 * 2. PNW "Forest Dusk" Factor: In the Pacific Northwest's dense coniferous canopy (Douglas fir,
 *    hemlock, cedar) and steep glaciated U-valleys, usable trail light cuts out 45–75 minutes
 *    earlier than open-sky civil twilight. This module provides a canopy penalty factor to
 *    prevent hikers from being caught without headlamps.
 * 3. Sun-Compass Orientation: Provides real-time solar elevation and azimuth to allow hikers
 *    to verify compass headings against the sun's position.
 */

export type CanopyType = "open" | "moderate" | "dense";

export interface TrailheadPreset {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
}

export const PNW_TRAILHEAD_PRESETS: TrailheadPreset[] = [
  {
    id: "snoqualmie",
    name: "Snoqualmie Pass",
    region: "I-90 Corridor",
    latitude: 47.425,
    longitude: -121.414,
  },
  {
    id: "rainier-paradise",
    name: "Mount Rainier (Paradise)",
    region: "South Cascades",
    latitude: 46.786,
    longitude: -121.735,
  },
  {
    id: "north-cascades",
    name: "North Cascades (Mt. Baker)",
    region: "North Cascades",
    latitude: 48.857,
    longitude: -121.666,
  },
  {
    id: "olympic-hoh",
    name: "Hoh Rain Forest",
    region: "Olympic Peninsula",
    latitude: 47.86,
    longitude: -123.935,
  },
  {
    id: "leavenworth",
    name: "Leavenworth / Enchantments",
    region: "Central Cascades",
    latitude: 47.596,
    longitude: -120.661,
  },
  {
    id: "columbia-gorge",
    name: "Columbia River Gorge",
    region: "SW Washington / Oregon",
    latitude: 45.698,
    longitude: -121.89,
  },
];

export interface SolarTimes {
  sunrise: Date | null;
  solarNoon: Date | null;
  sunset: Date | null;
  civilDusk: Date | null;
  nauticalDusk: Date | null;
  forestDusk: Date | null;
  canopyMinutesLost: number;
  dayLengthMinutes: number;
  solarElevationDeg: number;
  solarAzimuthDeg: number;
  isDaylight: boolean;
  minutesUntilSunset: number | null;
  minutesUntilForestDusk: number | null;
}

/**
 * Returns canopy loss offset in minutes.
 * - open: 0 min (alpine ridges, open lakeshores)
 * - moderate: 30 min (mixed secondary forest, broad valleys)
 * - dense: 60 min (old-growth rainforest, deep timber canyons)
 */
export function getCanopyOffsetMinutes(canopy: CanopyType): number {
  switch (canopy) {
    case "open":
      return 0;
    case "moderate":
      return 30;
    case "dense":
      return 60;
  }
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Computes exact solar times and canopy-adjusted forest dusk for a coordinate and date.
 *
 * @param lat Latitude in decimal degrees (positive North)
 * @param lon Longitude in decimal degrees (positive East, negative West)
 * @param date Reference date/time (defaults to current system time)
 * @param canopy Canopy classification ("open", "moderate", "dense")
 */
export function calculateSolarTimes(
  lat: number,
  lon: number,
  date: Date = new Date(),
  canopy: CanopyType = "moderate",
): SolarTimes {
  // Validate coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error(`Invalid coordinates for solar calculation: lat ${lat}, lon ${lon}`);
  }

  const jd = date.getTime() / 86400000 + 2440587.5;
  const jc = (jd - 2451545.0) / 36525.0;

  const geomMeanLongSun =
    (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
  const geomMeanAnomSun =
    357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const eccentEarthOrbit =
    0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);

  const sunEqOfCenter =
    Math.sin(toRad(geomMeanAnomSun)) *
      (1.914602 - jc * (0.004817 + 0.000014 * jc)) +
    Math.sin(toRad(2 * geomMeanAnomSun)) *
      (0.019993 - 0.000101 * jc) +
    Math.sin(toRad(3 * geomMeanAnomSun)) * 0.000289;

  const sunTrueLong = geomMeanLongSun + sunEqOfCenter;
  const sunAppLong =
    sunTrueLong - 0.00569 - 0.00478 * Math.sin(toRad(125.04 - 1934.136 * jc));

  const meanObliqEcliptic =
    23 +
    (26 +
      (21.448 -
        jc * (46.815 + jc * (0.00059 - jc * 0.001813)))) /
      60 /
      60;
  const obliqCorr =
    meanObliqEcliptic +
    0.00256 * Math.cos(toRad(125.04 - 1934.136 * jc));

  const sunDeclin = toDeg(
    Math.asin(Math.sin(toRad(obliqCorr)) * Math.sin(toRad(sunAppLong))),
  );

  const varY = Math.tan(toRad(obliqCorr / 2)) * Math.tan(toRad(obliqCorr / 2));
  const eqOfTime =
    4 *
    toDeg(
      varY * Math.sin(2 * toRad(geomMeanLongSun)) -
        2 * eccentEarthOrbit * Math.sin(toRad(geomMeanAnomSun)) +
        4 *
          eccentEarthOrbit *
          varY *
          Math.sin(toRad(geomMeanAnomSun)) *
          Math.cos(2 * toRad(geomMeanLongSun)) -
        0.5 * varY * varY * Math.sin(4 * toRad(geomMeanLongSun)) -
        1.25 *
          eccentEarthOrbit *
          eccentEarthOrbit *
          Math.sin(2 * toRad(geomMeanAnomSun)),
    );

  const solarNoonUTCMin = 720 - 4 * lon - eqOfTime;

  // Helper for zenith hour angle
  const calcHourAngle = (zenithDeg: number): number | null => {
    const latRad = toRad(lat);
    const declRad = toRad(sunDeclin);
    const cosHA =
      (Math.cos(toRad(zenithDeg)) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));
    if (cosHA > 1 || cosHA < -1) return null; // Polar day or night
    return toDeg(Math.acos(cosHA));
  };

  // Standard zeniths:
  // 90.8333°: Official sunrise/sunset (sun's upper limb touches horizon + refraction)
  // 96°: Civil twilight (loss of ordinary outdoor vision)
  // 102°: Nautical twilight (horizon lost at sea)
  const haSun = calcHourAngle(90.8333);
  const haCivil = calcHourAngle(96.0);
  const haNautical = calcHourAngle(102.0);

  const startOfDayUTC = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );

  const solarNoon = new Date(startOfDayUTC + solarNoonUTCMin * 60000);
  const sunrise =
    haSun !== null
      ? new Date(startOfDayUTC + (solarNoonUTCMin - 4 * haSun) * 60000)
      : null;
  const sunset =
    haSun !== null
      ? new Date(startOfDayUTC + (solarNoonUTCMin + 4 * haSun) * 60000)
      : null;
  const civilDusk =
    haCivil !== null
      ? new Date(startOfDayUTC + (solarNoonUTCMin + 4 * haCivil) * 60000)
      : null;
  const nauticalDusk =
    haNautical !== null
      ? new Date(startOfDayUTC + (solarNoonUTCMin + 4 * haNautical) * 60000)
      : null;

  const canopyMinutesLost = getCanopyOffsetMinutes(canopy);
  const forestDusk = civilDusk
    ? new Date(civilDusk.getTime() - canopyMinutesLost * 60000)
    : null;

  const dayLengthMinutes =
    sunrise && sunset
      ? Math.round((sunset.getTime() - sunrise.getTime()) / 60000)
      : 0;

  // Calculate current solar elevation & azimuth
  const currentMinutesUTC =
    date.getUTCHours() * 60 +
    date.getUTCMinutes() +
    date.getUTCSeconds() / 60 +
    date.getUTCMilliseconds() / 60000;
  const trueSolarTimeMin = (currentMinutesUTC + 4 * lon + eqOfTime) % 1440;
  const hourAngleDeg =
    trueSolarTimeMin / 4 < 0
      ? trueSolarTimeMin / 4 + 180
      : trueSolarTimeMin / 4 - 180;

  const latRad = toRad(lat);
  const declRad = toRad(sunDeclin);
  const haRad = toRad(hourAngleDeg);

  const csz =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad);
  const clampedCsz = Math.max(-1, Math.min(1, csz));
  const zenithRad = Math.acos(clampedCsz);
  const solarElevationDeg = Math.round((90 - toDeg(zenithRad)) * 10) / 10;

  // Azimuth calculation
  let solarAzimuthDeg = 0;
  if (zenithRad > 0 && zenithRad < Math.PI) {
    const azRad =
      (Math.sin(latRad) * Math.cos(zenithRad) - Math.sin(declRad)) /
      (Math.cos(latRad) * Math.sin(zenithRad));
    const clampedAz = Math.max(-1, Math.min(1, azRad));
    const rawAz = toDeg(Math.acos(clampedAz));
    solarAzimuthDeg =
      hourAngleDeg > 0 ? (rawAz + 180) % 360 : (540 - rawAz) % 360;
  }
  solarAzimuthDeg = Math.round(solarAzimuthDeg);

  const isDaylight = solarElevationDeg > -0.833;

  const nowMs = date.getTime();
  const minutesUntilSunset = sunset
    ? Math.round((sunset.getTime() - nowMs) / 60000)
    : null;
  const minutesUntilForestDusk = forestDusk
    ? Math.round((forestDusk.getTime() - nowMs) / 60000)
    : null;

  return {
    sunrise,
    solarNoon,
    sunset,
    civilDusk,
    nauticalDusk,
    forestDusk,
    canopyMinutesLost,
    dayLengthMinutes,
    solarElevationDeg,
    solarAzimuthDeg,
    isDaylight,
    minutesUntilSunset,
    minutesUntilForestDusk,
  };
}

/**
 * Formats a duration in minutes into a human-friendly string (e.g., "2h 15m" or "45m").
 */
export function formatDurationMinutes(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
