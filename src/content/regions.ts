import library from "./library.json";

/** Bundled regional data. Add regions here without a backend or a new calculation engine. */
export interface TrailheadPreset {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export interface RegionResource {
  name: string;
  url: string;
  note: string;
  cat: string;
}

export interface RegionConfig {
  id: string;
  name: string;
  timeZone: string;
  trailheads: TrailheadPreset[];
  resources: RegionResource[];
  emergencyNumber: string;
  sarCostNote: string;
}

export const US_TIME_ZONES = [
  { id: "America/Los_Angeles", label: "Pacific" },
  { id: "America/Denver", label: "Mountain" },
  { id: "America/Phoenix", label: "Arizona (no DST)" },
  { id: "America/Chicago", label: "Central" },
  { id: "America/New_York", label: "Eastern" },
  { id: "America/Anchorage", label: "Alaska" },
  { id: "Pacific/Honolulu", label: "Hawaii" },
] as const;

export const PNW_TRAILHEAD_PRESETS: TrailheadPreset[] = [
  {
    id: "snoqualmie",
    name: "Snoqualmie Pass",
    region: "I-90 Corridor",
    latitude: 47.425,
    longitude: -121.414,
    timeZone: "America/Los_Angeles",
  },
  {
    id: "rainier-paradise",
    name: "Mount Rainier (Paradise)",
    region: "South Cascades",
    latitude: 46.786,
    longitude: -121.735,
    timeZone: "America/Los_Angeles",
  },
  {
    id: "north-cascades",
    name: "North Cascades (Mt. Baker)",
    region: "North Cascades",
    latitude: 48.857,
    longitude: -121.666,
    timeZone: "America/Los_Angeles",
  },
  {
    id: "olympic-hoh",
    name: "Hoh Rain Forest",
    region: "Olympic Peninsula",
    latitude: 47.86,
    longitude: -123.935,
    timeZone: "America/Los_Angeles",
  },
  {
    id: "leavenworth",
    name: "Leavenworth / Enchantments",
    region: "Central Cascades",
    latitude: 47.596,
    longitude: -120.661,
    timeZone: "America/Los_Angeles",
  },
  {
    id: "columbia-gorge",
    name: "Columbia River Gorge",
    region: "SW Washington / Oregon",
    latitude: 45.698,
    longitude: -121.89,
    timeZone: "America/Los_Angeles",
  },
];

export const WASHINGTON_REGION: RegionConfig = {
  id: "wa",
  name: "Washington and nearby PNW",
  timeZone: "America/Los_Angeles",
  trailheads: PNW_TRAILHEAD_PRESETS,
  resources: library.RESOURCES,
  emergencyNumber: "911",
  sarCostNote:
    "In Washington State, search-and-rescue response does not bill rescued persons.",
};

export const REGIONS: Record<string, RegionConfig> = {
  [WASHINGTON_REGION.id]: WASHINGTON_REGION,
};
