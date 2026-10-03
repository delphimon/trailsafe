/**
 * @file hypothermia.ts
 * @description Hypothermia & Wind Chill Index with Pacific Northwest "Cascade Concrete" wet cold calculations.
 *
 * Operational Principles:
 * 1. The Cascade Concrete Phenomenon: In the Pacific Northwest Cascades and Olympics, the vast majority
 *    of Search & Rescue hypothermia emergencies occur in wet, rainy conditions between 35°F and 50°F,
 *    not sub-zero blizzards.
 * 2. Water Thermal Conductivity: Water conducts heat away from the human body approximately 25 times
 *    faster than air. Saturated clothing (cotton or soaked fleece) dramatically accelerates convective and
 *    conductive core cooling.
 * 3. Wind Convection: Wind strips the thin insulating boundary layer of warm air near the skin. When combined
 *    with wet fabrics, core body temperature can drop to mild-to-moderate hypothermia in under 45–60 minutes.
 * 4. The "Umbles" Diagnostic Markers: Stumbles, Mumbles, Fumbles, and Grumbles represent the classic
 *    early field indicators of cerebral cooling before life-threatening shivering cessation occurs.
 */

export type MoistureCondition = "dry" | "damp" | "soaked";
export type HypothermiaRiskLevel = "low" | "moderate" | "high" | "critical";

export interface HypothermiaAssessment {
  airTempF: number;
  windMph: number;
  moisture: MoistureCondition;
  windChillF: number;
  riskLevel: HypothermiaRiskLevel;
  riskTitle: string;
  riskDescription: string;
  plainExplanation: string;
  isCascadeConcreteHazard: boolean;
  color: string;
}

export interface HypothermiaPrinciple {
  number: number;
  title: string;
  shortKicker: string;
  summary: string;
  explanation: string;
}

export const HYPOTHERMIA_TOOL_METADATA = {
  id: "tool:hypothermia",
  title: "Cold Exposure & Hypothermia Assessment",
  category: "medical" as const,
  owner: "Center for Adventure Leadership",
  sources: [
    "National Weather Service (NWS) Windchill Formula",
    "Wilderness Medical Society (WMS) Clinical Practice Guidelines for Out-of-Hospital Evaluation and Treatment of Accidental Hypothermia",
    "State of Alaska Cold Injuries Guidelines",
  ],
  contentVersion: "1.1.0",
  lastVerified: "2026-09-30",
  nextReview: "2027-09-30",
  authoritativeOrganization: "Center for Adventure Leadership",
  lastReviewed: "2026-09-30",
  reviewCategory: "medical" as const,
};

export const HYPOTHERMIA_CORE_PRINCIPLES: HypothermiaPrinciple[] = [
  {
    number: 1,
    title: "The Cascade Concrete Phenomenon",
    shortKicker: "35°F–50°F Trap",
    summary: "Most hypothermia rescues occur in wet 35°F–50°F rain, not sub-zero blizzards.",
    explanation:
      "In the Pacific Northwest Cascades and Olympics, the vast majority of Search & Rescue hypothermia emergencies occur in wet, rainy conditions between 35°F and 50°F, not sub-zero blizzards. Above-freezing temperatures trick hikers into underestimating exposure danger.",
  },
  {
    number: 2,
    title: "Water's 25x Thermal Conductivity",
    shortKicker: "25x Heat Loss",
    summary: "Water drains body heat 25 times faster than dry air.",
    explanation:
      "Water conducts heat away from the human body approximately 25 times faster than air. Saturated clothing (cotton denim, soaked fleece, or wet synthetics) acts as an aggressive thermal siphon, rapidly draining core body heat.",
  },
  {
    number: 3,
    title: "Wind Convection & Rapid Cooling",
    shortKicker: "Rapid Heat Loss",
    summary: "Wind strips your heat layer; cooling accelerates rapidly once movement stops.",
    explanation:
      "Wind continuously strips the thin insulating boundary layer of warm air trapped near the skin. When combined with wet fabrics, cooling accelerates rapidly once physical exertion stops.",
  },
  {
    number: 4,
    title: "The 'Umbles' Diagnostic Markers",
    shortKicker: "Spot It Early",
    summary: "Stumbles, Mumbles, Fumbles, Grumbles signal brain cooling.",
    explanation:
      "Stumbles (tripping/ataxia), Mumbles (slurred speech), Fumbles (inability to zip jackets or open food), and Grumbles (unusual apathy or irritability) represent the classic early field signs of brain cooling before life-threatening shivering cessation occurs.",
  },
];

export interface HypothermiaPreset {
  id: string;
  name: string;
  airTempF: number;
  windMph: number;
  moisture: MoistureCondition;
  description: string;
}

