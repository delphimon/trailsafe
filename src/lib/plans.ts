/**
 * @file plans.ts
 * @description Trip planning data models, validation, overdue calculations, and export formatting.
 *
 * Design Principles:
 * 1. Explicit Deadlines: Start, expected return, and overdue times are explicit dates and times.
 *    Overnight and multi-day trips are first-class, and overdue times carry across midnight and year boundaries.
 * 2. SAR Standard Formatting: Exported trip plans produce human-readable, chronological summaries
 *    structured specifically for Search & Rescue incident commanders and 911 dispatchers.
 * 3. Local Privacy: Plans are stored locally on the device and never transmitted to remote servers.
 * 4. Dual Vehicle Prefill: Reusable profile supports two vehicles, allowing one-tap selection
 *    during plan creation while keeping individual plans tied to their specific trailhead vehicle.
 */

/** Lifecycle state of a trip plan. */
export type PlanStatus = "draft" | "current" | "completed";

/**
 * Reusable hiker profile stored on device.
 * Used to automatically prefill new trip plans without retyping boilerplate.
 */
export type Profile = {
  /** Hiker name. */
  name: string;
  /** Primary contact phone or contact method. */
  phone: string;
  /** Primary vehicle (Car 1): color, make, model (e.g. "Silver Subaru Outback"). */
  vehicle: string;
  /** Primary vehicle (Car 1): license plate and state (e.g. "WA ABC123"). */
  plate: string;
  /** Secondary vehicle (Car 2): color, make, model (e.g. "Blue Rivian R1S"). */
  vehicle2: string;
  /** Secondary vehicle (Car 2): license plate and state (e.g. "WA XYZ789"). */
  plate2: string;
  /** Medical considerations, allergies, or chronic conditions. */
  medical: string;
  /** Usual communication devices carried (e.g. "Phone", "Satellite messenger", "PLB"). */
  comms: string[];
};

/**
 * Complete specification of an individual outdoor trip plan.
 */
export type TripPlan = {
  /** Unique plan identifier. */
  id: string;
  /** Plan lifecycle status ("draft" | "current" | "completed"). */
  status: PlanStatus;
  /** Revision counter incremented on each saved update. */
  revision: number;
  /** Epoch timestamp in ms when created. */
  createdAt: number;
  /** Epoch timestamp in ms when last modified. */
  updatedAt: number;
  /** Trip title or destination (e.g. "Granite Mountain Trail"). */
  title: string;
  /** Start date (YYYY-MM-DD). */
  date: string;
  /** Start time in 24-hour HH:MM format. */
  startTime: string;
  /** Expected return date (YYYY-MM-DD). */
  returnDate: string;
  /** Expected return time in 24-hour HH:MM format. */
  returnTime: string;
  /** Overdue trigger date (YYYY-MM-DD) when emergency contact should take action. */
  overdueDate: string;
  /** Overdue trigger time in 24-hour HH:MM format. */
  overdueTime: string;
  /** IANA time zone identifier (e.g. "America/Los_Angeles"). */
  timeZone: string;
  /** Trailhead name, parking location, or starting access road. */
  trailhead: string;
  /** Planned travel route, summits, waypoints, and landmarks. */
  route: string;
  /** Backup or turnaround contingency plan. */
  backup: string;
  /** Total party count (must be a positive integer). */
  partySize: string;
  /** Contact person name. */
  name: string;
  /** Contact person phone number. */
  phone: string;
  /** Primary vehicle description parked at trailhead. */
  vehicle: string;
  /** Primary vehicle license plate. */
  plate: string;
  /** Communication devices carried on this trip. */
  comms: string[];
  /** Other party member names, ages, and phone numbers. */
  members: string;
  /** Medical notes relevant to the party. */
  medical: string;
  /** Known allergies and medications carried. */
  allergies: string;
  /** Wilderness experience level of the party. */
  experience: string;
  /** Colors of jackets, packs, and rain gear. */
  outerwear: string;
  /** Tent, tarp, or bivy sack description and color. */
  shelter: string;
  /** Footwear type, brand, and sole description. */
  boots: string;
  /** Additional vehicles parked at trailhead or shuttle endpoint. */
  extraVehicles: string;
  /** Miscellaneous notes for rescuers. */
  notes: string;
  /** If true, the in-app overdue banner displays when current time exceeds overdue deadline. */
  remind: boolean;
};

/** Default empty profile values. */
export const emptyProfile: Profile = {
  name: "",
  phone: "",
  vehicle: "",
  plate: "",
  vehicle2: "",
  plate2: "",
  medical: "",
  comms: [],
};

