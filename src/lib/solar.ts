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
 * 3. 24-Hour Day/Night Continuity: Accurately differentiates daylight (between sunrise and
 *    forest dusk tonight) from nighttime (after forest dusk or before dawn). When daylight is
 *    active, it counts down to tonight's forest dusk ("headlamp needed in X hours"). When dark,
 *    it reports that artificial light is required now until the next morning's sunrise
 *    ("headlamp needed now until Xam").
 * 4. Sun-Compass Orientation: Provides real-time solar elevation and azimuth to allow hikers
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
  nextSunrise: Date | null;
  canopyMinutesLost: number;
  dayLengthMinutes: number;
  solarElevationDeg: number;
  solarAzimuthDeg: number;
  isDaylight: boolean;
  isTrailDaylight: boolean;
  headlampNeededNow: boolean;
  headlampStatusHeadline: string;
  headlampStatusSubtext: string;
  weatherDisclaimer: string;
  minutesUntilSunset: number | null;
  minutesUntilForestDusk: number | null;
  minutesUntilNextSunrise: number | null;
}

/**
 * Standard disclaimer noting that dusk calculations are clear-sky models.
 */
export const SOLAR_WEATHER_DISCLAIMER =
  "Estimates are based on a clear sky. Clouds or poor weather can make it darker even earlier.";

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

interface DaySolarEvents {
  solarNoon: Date | null;
  sunrise: Date | null;
  sunset: Date | null;
  civilDusk: Date | null;
  nauticalDusk: Date | null;
  forestDusk: Date | null;
  dayLengthMinutes: number;
}

/**
 * Calculates solar events for a specific calendar date at a given coordinate.
 */
function calculateDaySolarEvents(
  lat: number,
  lon: number,
  year: number,
  month: number,
  day: number,
  canopyMinutesLost: number,
): DaySolarEvents {
  // Approximate noon UTC for this local calendar day (each 15° lon is 1 hour from UTC)
  const approxNoonUTC =
    Date.UTC(year, month, day, 12, 0, 0) - (lon / 15) * 3600 * 1000;
  const jd = approxNoonUTC / 86400000 + 2440587.5;
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

  const exactNoonMs = approxNoonUTC - eqOfTime * 60 * 1000;

  const calcHourAngle = (zenithDeg: number): number | null => {
    const latRad = toRad(lat);
    const declRad = toRad(sunDeclin);
    const cosHA =
      (Math.cos(toRad(zenithDeg)) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));
    if (cosHA > 1 || cosHA < -1) return null;
    return toDeg(Math.acos(cosHA));
  };

  const haSun = calcHourAngle(90.8333);
  const haCivil = calcHourAngle(96.0);
  const haNautical = calcHourAngle(102.0);

  const solarNoon = new Date(exactNoonMs);
  const sunrise =
    haSun !== null ? new Date(exactNoonMs - haSun * 4 * 60 * 1000) : null;
  const sunset =
    haSun !== null ? new Date(exactNoonMs + haSun * 4 * 60 * 1000) : null;
  const civilDusk =
    haCivil !== null ? new Date(exactNoonMs + haCivil * 4 * 60 * 1000) : null;
  const nauticalDusk =
    haNautical !== null
      ? new Date(exactNoonMs + haNautical * 4 * 60 * 1000)
      : null;

  const forestDusk = civilDusk
    ? new Date(civilDusk.getTime() - canopyMinutesLost * 60 * 1000)
    : null;

  const dayLengthMinutes =
    sunrise && sunset
      ? Math.round((sunset.getTime() - sunrise.getTime()) / 60000)
      : 0;

  return {
    solarNoon,
    sunrise,
    sunset,
    civilDusk,
    nauticalDusk,
    forestDusk,
    dayLengthMinutes,
  };
}

/**
 * Format a Date to a clean 12-hour time string (e.g. "6:45 AM" or "7:16 PM").
 */
