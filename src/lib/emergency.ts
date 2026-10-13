/** Emergency drafts and transport injection. Tests supply inert handlers; no consumer modes. */

import { Fix, locationText } from "./coordinates";

/**
 * Constructs a structured emergency text message suitable for Text-to-911 or emergency sharing.
 *
 * @param fix Current in-memory GPS fix, or null if location is unavailable.
 * @param situation Brief description of the emergency or situation category.
 * @param partySize Total number of people in the party (optional).
 * @param phone Direct callback phone number (optional).
 * @returns Multi-line text formatted for emergency dispatch.
 */
export function buildEmergencyDraft(
  fix: Fix | null,
  situation: string,
  partySize?: string,
  phone?: string,
  locationKind: "here" | "elsewhere" = /overdue|missing/i.test(situation)
    ? "elsewhere"
    : "here",
): string {
  const missing = locationKind === "elsewhere";
  const where = missing
    ? /missing|overdue/i.test(situation)
      ? "Missing person’s last known location: [enter trail, area, and time last seen]"
      : "Person needing help — last known location: [enter trail, area, and time last seen]"
    : fix
      ? `Emergency at my location:\n${locationText(fix, "DD")}`
      : null;
  return [
    where ||
      "Location: unknown — describe trailhead, trail, landmarks, and area to 911 (if reporting someone else, provide their last known location).",
    `Emergency: ${situation || "Describe what happened."}`,
    partySize ? `Party size: ${partySize}` : "Party size: [enter number]",
    phone ? `Callback: ${phone}` : "Callback number: [enter number]",
    "Need search / rescue assistance.",
  ].join("\n");
}

/** Dispatches only to the injected handler. Unit tests never import native transports. */
export async function performEmergencyAction(
  action: "call" | "text",
  handlers: { call: () => Promise<void>; text: () => Promise<void> },
): Promise<void> {
  await handlers[action]();
}

/** A composer result is not a delivery receipt; Android returns unknown. */
export function smsOutcomeMessage(
  result: "sent" | "cancelled" | "unknown",
): string {
  if (result === "cancelled")
    return "Text cancelled. Contact your trusted contact directly if needed.";
  if (result === "unknown")
    return "Check your messaging app. TrailSafe cannot verify sending or delivery.";
  return "Composer closed. Confirm sending in your messaging app; TrailSafe cannot verify delivery.";
}