/** Returns today's date formatted as a YYYY-MM-DD calendar string. */
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Adds an integer number of days to a YYYY-MM-DD date string using UTC arithmetic.
 *
 * @param dateStr Base date string in YYYY-MM-DD format.
 * @param days Number of days to add (or subtract).
 * @returns Resulting YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  if (!validDate(dateStr)) return localDate();
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the current time rounded up to the next 5-minute interval in 24-hour HH:MM format.
 */
export function currentTimeRounded(now = new Date()): string {
  const mins = Math.ceil(now.getMinutes() / 5) * 5;
  const d = new Date(now);
  d.setMinutes(mins);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Initializes a new TripPlan object with sensible defaults and prefilled profile details.
 *
 * @param profile Hiker profile to prefill from (defaults to emptyProfile).
 * @returns New draft TripPlan.
 */
export function newPlan(profile: Profile = emptyProfile): TripPlan {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    status: "draft",
    revision: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: "",
    date: localDate(),
    startTime: "",
    returnDate: localDate(),
    returnTime: "",
    overdueDate: localDate(),
    overdueTime: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    trailhead: "",
    route: "",
    backup: "",
    partySize: "",
    name: profile.name,
    phone: profile.phone,
    vehicle: profile.vehicle,
    plate: profile.plate,
    medical: profile.medical,
    comms: [...profile.comms],
    members: "",
    allergies: "",
    experience: "",
    outerwear: "",
    shelter: "",
    boots: "",
    extraVehicles: "",
    notes: "",
    remind: false,
  };
}

