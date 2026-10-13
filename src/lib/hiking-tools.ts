/** Rough walking-time estimates; terrain, weather and individual pace can vary substantially. */
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
 * Calculates estimated hiking time using distance, ascent, descent, pack and break allowances.
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

  // Ascent allowance: +30 minutes per 1,000 feet gained
  const ascentMinutes = Math.max(
    0,
    (elevationGainFeet / 1000) * 30 * packMultiplier,
  );

  // Descent allowance: +10 minutes per 1,000 feet descent for joint stress / loose trail
  const descentMinutes = Math.max(
    0,
    (elevationLossFeet / 1000) * 10 * packMultiplier,
  );

  const movingMinutes = flatMinutes + ascentMinutes + descentMinutes;

  // Calculate breaks based on moving time
  let breaksMinutes = 0;
  if (breaks === "standard") {
    // 10 minutes of breaks per hour of moving time
    breaksMinutes = (movingMinutes / 60) * 10;
  } else if (breaks === "long") {
    // 15 minutes of breaks per hour of moving time, plus a 30 minute lunch
    breaksMinutes = (movingMinutes / 60) * 15 + (movingMinutes > 180 ? 30 : 0);
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
