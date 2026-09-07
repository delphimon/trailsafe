export type PlanStatus = "draft" | "current" | "completed";
export type Profile = {
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  medical: string;
  comms: string[];
};
export type TripPlan = {
  id: string;
  status: PlanStatus;
  revision: number;
  createdAt: number;
  updatedAt: number;
  title: string;
  date: string;
  startTime: string;
  returnDate: string;
  returnTime: string;
  overdueDate: string;
  overdueTime: string;
  timeZone: string;
  trailhead: string;
  route: string;
  backup: string;
  partySize: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  comms: string[];
  members: string;
  medical: string;
  allergies: string;
  experience: string;
  outerwear: string;
  shelter: string;
  boots: string;
  extraVehicles: string;
  notes: string;
  remind: boolean;
};
export const emptyProfile: Profile = {
  name: "",
  phone: "",
  vehicle: "",
  plate: "",
  medical: "",
  comms: [],
};
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
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
    ...profile,
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
export function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export const validTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export function validatePlan(p: TripPlan) {
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
export function suggestOverdue(date: string, time: string) {
  if (!validDate(date) || !validTime(time)) return null;
  const d = new Date(`${date}T${time}:00Z`);
  d.setUTCHours(d.getUTCHours() + 2);
  return {
    overdueDate: d.toISOString().slice(0, 10),
    overdueTime: d.toISOString().slice(11, 16),
  };
}
export function isOverdue(p: TripPlan, now = new Date()) {
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
export function buildPlanText(p: TripPlan) {
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
export function escapeHTML(text: string) {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function planHTML(p: TripPlan) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>TrailSafe Trip Plan</title><style>@page{margin:24mm}body{font:14px system-ui;color:#171B18}h1{color:#1B3A2E}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.6}</style></head><body><h1>TrailSafe · Trip Plan</h1><pre>${escapeHTML(buildPlanText(p))}</pre></body></html>`;
}
