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

export default function CurrentPlanActionScreen() {
  const { action } = useLocalSearchParams<{ action: string }>();
  const { data, ready, update } = useStore();
  const { notify } = useApp();
  const processedRef = useRef(false);

  useEffect(() => {
    if (!ready || processedRef.current) return;
    processedRef.current = true;

    async function handleAction() {
      if (action === "complete") {
        const currentPlan = data.plans.find((p) => p.status === "current");
        if (currentPlan) {
          await update((s) => ({
            ...s,
            plans: s.plans.map((p) =>
              p.id === currentPlan.id
                ? {
                    ...p,
                    status: "completed",
                    updatedAt: Date.now(),
                    revision: p.revision + 1,
                  }
                : p,
            ),
          }));
          notify(
            `Trip "${currentPlan.title}" marked complete! Remember to confirm safe return with your emergency contacts.`,
          );
          router.replace({
            pathname: "/plans/[id]",
            params: { id: currentPlan.id },
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
          await update((s) => ({
            ...s,
            plans: s.plans.map((p) =>
              p.id === latestDraft.id
                ? {
                    ...p,
                    status: "current",
                    updatedAt: Date.now(),
                    revision: p.revision + 1,
                  }
                : p,
            ),
          }));
          notify(`Trip "${latestDraft.title}" is now active! Stay safe out there.`);
          router.replace({
            pathname: "/plans/[id]",
            params: { id: latestDraft.id },
          });
        } else {
          notify("No draft trip plan found to start.");
          router.replace("/plans");
        }
      } else {
        router.replace("/plans");
      }
    }

    void handleAction();
  }, [action, ready, data.plans, update, notify]);

  return (
    <Screen title="Updating Trip Plan">
      <View style={{ alignItems: "center", paddingVertical: 40 }}>
        <ActivityIndicator size="large" color="#4BAE74" />
        <T style={{ marginTop: 16 }}>Updating your trip plan status...</T>
      </View>
    </Screen>
  );
}
