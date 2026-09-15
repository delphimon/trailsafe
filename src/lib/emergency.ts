/**
 * @file emergency.ts
 * @description Emergency message generation and guarded handoff orchestration for 911 dispatch.
 *
 * Critical Safety Invariants:
 * 1. Location-First: Formats always lead with coordinate/location details so 911 dispatchers
 *    receive critical location even if a call or text drops immediately.
 * 2. Overdue/Missing Person Separation: When reporting an overdue or missing party, the draft
 *    deliberately omits the caller's GPS coordinates to prevent searchers from deploying to the
 *    reporting party instead of the subject's last known position.
 * 3. Practice Isolation: Practice mode strictly intercepts all handoffs, invoking simulation
 *    handlers and ensuring zero native telecom, SMS, or emergency service connections are made.
 */

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
): string {
  const missing = /overdue|missing/i.test(situation);
  const where = missing
    ? "Missing person’s last known location: [enter trail, area, and time last seen]"
    : fix
      ? locationText(fix, "DD")
      : null;
  return [
    where ||
      "Location: unknown — describe trailhead, trail, landmarks, and area to 911.",
    `Emergency: ${situation || "Describe what happened."}`,
    partySize ? `Party size: ${partySize}` : "Party size: [enter number]",
    phone ? `Callback: ${phone}` : "Callback number: [enter number]",
    "Need search / rescue assistance.",
  ].join("\n");
}

/**
 * Executes an emergency communication action (call or text) with a strict practice safety interlock.
 *
 * @param practice If true, the action is simulated and native handoffs are guaranteed not to run.
 * @param action The requested communication method ("call" or "text").
 * @param handlers Handlers object containing simulation and live action implementations.
 */
export async function performEmergencyAction(
  practice: boolean,
  action: "call" | "text",
  handlers: {
    simulate: (action: "call" | "text") => void;
    call: () => Promise<void>;
    text: () => Promise<void>;
  },
): Promise<void> {
  if (practice) {
    handlers.simulate(action);
    return;
  }
  await handlers[action]();
}
