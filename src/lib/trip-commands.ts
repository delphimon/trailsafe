import { type StoredData } from "./persistence";
import { type LifecycleResult, type TripPlan } from "./plans";
export type TripCommand = (plans: TripPlan[]) => LifecycleResult<TripPlan>;
/** Compute inside the serialized store update and return only after persistence succeeds. */
export async function commitTripCommand(
  update: (fn: (data: StoredData) => StoredData) => Promise<void>,
  command: TripCommand,
): Promise<TripPlan> {
  let saved: TripPlan | undefined;
  await update((data) => {
    const result = command(data.plans);
    if (!result.ok) throw new Error(result.errors.join("\n"));
    saved = result.plan;
    return { ...data, plans: result.plans };
  });
  if (!saved) throw new Error("Trip update did not run.");
  return saved;
}