/**
 * Calculates standard National Weather Service (NWS) Wind Chill temperature in °F.
 * Formula: 35.74 + 0.6215*T - 35.75*(V^0.16) + 0.4275*T*(V^0.16)
 * Valid for T <= 50°F and V >= 3 mph. For wind < 3 mph or T > 50°F, wind chill equals air temp.
 *
 * @param tempF Air temperature in Fahrenheit
 * @param windMph Wind speed in miles per hour
 */
export function calculateWindChill(tempF: number, windMph: number): number {
  const t = Math.round(tempF);
  const v = Math.max(0, Math.round(windMph));

  if (t > 50 || v < 3) {
    return t;
  }

  const vPow = Math.pow(v, 0.16);
  const wc = 35.74 + 0.6215 * t - 35.75 * vPow + 0.4275 * t * vPow;
  return Math.round(wc);
}

/**
 * Assesses environmental cold exposure and wet-chill conditions according to temperature, wind, and clothing saturation.
 * Note: This models environmental exposure conditions, not clinical hypothermia diagnosis of a patient.
 *
 * @param airTempF Air temperature in Fahrenheit
 * @param windMph Wind speed in miles per hour
 * @param moisture Clothing wetness condition ("dry", "damp", "soaked")
 */
export function assessHypothermiaRisk(
  airTempF: number,
  windMph: number,
  moisture: MoistureCondition = "dry",
): HypothermiaAssessment {
  const windChillF = calculateWindChill(airTempF, windMph);

  // "Cascade Concrete" Hazard: 32°F–52°F with wet layers and substantial wind
  const isCascadeConcreteHazard =
    airTempF >= 32 &&
    airTempF <= 52 &&
    moisture === "soaked" &&
    windMph >= 12;

  let riskLevel: HypothermiaRiskLevel = "low";
  let riskTitle = "MILD / COOL EXPOSURE CONDITIONS";
  let riskDescription =
    "Standard cool weather. Normal hiking movement produces adequate body heat. Keep layers handy if stopping.";
  let color = "#2D6A4F"; // Forest green

  if (windChillF <= 15 || isCascadeConcreteHazard) {
    riskLevel = "critical";
    riskTitle = isCascadeConcreteHazard
      ? "EXTREME COLD EXPOSURE HAZARD ('CASCADE CONCRETE')"
      : "EXTREME FREEZING EXPOSURE HAZARD";
    riskDescription = isCascadeConcreteHazard
      ? "DANGEROUS PNW COMBINATION: Soaked clothing + wind strips body heat much faster than dry air. Rapid core cooling occurs once movement stops."
      : "EXTREME ENVIRONMENTAL HEAT LOSS: High wind chill and freezing temperatures accelerate core cooling. Requires immediate windproof shelter and insulation.";
    color = "#E4572E"; // Safety Orange / Critical Red
  } else if (
    windChillF <= 32 ||
    (moisture === "soaked" && airTempF <= 55) ||
    (moisture === "damp" && airTempF <= 42 && windMph >= 10)
  ) {
    riskLevel = "high";
    riskTitle = "RAPID HEAT LOSS CONDITIONS";
    riskDescription =
      "ELEVATED EXPOSURE HAZARD: Continuous shivering required to maintain heat. Wet clothing drains energy quickly without windproof shelter and high-calorie food.";
    color = "#D9531E"; // Orange
  } else if (windChillF <= 48 || moisture !== "dry") {
    riskLevel = "moderate";
    riskTitle = "MODERATE CHILL CONDITIONS";
    riskDescription =
      "ELEVATED EXPOSURE WHEN STOPPED: Body cools quickly during rest breaks or summit stops. Put on wind/rain shell before sweat chills. Watch partners for coordination changes.";
    color = "#C98A2C"; // Amber
  }

  const roundedTemp = Math.round(airTempF);
  const roundedWind = Math.max(0, Math.round(windMph));

  let plainExplanation = "";
  if (isCascadeConcreteHazard) {
    plainExplanation = `Air is ${roundedTemp}°F, but ${roundedWind} mph wind and soaked clothing chills your core rapidly. Saturated fabric drains body heat roughly 25x faster than dry air.`;
  } else if (windChillF <= 32) {
    plainExplanation = `Air is ${roundedTemp}°F, but ${roundedWind} mph wind creates a wind chill of ${windChillF}°F.`;
  } else if (windChillF <= 48 || moisture !== "dry") {
    plainExplanation = `Air is ${roundedTemp}°F with ${roundedWind} mph wind. Core stays warm while moving, but cools rapidly during rest stops.`;
  } else {
    plainExplanation = `Normal cool weather (${roundedTemp}°F). Active hiking produces enough warmth to maintain core temperature. Keep dry layers accessible.`;
  }

  return {
    airTempF,
    windMph,
    moisture,
    windChillF,
    riskLevel,
    riskTitle,
    riskDescription,
    plainExplanation,
    isCascadeConcreteHazard,
    color,
  };
}