/** Validates that a string is a legitimate calendar date in YYYY-MM-DD format. */
export function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Validates that a string is a 24-hour time in HH:MM format (00:00 to 23:59). */
export const validTime = (s: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/**
 * Validates plan data for generation and marking current.
 *
 * Rules:
 * - Title, Trailhead, Route, Name, and Phone are required non-empty strings.
 * - Party size must be an integer >= 1.
 * - Dates must be valid YYYY-MM-DD.
 * - Times must be valid HH:MM.
 * - Return datetime must be strictly after start datetime.
 * - Overdue datetime must be strictly after return datetime.
 *
 * @param p The TripPlan to validate.
 * @returns Array of validation error messages (empty if plan is valid).
 */
export function validatePlan(p: TripPlan): string[] {
  const errors: string[] = [];
  for (const [label, value] of [
    ["Trip title", p.title],
    ["Trailhead", p.trailhead],
    ["Planned route", p.route],
    ["Your name", p.name],
    ["Your phone / contact method", p.phone],
  ])
    if (!value.trim()) errors.push(`${label} is required.`);
  if (!/^\d+$/.test(p.partySize) || Number(p.partySize) < 1)
    errors.push("Party size must be a whole number of at least 1.");
  if (![p.date, p.returnDate, p.overdueDate].every(validDate))
    errors.push("Enter valid dates as YYYY-MM-DD.");
  if (![p.startTime, p.returnTime, p.overdueTime].every(validTime))
    errors.push("Enter times in 24-hour HH:MM format.");
  if (!errors.some((e) => e.includes("dates") || e.includes("times"))) {
    if (`${p.returnDate}T${p.returnTime}` <= `${p.date}T${p.startTime}`)
      errors.push(
        "Expected return must be after the start. Use the return date for overnight trips.",
      );
    if (
      `${p.overdueDate}T${p.overdueTime}` <= `${p.returnDate}T${p.returnTime}`
    )
      errors.push("Choose an overdue time after expected return.");
  }
  return errors;
}
/**
 * Suggests an overdue deadline by adding a specified duration (default +2 hours) to expected return.
 * Safely wraps over midnight and year-end boundaries in UTC.
 *
 * @param date Return date (YYYY-MM-DD).
 * @param time Return time (HH:MM).
 * @param hours Number of buffer hours to add (defaults to 2).
 * @returns Object with suggested overdueDate and overdueTime, or null if inputs are invalid.
 */
export function suggestOverdue(date: string, time: string, hours = 2) {
  if (!validDate(date) || !validTime(time)) return null;
  const d = new Date(`${date}T${time}:00Z`);
  d.setUTCHours(d.getUTCHours() + hours);
  return {
    overdueDate: d.toISOString().slice(0, 10),
    overdueTime: d.toISOString().slice(11, 16),
  };
}

/**
 * Checks whether a current trip plan is overdue based on device clock and the plan's specific time zone.
 * Requires:
 * 1. Plan status is "current".
 * 2. Plan reminder flag `remind` is true.
 * 3. Valid overdueDate and overdueTime.
 * 4. Local clock time in plan's timeZone has reached or passed the deadline.
 *
 * @param p The TripPlan to evaluate.
 * @param now Current Date object (defaults to new Date()).
 * @returns True if the plan is currently overdue.
 */
export function isOverdue(p: TripPlan, now = new Date()): boolean {
  if (
    p.status !== "current" ||
    !p.remind ||
    !validDate(p.overdueDate) ||
    !validTime(p.overdueTime)
  )
    return false;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: p.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((x) => x.type === type)?.value;
  return (
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}` >=
    `${p.overdueDate}T${p.overdueTime}`
  );
}

/**
 * Generates the definitive human-readable text document for a trip plan.
 * Used for clipboard copy, SMS sharing, and SAR incident handover.
 *
 * @param p The TripPlan to format.
 * @returns Formatted multi-line trip plan string.
 */
export function buildPlanText(p: TripPlan): string {
  const lines = [
    p.revision > 1
      ? "UPDATED KCESAR TRAILSAFE TRIP PLAN"
      : "KCESAR TRAILSAFE TRIP PLAN",
    `Revision: ${p.revision} · ${p.status.toUpperCase()}`,
    "",
    `Trip: ${p.title || "(not set)"}`,
    `Party: ${p.partySize || "(not set)"}`,
    `Contact: ${p.name || "(not set)"} — ${p.phone || "(not set)"}`,
    `All times: ${p.timeZone}`,
    "",
    `Start: ${p.date} ${p.startTime || "(not set)"}`,
    `Trailhead / area: ${p.trailhead || "(not set)"}`,
    "",
    `Planned route: ${p.route || "(not set)"}`,
  ];
  const add = (label: string, value: string) => {
    if (value.trim()) lines.push("", `${label}: ${value.trim()}`);
  };
  add("Backup / turnaround plan", p.backup);
  lines.push(
    "",
    `Expected return: ${p.returnDate} ${p.returnTime || "(not set)"}`,
    "",
    `IF YOU HAVE NOT HEARD FROM ME BY: ${p.overdueDate} ${p.overdueTime || "(not set)"} (${p.timeZone})`,
    "1. Try to call or text me.",
    "2. If you cannot reach me and I remain overdue, call 911.",
    "3. Report an overdue outdoor party and provide this entire plan.",
  );
  for (const [label, value] of [
    ["Vehicle", p.vehicle],
    ["License plate (include state)", p.plate],
    ["Communications carried", p.comms.join(", ")],
    ["Party members / ages", p.members],
    ["Allergies & medications", p.allergies],
    ["Medical considerations", p.medical],
    ["Experience", p.experience],
    ["Outerwear", p.outerwear],
    ["Tent / shelter", p.shelter],
    ["Footwear", p.boots],
    ["Additional vehicles", p.extraVehicles],
    ["Notes", p.notes],
  ])
    add(label, value);
  lines.push(
    "",
    "Created with KCESAR TrailSafe. This plan is not monitored.",
    "Nobody is notified automatically. Share changes directly with the person holding your plan.",
  );
  return lines.join("\n");
}

/**
 * Escapes characters with HTML special meaning to prevent injection in generated PDF/HTML views.
 *
 * @param text Raw user input string.
 * @returns HTML-safe escaped string.
 */
export function escapeHTML(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

/**
 * Wraps the formatted plan text in a clean, print-optimized HTML document for PDF generation.
 *
 * @param p The TripPlan to convert.
 * @returns Complete HTML document string.
 */
export function planHTML(p: TripPlan): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>TrailSafe Trip Plan</title><style>@page{margin:24mm}body{font:14px system-ui;color:#171B18}h1{color:#1B3A2E}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.6}</style></head><body><h1>TrailSafe · Trip Plan</h1><pre>${escapeHTML(buildPlanText(p))}</pre></body></html>`;
}

/**
 * Creates a pre-populated "safe return" SMS message draft for checking in with emergency contacts.
 *
 * @param p The completed TripPlan.
 * @returns Friendly check-in text.
 */
export function buildSafeReturnDraft(p: TripPlan): string {
  const destination = p.title.trim() || p.trailhead.trim() || "my trip";
  return `Hi! I’m back safely from ${destination}. Trip plan is complete and all is well! (Sent via KCESAR TrailSafe)`;
}
