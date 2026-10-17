import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Note, Screen, T } from "@/components/trailsafe/ui";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import { activateTrip, completeTrip, validatePlan } from "@/lib/plans";

export default function CurrentPlanActionScreen() {
  const { action } = useLocalSearchParams<{ action: string }>();
  const { data, ready, error, changeTrip } = useStore();
  const { notify, setDialog } = useApp();
  const processed = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!ready || processed.current === action) return;
    processed.current = action;
    if (error) {
      router.replace("/plans");
      return;
    }
    const target =
      action === "complete"
        ? data.plans.find((p) => p.status === "current")
        : action === "start"
          ? data.plans
              .filter((p) => p.status === "draft")
              .sort((a, b) => b.createdAt - a.createdAt)[0]
          : null;
    if (!target) {
      notify(
        action === "complete"
          ? "No current trip to complete."
          : "No draft trip to start.",
      );
      router.replace("/plans");
      return;
    }
    if (
      action === "start" &&
      validatePlan({ ...target, status: "current" }).length > 0
    ) {
      notify("Complete required trip details before starting.");
      router.replace({
        pathname: "/plans/[id]",
        params: { id: target.id, edit: "1" },
      });
      return;
    }
    const returnToPlan = () =>
      router.replace({ pathname: "/plans/[id]", params: { id: target.id } });
    setDialog({
      title: action === "complete" ? "Complete Trip Plan" : "Start Trip",
      message: `${action === "complete" ? "Complete" : "Start"} “${target.title || "this trip"}” locally? Nobody is notified automatically.${action === "start" && data.plans.some((p) => p.status === "current") ? " The previous current trip will become a draft." : ""}`,
      confirmLabel: action === "complete" ? "Mark Complete" : "Start Trip",
      onCancel: returnToPlan,
      onConfirm: async () => {
        setBusy(true);
        try {
          const saved = await changeTrip((plans) =>
            action === "complete"
              ? completeTrip(target.id, plans)
              : activateTrip(target.id, plans),
          );
          notify(
            action === "complete"
              ? "Trip completed locally. Confirm safe return directly with your contact."
              : "Current trip saved. Share your plan with your contact.",
          );
          router.replace({ pathname: "/plans/[id]", params: { id: saved.id } });
        } finally {
          setBusy(false);
        }
      },
    });
  }, [action, ready, error, data.plans, changeTrip, notify, setDialog]);
  return (
    <Screen title="Trip action">
      <T>
        {busy ? "Saving your trip…" : "Confirm the trip action to continue."}
      </T>
      <Note>Completing a trip here does not notify your contacts.</Note>
      <Button
        label="Return to trip plans"
        disabled={busy}
        onPress={() => {
          setDialog(null);
          router.replace("/plans");
        }}
      />
    </Screen>
  );
}

/** The web preview must also resolve direct voice-action URLs. */
export function generateStaticParams() {
  return [{ action: "start" }, { action: "complete" }];
}
