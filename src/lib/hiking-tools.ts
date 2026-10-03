/**
 * @file hiking-tools.ts
 * @description Backcountry utilities: Naismith's rule hiking time, avalanche slope risk, and water purification timers.
 *
 * Operational Principles:
 * 1. Terrain & Elevation Reality: Naismith's Rule with Langmuir's mountain corrections calculates
 *    realistic travel times in the Pacific Northwest's steep topography to prevent overdue callouts.
 * 2. Avalanche Terrain Hazard: Slopes between 30° and 45° represent the primary avalanche starting zones
 *    responsible for over 90% of recreationist slab avalanche fatalities.
 * 3. Water Temperature Kinetics: Chemical halogen and chlorine dioxide disinfection kinetics slow
 *    substantially in cold glacial snowmelt; contact times must be extended to neutralize Cryptosporidium.
 */

export type PaceLevel = "casual" | "moderate" | "fast";
export type PackWeight = "light" | "overnight" | "heavy";
export type BreakStyle = "none" | "standard" | "long";

export interface HikingEstimate {
  totalMinutes: number;
  flatHours: number;
  ascentMinutes: number;
  descentMinutes: number;
  breaksMinutes: number;
  formattedDuration: string;
}

/**
 * Calculates estimated hiking time using Naismith's Rule with Langmuir corrections.
 *
 * @param distanceMiles Trail distance in miles
 * @param elevationGainFeet Cumulative elevation gain in feet
 * @param elevationLossFeet Cumulative elevation loss in feet
 * @param pace Pace level ("casual", "moderate", "fast")
 * @param pack Pack weight category ("light", "overnight", "heavy")
 * @param breaks Break style ("none", "standard", "long")
 */
export function calculateHikingTime(
  distanceMiles: number,
  elevationGainFeet: number,
  elevationLossFeet: number = 0,
  pace: PaceLevel = "casual",
  pack: PackWeight = "light",
  breaks: BreakStyle = "standard",
): HikingEstimate {
  if (distanceMiles <= 0) {
    return {
      totalMinutes: 0,
      flatHours: 0,
      ascentMinutes: 0,
      descentMinutes: 0,
      breaksMinutes: 0,
      formattedDuration: "0m",
    };
  }

  // Base flat walking speed (mph)
  let baseMph = 2.5; // Adjusted to be more realistic for moderate
  if (pace === "casual") baseMph = 1.8; // Reduced to be realistic for casual
  if (pace === "fast") baseMph = 3.2;

  // Pack weight multiplier
  let packMultiplier = 1.0;
  if (pack === "overnight") packMultiplier = 1.15;
  if (pack === "heavy") packMultiplier = 1.25;

  const flatHours = distanceMiles / baseMph;
  const flatMinutes = flatHours * 60 * packMultiplier;

  // Langmuir ascent correction: +30 minutes per 1,000 feet gained
  const ascentMinutes = Math.max(0, (elevationGainFeet / 1000) * 30 * packMultiplier);

  // Langmuir steep descent correction: +10 minutes per 1,000 feet descent for joint stress / loose trail
  const descentMinutes = Math.max(0, (elevationLossFeet / 1000) * 10 * packMultiplier);

  const movingMinutes = flatMinutes + ascentMinutes + descentMinutes;
  
  // Calculate breaks based on moving time
  let breaksMinutes = 0;
  if (breaks === "standard") {
    // 10 minutes of breaks per hour of moving time
    breaksMinutes = (movingMinutes / 60) * 10;
  } else if (breaks === "long") {
    // 15 minutes of breaks per hour of moving time, plus a 30 minute lunch
    breaksMinutes = ((movingMinutes / 60) * 15) + (movingMinutes > 180 ? 30 : 0);
  }

  const totalMinutes = Math.round(movingMinutes + breaksMinutes);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const formattedDuration = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return {
    totalMinutes,
    flatHours: Math.round(flatHours * 10) / 10,
    ascentMinutes: Math.round(ascentMinutes),
    descentMinutes: Math.round(descentMinutes),
    breaksMinutes: Math.round(breaksMinutes),
    formattedDuration,
  };
}

export const HIKING_TIME_METADATA = {
  id: "tool:hiking-time",
  title: "Naismith's Rule Mountain Travel Estimator",
  category: "general-outdoor" as const,
  owner: "Center for Adventure Leadership",
  sources: [
    "Naismith's Rule (Scottish Mountaineering Club)",
    "Langmuir Mountain Corrections (1984)",
  ],
  contentVersion: "1.1.0",
  lastVerified: "2026-09-30",
  nextReview: "2027-09-30",
  authoritativeOrganization: "Center for Adventure Leadership",
  lastReviewed: "2026-09-30",
  reviewCategory: "outdoor" as const,
};

export const AVALANCHE_SLOPE_METADATA = {
  id: "tool:avalanche-slope",
  title: "Slope Angle Inclinometer & Start Zone Indicator",
  category: "sar-operational" as const,
  owner: "Center for Adventure Leadership",
  sources: [
    "Northwest Avalanche Center (NWAC)",
    "Avalanche Canada",
    "American Institute for Avalanche Research and Education (AIARE)",
  ],
  contentVersion: "1.1.0",
  lastVerified: "2026-09-30",
  nextReview: "2027-09-30",
  authoritativeOrganization: "Center for Adventure Leadership",
  lastReviewed: "2026-09-30",
  reviewCategory: "sar" as const,
};

