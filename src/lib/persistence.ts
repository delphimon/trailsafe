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
  version: 3;
  /** Array of all saved trip plans (drafts, current, and completed). */
  plans: TripPlan[];
  /** Reusable user profile containing name, phone, dual vehicles, medical notes, and comms. */
  profile: Profile;
  /** Array of completed checklist item IDs (e.g. Ten Essentials). */
  checklist: {
    checks: string[];
    startedAt: number;
    updatedAt: number;
    planId?: string;
  };
  tripDuration: "day" | "overnight";
  winterConditions: boolean;
  /** User's preferred coordinate display format across the app. */
  format: CoordinateFormat;
};

/** AsyncStorage key for TrailSafe local data. */
export const STORAGE_KEY = "trailsafe.local.v1";

/** Default state initialized when no saved record exists on the device. */
export const initialData: StoredData = {
  version: 3,
  plans: [],
  profile: emptyProfile,
  checklist: { checks: [], startedAt: Date.now(), updatedAt: Date.now() },
  tripDuration: "day",
  winterConditions: false,
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
    ![1, 2, 3].includes(v?.version) ||
    !Array.isArray(v.plans) ||
    !v.profile ||
    !["DD", "DDM", "UTM"].includes(v.format)
  )
    throw new Error("Unrecognized saved data. It has been preserved.");

  if (v.version === 1) {
    v.profile.travelerName = typeof v.profile.name === "string" ? v.profile.name : "";
    v.profile.travelerPhone = typeof v.profile.phone === "string" ? v.profile.phone : "";
    v.profile.defaultTrustedContactName = "";
    v.profile.defaultTrustedContactPhone = "";
    delete v.profile.name;
    delete v.profile.phone;
  }

  if (v.version === 1 || v.version === 2) {
    v.checklist = {
      checks: Array.isArray(v.checks) ? v.checks : [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
    v.tripDuration = v.tripType === "overnight" ? "overnight" : "day";
    v.winterConditions = v.tripType === "winter";
    delete v.checks;
    delete v.tripType;
  }
  
  if (!v.checklist || !Array.isArray(v.checklist.checks) || typeof v.checklist.startedAt !== "number" || typeof v.checklist.updatedAt !== "number" || !["day", "overnight"].includes(v.tripDuration)) {
    throw new Error("Saved data is damaged. It has been preserved.");
  }

  const profileFields = [
    "travelerName",
    "travelerPhone",
    "defaultTrustedContactName",
    "defaultTrustedContactPhone",
    "vehicle",
    "plate",
    "medical"
  ];
  if (
    !profileFields.every((k) => typeof v.profile[k] === "string") ||
    (v.profile.vehicle2 !== undefined && typeof v.profile.vehicle2 !== "string") ||
    (v.profile.plate2 !== undefined && typeof v.profile.plate2 !== "string") ||
    !Array.isArray(v.profile.comms) ||
    !v.profile.comms.every((x: unknown) => typeof x === "string") ||
    !v.checklist.checks.every((x: unknown) => typeof x === "string")
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
    "travelerName",
    "travelerPhone",
    "trustedContactName",
    "trustedContactPhone",
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

  let currentPlanCount = 0;
  let latestCurrentPlanIdx = -1;
  let maxUpdatedAt = 0;

  for (let i = 0; i < v.plans.length; i++) {
    const p = v.plans[i];
    if (!p) throw new Error("A saved trip plan is damaged. It has been preserved.");

    if (v.version === 1) {
      p.travelerName = typeof p.name === "string" ? p.name : "";
      p.travelerPhone = typeof p.phone === "string" ? p.phone : "";
      p.trustedContactName = "";
      p.trustedContactPhone = "";
      delete p.name;
      delete p.phone;
    }

    if (
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

    if (p.status === "current") {
      currentPlanCount++;
      if (p.updatedAt > maxUpdatedAt) {
        maxUpdatedAt = p.updatedAt;
        latestCurrentPlanIdx = i;
      }
    }
  }

  if (currentPlanCount > 1) {
    for (let i = 0; i < v.plans.length; i++) {
      if (v.plans[i].status === "current" && i !== latestCurrentPlanIdx) {
        v.plans[i].status = "draft";
      }
    }
  }

  v.version = 3;
  return v as StoredData;
}
