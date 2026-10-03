/**
 * @file [action].tsx
 * @description Route handler for hands-free voice assistant trip plan management actions.
 *
 * Deep Links:
 * - `trailsafe://plan/current/complete`: Marks the current active trip plan as completed.
 * - `trailsafe://plan/current/start`: Promotes the most recently saved draft plan to active.
 */

import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, T } from "@/components/trailsafe/ui";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import { activateTrip, completeTrip } from "@/lib/plans";
import { cancelTripReminders, scheduleTripReminders } from "@/lib/notifications";

export default function CurrentPlanActionScreen() {
  const { action } = useLocalSearchParams<{ action: string }>();
  const { data, ready, update } = useStore();
  const { notify, setDialog } = useApp();
  const processedRef = useRef(false);

  useEffect(() => {
    if (!ready || processedRef.current) return;
    processedRef.current = true;

    if (action === "complete") {
      const currentPlan = data.plans.find((p) => p.status === "current");
      if (currentPlan) {
        setDialog({
          title: "Complete Trip Plan",
          message: `Are you sure you want to mark "${currentPlan.title || 'your trip'}" as complete locally? Completing a plan does not notify your contacts.`,
          confirmLabel: "Mark Complete",
          onConfirm: () => {
            const res = completeTrip(currentPlan.id, data.plans);
            if (!res.ok) {
              notify(res.errors[0]);
              router.replace("/plans");
              return;
            }
            void cancelTripReminders(currentPlan.id);
            void update((s) => ({
              ...s,
              plans: res.plans,
            }));
            setDialog(null);
            notify(`Trip "${res.plan.title || 'plan'}" marked complete locally. Confirm safe return directly with your emergency contacts.`);
            router.replace({
              pathname: "/plans/[id]",
              params: { id: currentPlan.id },
            });
          },
        });
      } else {
        notify("No active trip plan was found to mark complete.");
        router.replace("/plans");
      }
    } else if (action === "start") {
      const latestDraft = data.plans
        .filter((p) => p.status === "draft")
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      if (latestDraft) {
        setDialog({
          title: "Start Trip",
          message: `Are you sure you want to start "${latestDraft.title || 'this trip'}"?`,
          confirmLabel: "Start Trip",
          onConfirm: () => {
            const res = activateTrip(latestDraft.id, data.plans);
            if (!res.ok) {
              setDialog(null);
              notify(`Cannot start trip: ${res.errors[0]}`);
              router.replace({
                pathname: "/plans/[id]",
                params: { id: latestDraft.id, edit: "1" },
              });
              return;
            }
            const previousCurrent = data.plans.find((p) => p.status === "current");
            if (previousCurrent) {
              void cancelTripReminders(previousCurrent.id);
            }
            if (res.plan.remind) {
              void scheduleTripReminders(res.plan);
            }
            void update((s) => ({
              ...s,
              plans: res.plans,
            }));
            setDialog(null);
            notify(`Trip "${res.plan.title || 'plan'}" is now active! Stay safe out there.`);
            router.replace({
              pathname: "/plans/[id]",
              params: { id: res.plan.id },
            });
          },
        });
      } else {
        notify("No draft trip plan found to start.");
        router.replace("/plans");
      }
    } else {
      router.replace("/plans");
    }
  }, [action, ready, data.plans, update, notify, setDialog]);

  return (
    <Screen title="Updating Trip Plan">
      <View style={{ alignItems: "center", paddingVertical: 40 }}>
        <ActivityIndicator size="large" color="#4BAE74" />
        <T style={{ marginTop: 16 }}>Updating your trip plan status...</T>
      </View>
    </Screen>
  );
}