/**
 * Observable field indicators of progressive hypothermia ("The Umbles").
 * Note: These are clinical observations to evaluate in a person; do not rely solely on thermometers or environmental formulas.
 */
export const HYPOTHERMIA_UMBLES_MARKERS = [
  {
    name: "Stumbles",
    system: "Gross Motor (Ataxia)",
    symptom: "Tripping, loss of trail footing, unsteady gait, lagging behind party.",
    severity: "Early / Mild signs (observable motor decline)",
  },
  {
    name: "Mumbles",
    system: "Speech & Cognition (Dysarthria)",
    symptom: "Slurred words, slow response to questions, difficulty counting backwards.",
    severity: "Mild to Moderate signs (speech & cognitive slowing)",
  },
  {
    name: "Fumbles",
    system: "Fine Motor Skills",
    symptom: "Unable to zip jackets, tie boot laces, operate headlamp switches, or open snack packs.",
    severity: "Moderate signs (loss of dexterity)",
  },
  {
    name: "Grumbles",
    system: "Behavior & Affect",
    symptom: "Uncharacteristic apathy, irritability, irrational withdrawal, stubborn refusal to add layers.",
    severity: "Moderate signs (personality & judgment changes)",
  },
];

/**
 * Critical warning regarding shivering cessation.
 */
export const SHIVERING_CESSATION_WARNING =
  "CRITICAL RED FLAG: If a cold, wet hiker STOPS shivering while still exposed, unrewarmed, and lethargic or confused, this indicates severe hypothermia and metabolic exhaustion. Shivering ceases as the body can no longer generate heat. Seek immediate SAR evacuation (call 911).";

/**
 * Search & Rescue and Wilderness First Responder field treatment protocols.
 */
export const HYPOTHERMIA_FIELD_STEPS = [
  {
    step: 1,
    title: "Stop & Shelter Immediately",
    text: "Halt travel immediately. Escape wind and precipitation behind trees, boulders, or inside a tent, tarp, or bothy bag.",
  },
  {
    step: 2,
    title: "Vapor Barrier / Hypo Burrito Wrap",
    text: "If dry replacement clothes exist, strip wet clothing. If NO dry clothes exist, keep wet layers on but seal subject in a waterproof vapor barrier (trash bags, space blanket) inside a dry sleeping bag and pad to halt evaporative cooling.",
  },
  {
    step: 3,
    title: "Insulate from Cold Ground",
    text: "Place sleeping pads, empty backpacks, or dense boughs beneath the subject. Ground conduction drains heat 3x faster than still air.",
  },
  {
    step: 4,
    title: "Warm Sweet Calories (Alert Only)",
    text: "Provide warm, highly sugary fluids (cocoa, tea with honey, cider) ONLY if the subject is fully conscious and swallowing easily. Shivering consumes enormous glycogen.",
  },
  {
    step: 5,
    title: "Handle Gently & Keep Horizontal",
    text: "Do NOT force a confused or non-shivering hypothermic subject to exercise. Rough jostling can force cold, acidotic blood into the heart, triggering fatal ventricular fibrillation.",
  },
];

/**
 * Verified Pacific Northwest weather scenarios.
 */
export const HYPOTHERMIA_PRESETS: HypothermiaPreset[] = [
  {
    id: "cascade-concrete",
    name: "Cascade Concrete Ridge",
    airTempF: 38,
    windMph: 25,
    moisture: "soaked",
    description: "Classic PNW hazard: 38°F driving rain with ridge wind. Rapid heat loss hazard when stationary.",
  },
  {
    id: "rainy-trail-slog",
    name: "Rainy Valley Trail Slog",
    airTempF: 45,
    windMph: 15,
    moisture: "soaked",
    description: "Cold steady rain in forest timber. Wet base layers rapidly cool hikers when resting.",
  },
  {
    id: "muir-snowfield",
    name: "Rainier Camp Muir Snowfield",
    airTempF: 28,
    windMph: 30,
    moisture: "damp",
    description: "Sub-freezing alpine gale with moist sweat-dampened summit clothes.",
  },
  {
    id: "olympic-rainforest",
    name: "Hoh Rainforest Drizzle",
    airTempF: 48,
    windMph: 10,
    moisture: "soaked",
    description: "Sustained canopy drip soaking jackets and cotton denim in moderate temperatures.",
  },
  {
    id: "crisp-alpine-ridge",
    name: "Crisp Alpine Ridge (Dry)",
    airTempF: 32,
    windMph: 15,
    moisture: "dry",
    description: "Freezing dry autumn day with wind. Manageable with standard windshell and fleece.",
  },
];
