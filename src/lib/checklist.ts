import type { StoredData } from "./persistence";

/** Start empty progress against the latest current trip; retain older progress's identity. */
export function toggleChecklist(
  data: StoredData,
  key: string,
  now = Date.now(),
) {
  const checklist = data.checklist;
  const starting = checklist.checks.length === 0;
  return {
    ...checklist,
    ...(starting
      ? {
          planId: data.plans.find((p) => p.status === "current")?.id,
          startedAt: now,
        }
      : {}),
    checks: checklist.checks.includes(key)
      ? checklist.checks.filter((k) => k !== key)
      : [...checklist.checks, key],
    updatedAt: now,
  };
}
