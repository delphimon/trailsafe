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

export interface SlopeRisk {
  degrees: number;
  level: "low" | "prime" | "extreme";
  title: string;
  description: string;
  color: string;
}

/**
 * Categorizes a slope angle according to avalanche slab formation risk.
 *
 * @param degrees Slope angle in degrees (0 to 90)
 */
export function getSlopeAvalancheRisk(degrees: number): SlopeRisk {
  const angle = Math.max(0, Math.min(90, Math.round(degrees)));

  if (angle < 30) {
    return {
      degrees: angle,
      level: "low",
      title: "Low Slab Hazard (<30°)",
      description:
        "Slab avalanches rarely initiate under 30°. Watch for steep slopes or overhead cornices directly above you.",
      color: "#2D6A4F", // Green
    };
  }

  if (angle <= 45) {
    return {
      degrees: angle,
      level: "prime",
      title: "PRIME AVALANCHE ZONE (30°–45°)",
      description:
        "CRITICAL: Over 90% of human-triggered slab avalanches occur on 30°–45° slopes. 37°–39° is the statistical peak of danger.",
      color: "#E4572E", // Danger orange/red
    };
  }

  return {
    degrees: angle,
    level: "extreme",
    title: "Extreme / Sluff Zone (>45°)",
    description:
      "Slopes steeper than 45° sluff snow frequently. Primary hazards are falling, rockfall, and triggering slides onto lower angles.",
    color: "#C98A2C", // Amber
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
    name: "Chlorine Dioxide (Cold / Glacial)",
    type: "chemical",
    durationSeconds: 1800, // 30 minutes
    waterCondition: "Water <50°F (Snowmelt / Glacial Runoff)",
    instructions:
      "Mix Part A & B in cap for 5 min until yellow. Add to water. Wait 30 min (4 hrs if Cryptosporidium suspected in icy water).",
  },
  {
    id: "aquamira-warm",
    name: "Chlorine Dioxide (Warm / Lake)",
    type: "chemical",
    durationSeconds: 900, // 15 minutes
    waterCondition: "Water >60°F (Summer Lake / Stream)",
    instructions:
      "Mix Part A & B for 5 min. Add to water. Wait 15 min for Giardia and bacteria.",
  },
  {
    id: "iodine",
    name: "Iodine Tablets (Potable Aqua)",
    type: "chemical",
    durationSeconds: 1800, // 30 minutes
    waterCondition: "Clear Water (Warm to Moderate)",
    instructions:
      "Add 2 tablets per quart. Cap loosely and shake. Slosh threads. Wait 30 minutes before drinking.",
  },
  {
    id: "boil-standard",
    name: "Rolling Boil (<6,500 ft)",
    type: "boil",
    durationSeconds: 60, // 1 minute
    waterCondition: "Low to Moderate Elevation",
    instructions:
      "Bring water to a vigorous, rolling boil for 1 full minute. Kills all pathogens (viruses, bacteria, protozoa).",
  },
  {
    id: "boil-high",
    name: "Rolling Boil (>6,500 ft)",
    type: "boil",
    durationSeconds: 180, // 3 minutes
    waterCondition: "High Elevation (Muir / Passes)",
    instructions:
      "At high altitude, water boils at lower temperatures. Maintain full rolling boil for 3 full minutes.",
  },
  {
    id: "steripen",
    name: "SteriPEN UV Purifier (1 Liter)",
    type: "uv",
    durationSeconds: 90, // 90 seconds
    waterCondition: "Clear Water Only (Filter Turbidity First)",
    instructions:
      "Submerge optical sensors. Stir continuously until the green indicator signals completion.",
  },
];
