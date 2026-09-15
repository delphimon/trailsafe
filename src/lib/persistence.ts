/**
 * @file persistence.ts
 * @description Local device storage schema, validation, and migration logic.
 *
 * Core Principles:
 * 1. Offline & Local-Only: All user data (trip plans, profile details, checklist state)
 *    is saved exclusively in local AsyncStorage on the device. No cloud sync, accounts, or remote storage.
 * 2. Non-Destructive Integrity: If parsing or validation fails, an error is thrown and the existing
 *    raw data is strictly preserved rather than silently overwritten or reset with initial defaults.
 * 3. Backward Compatibility & Migration: Schema changes gracefully upgrade older stored profiles
 *    (such as migrating single-vehicle profiles to dual vehicles) while maintaining type safety.
 */

import { CoordinateFormat } from "./coordinates";
import { Profile, TripPlan, emptyProfile } from "./plans";

/**
 * Top-level structure stored under AsyncStorage key `trailsafe.local.v1`.
 */
export type StoredData = {
  /** Schema version identifier. */
  version: 1;
  /** Array of all saved trip plans (drafts, current, and completed). */
  plans: TripPlan[];
  /** Reusable user profile containing name, phone, dual vehicles, medical notes, and comms. */
  profile: Profile;
  /** Array of completed checklist item IDs (e.g. Ten Essentials). */
  checks: string[];
  /** Selected trip type preset for checklist add-ons ("day", "overnight", or "winter"). */
  tripType: "day" | "overnight" | "winter";
  /** User's preferred coordinate display format across the app. */
  format: CoordinateFormat;
};

/** AsyncStorage key for TrailSafe local data. */
export const STORAGE_KEY = "trailsafe.local.v1";

/** Default state initialized when no saved record exists on the device. */
export const initialData: StoredData = {
  version: 1,
  plans: [],
  profile: emptyProfile,
  checks: [],
  tripType: "day",
  format: "DD",
};

/**
 * Parses and validates raw JSON from AsyncStorage into a validated `StoredData` object.
 *
 * Validates:
 * - Version number (must be 1).
 * - Proper array and object types across all fields.
 * - Profile fields, validating `vehicle2` and `plate2` and normalizing legacy profiles.
 * - Every TripPlan object, asserting all required string properties, valid statuses,
 *   number finiteness for timestamps/revisions, boolean flags, and valid IANA time zone strings.
 *
 * @param raw Raw JSON string retrieved from AsyncStorage.
 * @throws Error with descriptive message if the data is malformed, unrecognized, or damaged.
 * @returns Validated StoredData object.
 */
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
    (v.profile.vehicle2 !== undefined && typeof v.profile.vehicle2 !== "string") ||
    (v.profile.plate2 !== undefined && typeof v.profile.plate2 !== "string") ||
    !Array.isArray(v.profile.comms) ||
    !v.profile.comms.every((x: unknown) => typeof x === "string") ||
    !v.checks.every((x: unknown) => typeof x === "string")
  )
    throw new Error("Saved data is damaged. It has been preserved.");
  v.profile.vehicle2 =
    typeof v.profile.vehicle2 === "string" ? v.profile.vehicle2 : "";
  v.profile.plate2 =
    typeof v.profile.plate2 === "string" ? v.profile.plate2 : "";
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