function formatTimeString(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Computes exact solar times, 24-hour day/night status, and canopy-adjusted forest dusk.
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
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error(
      `Invalid coordinates for solar calculation: lat ${lat}, lon ${lon}`,
    );
  }

  const canopyMinutesLost = getCanopyOffsetMinutes(canopy);

  // Determine the local solar calendar date at this longitude
  // Each 15° of longitude corresponds to 1 hour offset from UTC
  const localTimeMs = date.getTime() + (lon / 15) * 3600 * 1000;
  const localDate = new Date(localTimeMs);
  const year = localDate.getUTCFullYear();
  const month = localDate.getUTCMonth();
  const day = localDate.getUTCDate();

  // Compute solar events for today and tomorrow
  const today = calculateDaySolarEvents(
    lat,
    lon,
    year,
    month,
    day,
    canopyMinutesLost,
  );
  const tomorrow = calculateDaySolarEvents(
    lat,
    lon,
    year,
    month,
    day + 1,
    canopyMinutesLost,
  );

  // Instantaneous solar position (azimuth & elevation) at the reference timestamp
  const jdNow = date.getTime() / 86400000 + 2440587.5;
  const jcNow = (jdNow - 2451545.0) / 36525.0;
  const geomMeanLongSun =
    (280.46646 + jcNow * (36000.76983 + jcNow * 0.0003032)) % 360;
  const geomMeanAnomSun =
    357.52911 + jcNow * (35999.05029 - 0.0001537 * jcNow);
  const eccentEarthOrbit =
    0.016708634 - jcNow * (0.000042037 + 0.0000001267 * jcNow);
  const sunEqOfCenter =
    Math.sin(toRad(geomMeanAnomSun)) *
      (1.914602 - jcNow * (0.004817 + 0.000014 * jcNow)) +
    Math.sin(toRad(2 * geomMeanAnomSun)) *
      (0.019993 - 0.000101 * jcNow) +
    Math.sin(toRad(3 * geomMeanAnomSun)) * 0.000289;
  const sunTrueLong = geomMeanLongSun + sunEqOfCenter;
  const sunAppLong =
    sunTrueLong - 0.00569 - 0.00478 * Math.sin(toRad(125.04 - 1934.136 * jcNow));
  const meanObliqEcliptic =
    23 +
    (26 +
      (21.448 -
        jcNow * (46.815 + jcNow * (0.00059 - jcNow * 0.001813)))) /
      60 /
      60;
  const obliqCorr =
    meanObliqEcliptic +
    0.00256 * Math.cos(toRad(125.04 - 1934.136 * jcNow));
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

  // --------------------------------------------------------------------------
  // 24-Hour Day / Night Headlamp Logic
  // --------------------------------------------------------------------------
  const nowMs = date.getTime();
  const todaySunriseMs = today.sunrise?.getTime() ?? 0;
  const todayForestDuskMs = today.forestDusk?.getTime() ?? 0;

  let isTrailDaylight = false;
  let headlampNeededNow = false;
  let nextSunrise: Date | null = null;
  let minutesUntilSunset: number | null = null;
  let minutesUntilForestDusk: number | null = null;
  let minutesUntilNextSunrise: number | null = null;
  let headlampStatusHeadline = "";
  let headlampStatusSubtext = "";

  if (today.sunrise && nowMs < todaySunriseMs) {
    // 1. Pre-dawn night (e.g. 4:00 AM)
    headlampNeededNow = true;
    isTrailDaylight = false;
    nextSunrise = today.sunrise;
    minutesUntilNextSunrise = Math.max(
      0,
      Math.round((todaySunriseMs - nowMs) / 60000),
    );
    const riseStr = formatTimeString(today.sunrise);
    headlampStatusHeadline = `Headlamp needed now until ${riseStr}`;
    headlampStatusSubtext = `Natural light returns at ${riseStr} (in ${formatDurationMinutes(minutesUntilNextSunrise)})`;
  } else if (today.forestDusk && nowMs < todayForestDuskMs) {
    // 2. Daytime between sunrise and forest dusk (e.g. 10:00 AM, 5:30 PM)
    headlampNeededNow = false;
    isTrailDaylight = true;
    minutesUntilForestDusk = Math.max(
      0,
      Math.round((todayForestDuskMs - nowMs) / 60000),
    );
    if (today.sunset) {
      minutesUntilSunset = Math.max(
        0,
        Math.round((today.sunset.getTime() - nowMs) / 60000),
      );
    }
    const duskStr = formatTimeString(today.forestDusk);
    headlampStatusHeadline = `Headlamp needed in ${formatDurationMinutes(minutesUntilForestDusk)}`;
    headlampStatusSubtext = `Headlamp required at ${duskStr} (Forest Dusk tonight)`;
  } else {
    // 3. Evening/night after forest dusk (e.g. 7:30 PM, 9:00 PM)
    headlampNeededNow = true;
    isTrailDaylight = false;
    nextSunrise = tomorrow.sunrise;
    const tomorrowSunriseMs =
      tomorrow.sunrise?.getTime() ?? nowMs + 8 * 3600000;
    minutesUntilNextSunrise = Math.max(
      0,
      Math.round((tomorrowSunriseMs - nowMs) / 60000),
    );
    const riseStr = tomorrow.sunrise
      ? formatTimeString(tomorrow.sunrise)
      : "morning";
    headlampStatusHeadline = `Headlamp needed now until ${riseStr}`;
    headlampStatusSubtext = `Natural light returns at ${riseStr} (in ${formatDurationMinutes(minutesUntilNextSunrise)})`;
  }

  return {
    sunrise: today.sunrise,
    solarNoon: today.solarNoon,
    sunset: today.sunset,
    civilDusk: today.civilDusk,
    nauticalDusk: today.nauticalDusk,
    forestDusk: today.forestDusk,
    nextSunrise,
    canopyMinutesLost,
    dayLengthMinutes: today.dayLengthMinutes,
    solarElevationDeg,
    solarAzimuthDeg,
    isDaylight,
    isTrailDaylight,
    headlampNeededNow,
    headlampStatusHeadline,
    headlampStatusSubtext,
    weatherDisclaimer: SOLAR_WEATHER_DISCLAIMER,
    minutesUntilSunset,
    minutesUntilForestDusk,
    minutesUntilNextSunrise,
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
