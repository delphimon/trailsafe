import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { ClipboardList, Plus, UserRound } from "lucide-react-native";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import {
  localDate,
  isOverdue,
  completeTrip,
  duplicateTrip,
  buildSafeReturnDraft,
} from "@/lib/plans";
import { smsOutcomeMessage } from "@/lib/emergency";
import * as SMS from "expo-sms";
import {
  Button,
  useThemeStyles,
  Callout,
  Card,
  fonts,
  Heading,
  Note,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
export default function Plans() {
  const { C, s } = useThemeStyles();
  const { data, update, ready, error, changeTrip, reminderStatus } = useStore(),
    { run, notify, setDialog, share } = useApp();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Screen title="Trips" subtitle="Current, upcoming and past trip plans">
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
      {reminderStatus !== "idle" && (
        <Note>
          Local reminders: {reminderStatus}. TrailSafe does not notify anyone
          automatically.
        </Note>
      )}
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
        {(["Current", "Upcoming", "Past"] as const).map((group) => {
          const plans = data.plans
            .filter((p) =>
              group === "Current"
                ? p.status === "current"
                : group === "Past"
                  ? p.status !== "current" &&
                    (p.status === "completed" || p.date < localDate(now))
                  : p.status === "draft" && p.date >= localDate(now),
            )
            .sort((a, b) =>
              group === "Upcoming"
                ? a.date.localeCompare(b.date)
                : b.updatedAt - a.updatedAt,
            );
          return (
            <View key={group} style={{ marginBottom: 18 }}>
              <Heading>{group}</Heading>
              {!plans.length && <Note>No {group.toLowerCase()} trips.</Note>}
              {plans.map((p) => (
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
                          const saved = await changeTrip((plans) =>
                            duplicateTrip(p.id, plans),
                          );
                          router.push({
                            pathname: "/plans/[id]",
                            params: { id: saved.id, edit: "1" },
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
                          setDialog({
                            title: "Mark trip complete?",
                            message: `Mark “${p.title || "Untitled trip"}” as complete locally? Completing a plan does not notify anyone.`,
                            confirmLabel: "Mark Complete",
                            onConfirm: async () => {
                              const saved = await changeTrip((plans) =>
                                completeTrip(p.id, plans),
                              );
                              notify("Trip marked complete locally.");
                              setDialog({
                                title: "Plan completed locally",
                                message:
                                  "TrailSafe does not notify anyone automatically. Open a safe-return text draft for your trusted contact now?",
                                confirmLabel: "Open Safe-Return Text",
                                cancelLabel: "Not Now",
                                onConfirm: async () => {
                                  const text = buildSafeReturnDraft(saved);
                                  const targetPhone = saved.trustedContactPhone
                                    ? [saved.trustedContactPhone]
                                    : [];
                                  if (await SMS.isAvailableAsync()) {
                                    const smsRes = await SMS.sendSMSAsync(
                                      targetPhone,
                                      text,
                                    );
                                    notify(smsOutcomeMessage(smsRes.result));
                                  } else {
                                    await share(text, "Safe return check-in");
                                    notify(
                                      "Share opened. Verify your message was sent — TrailSafe cannot verify delivery.",
                                    );
                                  }
                                },
                              });
                            },
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
          );
        })}
      </View>
    </Screen>
  );
}
