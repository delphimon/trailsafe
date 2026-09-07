import { CoordinateFormat } from "./coordinates";
import { Profile, TripPlan, emptyProfile } from "./plans";
export type StoredData = {
  version: 1;
  plans: TripPlan[];
  profile: Profile;
  checks: string[];
  tripType: "day" | "overnight" | "winter";
  format: CoordinateFormat;
};
export const STORAGE_KEY = "trailsafe.local.v1";
export const initialData: StoredData = {
  version: 1,
  plans: [],
  profile: emptyProfile,
  checks: [],
  tripType: "day",
  format: "DD",
};
export function parseStoredData(raw: string): StoredData {
  const v = JSON.parse(raw);
  if (
    v?.version !== 1 ||
    !Array.isArray(v.plans) ||
    !Array.isArray(v.checks) ||
    !v.profile ||
    !["day", "overnight", "winter"].includes(v.tripType) ||
    !["DD", "DDM", "UTM"].includes(v.format)
  )
    throw new Error("Unrecognized saved data. It has been preserved.");
  const profileFields = ["name", "phone", "vehicle", "plate", "medical"];
  if (
    !profileFields.every((k) => typeof v.profile[k] === "string") ||
    !Array.isArray(v.profile.comms) ||
    !v.profile.comms.every((x: unknown) => typeof x === "string") ||
    !v.checks.every((x: unknown) => typeof x === "string")
  )
    throw new Error("Saved data is damaged. It has been preserved.");
  const strings = [
    "id",
    "title",
    "date",
    "startTime",
    "returnDate",
    "returnTime",
    "overdueDate",
    "overdueTime",
    "timeZone",
    "trailhead",
    "route",
    "backup",
    "partySize",
    "name",
    "phone",
    "vehicle",
    "plate",
    "members",
    "medical",
    "allergies",
    "experience",
    "outerwear",
    "shelter",
    "boots",
    "extraVehicles",
    "notes",
  ];
  for (const p of v.plans) {
    if (
      !p ||
      !strings.every((k) => typeof p[k] === "string") ||
      !["draft", "current", "completed"].includes(p.status) ||
      !Array.isArray(p.comms) ||
      !p.comms.every((x: unknown) => typeof x === "string") ||
      ![p.createdAt, p.updatedAt, p.revision].every(Number.isFinite) ||
      typeof p.remind !== "boolean"
    )
      throw new Error("A saved trip plan is damaged. It has been preserved.");
    try {
      new Intl.DateTimeFormat("en", { timeZone: p.timeZone });
    } catch {
      throw new Error(
        "A saved trip has an unsupported time zone. It has been preserved.",
      );
    }
  }
  return v;
}
