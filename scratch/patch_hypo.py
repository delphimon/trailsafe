import re

with open('src/lib/hypothermia.ts', 'r') as f:
    content = f.read()

# Update interface
content = content.replace('''
export interface HypothermiaAssessment {
  airTempF: number;
  windMph: number;
  moisture: MoistureCondition;
  windChillF: number;
  effectiveTempF: number;
  wetChillPenaltyF: number;
  riskLevel: HypothermiaRiskLevel;
  riskTitle: string;
  riskDescription: string;
  plainExplanation: string;
  timeToExhaustion: string;
  isCascadeConcreteHazard: boolean;
  color: string;
}''', '''
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
}''')

# Remove getWetChillPenalty function entirely
content = re.sub(r'\/\*\*\n \* Returns the effective thermal cooling penalty.*?\}', '', content, flags=re.DOTALL)

# Rewrite assessHypothermiaRisk
new_assess = """
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
  let riskTitle = "LOW HYPOTHERMIA HAZARD";
  let riskDescription =
    "Standard cool weather. Normal hiking movement produces adequate body heat. Keep layers handy if stopping.";
  let color = "#2D6A4F"; // Forest green

  if (windChillF <= 15 || isCascadeConcreteHazard) {
    riskLevel = "critical";
    riskTitle = isCascadeConcreteHazard
      ? "CRITICAL 'CASCADE CONCRETE' HAZARD"
      : "CRITICAL FREEZING EXPOSURE";
    riskDescription = isCascadeConcreteHazard
      ? "DEADLY PNW COMBINATION: Soaked clothing + wind strips body heat much faster than dry air. Mild-to-moderate hypothermia can incapacitate a hiker very quickly once movement stops."
      : "EXTREME CORE HEAT LOSS: Severe hypothermia and frostbite hazard. Shivering will rapidly deplete glycogen reserves without immediate waterproof wind shelter.";
    color = "#E4572E"; // Safety Orange / Critical Red
  } else if (
    windChillF <= 32 ||
    (moisture === "soaked" && airTempF <= 55) ||
    (moisture === "damp" && airTempF <= 42 && windMph >= 10)
  ) {
    riskLevel = "high";
    riskTitle = "HIGH HYPOTHERMIA RISK";
    riskDescription =
      "RAPID HEAT LOSS: Body must shiver continuously to balance heat loss. Wet clothing rapidly exhausts energy reserves without windproof shelter and high-calorie food.";
    color = "#D9531E"; // Orange
  } else if (windChillF <= 48 || moisture !== "dry") {
    riskLevel = "moderate";
    riskTitle = "MODERATE CHILL / MONITOR CLOSELY";
    riskDescription =
      "ELEVATED RISK WHEN STOPPED: Body cools quickly during breaks or summit stops. Put on wind/rain shell before sweat chills. Watch trail partners for early coordination loss.";
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
}"""

content = re.sub(r'export function assessHypothermiaRisk\(.*?color,\n  \};\n\}', new_assess.strip(), content, flags=re.DOTALL)

with open('src/lib/hypothermia.ts', 'w') as f:
    f.write(content)
