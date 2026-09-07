import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { ClipboardList, Plus, UserRound } from "lucide-react-native";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import { isOverdue, newPlan } from "@/lib/plans";
import {
  Button,
  C,
  Callout,
  Card,
  fonts,
  Heading,
  Note,
  Row,
  Screen,
  T,
  s,
} from "@/components/trailsafe/ui";
export default function Plans() {
  const { data, update, ready, error } = useStore(),
    { run, notify, setDialog } = useApp();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Screen
      title="Trip Plans"
      subtitle="Give someone the information SAR would need"
      back
    >
      <Button
        label="New Trip Plan"
        icon={Plus}
        disabled={!ready || !!error}
        onPress={() =>
          router.push({ pathname: "/plans/[id]", params: { id: "new" } })
        }
      />
      <Row
        title="My reusable profile"
        subtitle="Save time on your next plan"
        icon={UserRound}
        onPress={() => router.push("/profile")}
      />
      <View style={{ marginTop: 18 }}>
        <Note>
          Saved here, on your device. Share your plan with someone before you
          leave reliable coverage.
        </Note>
      </View>
      {!ready && <T>Loading saved plans…</T>}
      {error && (
        <Callout critical title="Could not load plans">
          {error}
        </Callout>
      )}
      {ready && !data.plans.length && (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
          <ClipboardList size={44} color="#859481" />
          <Heading>No trip plans yet</Heading>
          <T style={{ textAlign: "center", color: C.muted }}>
            Create one before you head out.{"\n"}A little information can make a
            big difference.
          </T>
        </View>
      )}
      <View style={{ marginTop: 18 }}>
        {[...data.plans]
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((p) => (
            <Card key={p.id}>
              {isOverdue(p, now) && (
                <Callout critical title="Your check-in time has passed">
                  If you’re safe, contact the person holding your plan.
                  Completing a plan here does not notify anyone.
                </Callout>
              )}
              <T
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 10,
                  color: p.status === "current" ? C.green : C.muted,
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                {p.status.toUpperCase()}
              </T>
              <Heading>{p.title || "Untitled trip"}</Heading>
              <Note>
                {p.date} ·{" "}
                {p.returnTime
                  ? `Back ${p.returnDate} at ${p.returnTime}`
                  : "Return time not set"}
              </Note>
              <View style={[s.flexRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="View Plan"
                    small
                    onPress={() =>
                      router.push({
                        pathname: "/plans/[id]",
                        params: { id: p.id },
                      })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Edit"
                    small
                    variant="outline"
                    onPress={() =>
                      router.push({
                        pathname: "/plans/[id]",
                        params: { id: p.id, edit: "1" },
                      })
                    }
                  />
                </View>
              </View>
              <View style={[s.wrap, { marginTop: 10 }]}>
                <Button
                  label="Duplicate"
                  small
                  variant="ghost"
                  onPress={() =>
                    void run(async () => {
                      const fresh = newPlan();
                      const duplicate = {
                        ...p,
                        id: fresh.id,
                        status: "draft" as const,
                        revision: 1,
                        createdAt: fresh.createdAt,
                        updatedAt: fresh.updatedAt,
                        title: `${p.title} (copy)`,
                        remind: false,
                      };
                      await update((d) => ({
                        ...d,
                        plans: [...d.plans, duplicate],
                      }));
                      router.push({
                        pathname: "/plans/[id]",
                        params: { id: duplicate.id, edit: "1" },
                      });
                    })
                  }
                />
                {p.status !== "completed" && (
                  <Button
                    label="Complete"
                    small
                    variant="ghost"
                    onPress={() =>
                      void run(async () => {
                        await update((d) => ({
                          ...d,
                          plans: d.plans.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  status: "completed",
                                  updatedAt: Date.now(),
                                }
                              : x,
                          ),
                        }));
                        notify(
                          "Completed locally. Remember to tell your contact.",
                        );
                      })
                    }
                  />
                )}
                <Button
                  label="Delete"
                  small
                  variant="ghost"
                  onPress={() =>
                    setDialog({
                      title: "Delete trip plan?",
                      message: `Remove “${p.title || "Untitled trip"}” from this device? Previously shared copies are unaffected.`,
                      confirmLabel: "Delete plan",
                      onConfirm: () =>
                        update((d) => ({
                          ...d,
                          plans: d.plans.filter((x) => x.id !== p.id),
                        })),
                    })
                  }
                />
              </View>
            </Card>
          ))}
      </View>
    </Screen>
  );
}
