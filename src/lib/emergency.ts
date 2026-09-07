import { Fix, locationText } from "./coordinates";
export function buildEmergencyDraft(
  fix: Fix | null,
  situation: string,
  partySize?: string,
  phone?: string,
) {
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
export async function performEmergencyAction(
  practice: boolean,
  action: "call" | "text",
  handlers: {
    simulate: (action: "call" | "text") => void;
    call: () => Promise<void>;
    text: () => Promise<void>;
  },
) {
  if (practice) {
    handlers.simulate(action);
    return;
  }
  await handlers[action]();
}
