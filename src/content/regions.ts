import library from "./library.json";
/** Bundled regional data. Add regions here without a backend or a new calculation engine. */
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

export const WASHINGTON_REGION = {
  id: "wa",
  name: "Washington and nearby PNW",
  timeZone: "America/Los_Angeles",
  trailheads: PNW_TRAILHEAD_PRESETS,
  resources: library.RESOURCES,
  emergencyNumber: "911",
  sarCostNote:
    "In Washington State, search-and-rescue response does not bill rescued persons.",
};
