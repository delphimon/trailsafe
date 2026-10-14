import {
  computeTripReminderIntents,
  type ScheduledReminderIntent,
  type TripPlan,
} from "./plans";
export type ReminderStatus =
  "idle" | "scheduled" | "denied" | "unavailable" | "failed";
export type PendingReminder = {
  identifier: string;
  data?: Record<string, unknown>;
};
export type ReminderAdapter = {
  list: () => Promise<PendingReminder[]>;
  cancel: (id: string) => Promise<void>;
  permission: (request: boolean) => Promise<boolean>;
  schedule: (id: string, intent: ScheduledReminderIntent) => Promise<void>;
};
export const reminderId = (i: ScheduledReminderIntent) =>
  `trailsafe:${i.planId}:${i.planRevision}:${i.type}:${i.triggerDate.getTime()}`;
export function isTripReminder(data?: Record<string, unknown>): boolean {
  return (
    data?.owner === "trailsafe" ||
    (typeof data?.planId === "string" &&
      (data.type === "return" || data.type === "overdue"))
  );
}
/** Reconcile saved intent with OS state. Never cancel another feature's notifications. */
export async function reconcileReminders(
  plans: TripPlan[],
  adapter: ReminderAdapter,
  requestPermission = false,
  now = Date.now(),
): Promise<ReminderStatus> {
  const desired = plans.flatMap((p) => computeTripReminderIntents(p, now));
  const wanted = new Map(desired.map((i) => [reminderId(i), i]));
  const pending = await adapter.list();
  const granted = desired.length
    ? await adapter.permission(requestPermission)
    : true;
  for (const item of pending) {
    if (!isTripReminder(item.data)) continue;
    if (!granted || !wanted.has(item.identifier))
      await adapter.cancel(item.identifier);
    else wanted.delete(item.identifier);
  }
  if (!granted) return "denied";
  for (const [id, intent] of wanted) await adapter.schedule(id, intent);
  return desired.length ? "scheduled" : "idle";
}