export const WATER_TREATMENT_METADATA = {
  id: "tool:water-treatment",
  title: "Wilderness Water Disinfection Protocols",
  category: "medical" as const,
  owner: "Center for Adventure Leadership",
  sources: [
    "Centers for Disease Control and Prevention (CDC) - Making Water Safe in the Backcountry",
    "World Health Organization (WHO) Guidelines for Drinking-water Quality",
    "Product Manufacturer Instructions (Aquamira, Potable Aqua, SteriPEN)",
  ],
  contentVersion: "1.1.0",
  lastVerified: "2026-09-30",
  nextReview: "2027-09-30",
  authoritativeOrganization: "Center for Adventure Leadership",
  lastReviewed: "2026-09-30",
  reviewCategory: "medical" as const,
};

export interface SlopeRisk {
  degrees: number;
  level: "low" | "prime" | "extreme";
  title: string;
  description: string;
  color: string;
}

/**
 * Categorizes a measured slope angle according to objective avalanche start-zone characteristics.
 * Slope angle alone does not determine avalanche danger: snowpack, recent weather, aspect,
 * and connected overhead terrain are critical.
 *
 * @param degrees Slope angle in degrees (0 to 90)
 */
export function getSlopeAvalancheRisk(degrees: number): SlopeRisk {
  const angle = Math.max(0, Math.min(90, Math.round(degrees)));

  if (angle < 30) {
    return {
      degrees: angle,
      level: "low",
      title: "Below Prime Start Zone (<30°)",
      description:
        "Slab avalanches rarely initiate on slopes under 30°. WARNING: You can still be hit by avalanches starting from steeper connected terrain above you or caught in runout zones. Check local avalanche forecasts (e.g. NWAC).",
      color: "#5C6A64", // Neutral slate
    };
  }

  if (angle <= 45) {
    return {
      degrees: angle,
      level: "prime",
      title: "Prime Slab Start Zone (30°–45°)",
      description:
        "Over 90% of human-triggered slab avalanches originate on 30°–45° slopes (peak danger 36°–40°). If snowpack is unstable, this incline can release. Check local avalanche forecasts (e.g. NWAC).",
      color: "#D9534F", // Red/Warning
    };
  }

  return {
    degrees: angle,
    level: "extreme",
    title: "Steep Terrain (>45°)",
    description:
      "Slopes over 45° frequently shed snow as sluffs, preventing deep slab buildup, but loose snow or wind-slab avalanches still occur. Check local avalanche forecasts (e.g. NWAC).",
    color: "#C68228", // Orange/Caution
  };
}

export interface WaterTreatmentPreset {
  id: string;
  name: string;
  type: "chemical" | "boil" | "uv";
  durationSeconds: number;
  waterCondition: string;
  instructions: string;
}

export const WATER_TREATMENT_PRESETS: WaterTreatmentPreset[] = [
  {
    id: "aquamira-cold",
    name: "Aquamira Chlorine Dioxide (Cold Water Label)",
    type: "chemical",
    durationSeconds: 1800, // 30 minutes
    waterCondition: "Water <50°F (Snowmelt / Glacial Runoff)",
    instructions:
      "Per product label: Mix Part A & B in cap for 5 min until yellow. Add to water. Wait 30 min (4 hrs if Cryptosporidium suspected in cold water).",
  },
  {
    id: "aquamira-warm",
    name: "Aquamira Chlorine Dioxide (Warm Water Label)",
    type: "chemical",
    durationSeconds: 900, // 15 minutes
    waterCondition: "Water >60°F (Summer Lake / Stream)",
    instructions:
      "Per product label: Mix Part A & B for 5 min. Add to water. Wait 15 min for Giardia and bacteria in warm water.",
  },
  {
    id: "iodine",
    name: "Potable Aqua Iodine Tablets (Product Label)",
    type: "chemical",
    durationSeconds: 1800, // 30 minutes
    waterCondition: "Clear Water (Warm to Moderate)",
    instructions:
      "Per product label: Add 2 tablets per quart. Cap loosely and shake. Slosh threads. Wait 30 minutes before drinking. (Ineffective against Cryptosporidium).",
  },
  {
    id: "boil-standard",
    name: "Rolling Boil (<6,500 ft, CDC Guideline)",
    type: "boil",
    durationSeconds: 60, // 1 minute
    waterCondition: "Low to Moderate Elevation",
    instructions:
      "Per CDC guidelines: Bring water to a vigorous, rolling boil for 1 full minute. Kills all pathogens (viruses, bacteria, protozoa).",
  },
  {
    id: "boil-high",
    name: "Rolling Boil (>6,500 ft, CDC Guideline)",
    type: "boil",
    durationSeconds: 180, // 3 minutes
    waterCondition: "High Elevation (Passes / Glaciers)",
    instructions:
      "Per CDC guidelines: At high altitude, water boils at lower temperatures. Maintain full rolling boil for 3 full minutes.",
  },
  {
    id: "steripen",
    name: "SteriPEN UV Purifier (Clear Water Product Label)",
    type: "uv",
    durationSeconds: 90, // 90 seconds
    waterCondition: "Clear Water Only (Filter Turbidity First)",
    instructions:
      "Per manufacturer label: Submerge optical sensors in clear water. Stir continuously until the green indicator signals completion.",
  },
];
