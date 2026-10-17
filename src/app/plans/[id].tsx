import { useState, useCallback } from "react";
import { View, Platform } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  MessageSquare,
  Share2,
} from "lucide-react-native";
import { DateTimeField } from "@/components/trailsafe/date-time-field";
import * as SMS from "expo-sms";
import { useStore } from "@/state/store";
import { smsOutcomeMessage } from "@/lib/emergency";
import { useApp } from "@/state/app";
import {
  TripPlan,
  addDays,
  buildPlanText,
  buildSafeReturnDraft,
  dateTimeInZone,
  isValidTimeZone,
  roundedDateTimeInZone,
  localDate,
  newPlan,
  saveTrip,
  suggestOverdue,
  validatePlan,
} from "@/lib/plans";
import { US_TIME_ZONES } from "@/content/regions";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { exportPlan } from "@/lib/export-plan";
import {
  Button,
  Callout,
  Card,
  Checkbox,
  Chip,
  Field,
  Kicker,
  Note,
  Screen,
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";

export default function PlanScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { data, ready, error } = useStore();
  if (!ready)
    return (
      <Screen title="Trip Plan" back>
        <T>Loading saved details…</T>
      </Screen>
    );
  if (error)
    return (
      <Screen title="Trip Plan" back>
        <Callout critical>{error}</Callout>
      </Screen>
    );
  const existing = id === "new" ? null : data.plans.find((p) => p.id === id);
  if (id !== "new" && !existing)
    return (
      <Screen title="Plan not found" back>
        <Button
          label="Back to Trip Plans"
          onPress={() => router.replace("/plans")}
        />
      </Screen>
    );
  if (id === "new") return <NewPlanEditor />;
  return (
    <PlanEditor
      key={`${id}-${edit || ""}`}
      initial={existing!}
      isNew={id === "new"}
      editInitially={id === "new" || edit === "1"}
    />
  );
}
function NewPlanEditor() {
  const { data } = useStore();
  const [initial] = useState(() => newPlan(data.profile));
  return <PlanEditor initial={initial} isNew editInitially />;
}
function PlanEditor({
  initial,
  isNew,
  editInitially,
}: {
  initial: TripPlan;
  isNew: boolean;
  editInitially: boolean;
}) {
  const { C, s } = useThemeStyles();
  const { data, changeTrip, reminderStatus } = useStore();
  const { run, copy, share, notify, setDialog } = useApp();
  const [plan, setPlan] = useState(initial),
    [editing, setEditing] = useState(editInitially),
    [additional, setAdditional] = useState(false),
    [errors, setErrors] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  const savedPlan = data.plans.find((p) => p.id === plan.id) ?? initial;
  const dirty = editing && JSON.stringify(plan) !== JSON.stringify(savedPlan);
  const discard = useCallback(() => setPlan(savedPlan), [savedPlan]);
  const allowNavigation = useUnsavedChanges(
    dirty,
    discard,
    "Save your plan before leaving to keep these changes.",
  );
  const today = dateTimeInZone(plan.timeZone)?.date;
  const changeStart = (date: string, time?: string) => {
    setPlan((p) => {
      const returnDate =
        !p.returnDate || p.returnDate < date ? date : p.returnDate;
      return {
        ...p,
        date,
        startTime: time ?? p.startTime,
        returnDate,
        overdueDate:
          !p.overdueDate || p.overdueDate < returnDate
            ? returnDate
            : p.overdueDate,
      };
    });
    setErrors([]);
  };
  const applyDateShortcut = (days: number, now = false) => {
    const stamp = now
      ? roundedDateTimeInZone(plan.timeZone)
      : dateTimeInZone(plan.timeZone);
    if (!stamp) {
      setErrors(["Enter a valid IANA time zone before using date shortcuts."]);
      return;
    }
    changeStart(addDays(stamp.date, days), now ? stamp.time : undefined);
  };
  const sendSafeReturn = async () => {
    const text = buildSafeReturnDraft(plan);
    const targetPhone = plan.trustedContactPhone
      ? [plan.trustedContactPhone]
      : [];
    if (await SMS.isAvailableAsync()) {
      const res = await SMS.sendSMSAsync(targetPhone, text);
      notify(smsOutcomeMessage(res.result));
    } else {
      await share(text, "Safe return check-in");
      notify(
        "Safe-return draft opened in share sheet. Verify sending; TrailSafe cannot verify delivery.",
      );
    }
  };
  const change = <K extends keyof TripPlan>(key: K, value: TripPlan[K]) => {
    setPlan((p) => ({ ...p, [key]: value }));
    setErrors([]);
  };
  const save = async (status = plan.status): Promise<TripPlan | null> => {
    const saved = await changeTrip((plans) => saveTrip(plan, plans, status));
    setPlan(saved);
    allowNavigation();
    return saved;
  };
  const action = (fn: () => Promise<unknown>) =>
    void run(async () => {
      setBusy(true);
      try {
        await fn();
      } finally {
        setBusy(false);
      }
    });
  const field = (
    key: keyof TripPlan,
    label: string,
    placeholder?: string,
    multiline = false,
    hint?: string,
  ) => (
    <Field
      key={key}
      label={label}
      placeholder={placeholder}
      value={String(plan[key])}
      multiline={multiline}
      hint={hint}
      onChangeText={(text) => change(key, text as never)}
      keyboardType={
        key === "partySize"
          ? "number-pad"
          : key.includes("Phone")
            ? "phone-pad"
            : "default"
      }
      autoCapitalize={/Date|Time|date/.test(key) ? "none" : "sentences"}
    />
  );
  const dateTime = (
    dateKey: "date" | "returnDate" | "overdueDate",
    timeKey: "startTime" | "returnTime" | "overdueTime",
    dateLabel: string,
    timeLabel: string,
  ) => (
    <View style={Platform.OS === "web" ? s.flexRow : { gap: 0 }}>
      <View style={{ flex: 1.15 }}>
        <DateTimeField
          label={dateLabel}
          value={plan[dateKey]}
          mode="date"
          timeZone={plan.timeZone}
          onChange={(value) => change(dateKey, value)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <DateTimeField
          label={timeLabel}
          value={plan[timeKey]}
          mode="time"
          timeZone={plan.timeZone}
          referenceDate={plan[dateKey] || plan.date}
          onChange={(value) => change(timeKey, value)}
        />
      </View>
    </View>
  );
  return (
    <Screen
      key={editing ? "editor" : "preview"}
      title={
        isNew
          ? "New Trip Plan"
          : editing
            ? "Edit Trip Plan"
            : plan.title || "Trip Plan"
      }
      subtitle={
        editing
          ? "Leave useful information with someone at home"
          : "Your plan, ready to share"
      }
      back
    >
      {reminderStatus === "denied" ||
      reminderStatus === "failed" ||
      reminderStatus === "unavailable" ? (
        <Callout title="Local reminders">
          {reminderStatus === "denied"
            ? "Notifications are not permitted. Enable them in device settings if you want local reminders."
            : reminderStatus === "unavailable"
              ? "Local reminders are unavailable in this browser."
              : "Could not reconcile local reminders. Check notification settings and reopen the app to retry."}{" "}
          Your saved plan is unaffected. No one is notified automatically.
        </Callout>
      ) : null}
      <Stack.Screen options={{ gestureEnabled: !dirty }} />
      {!editing ? (
        <>
          <Callout title="Share before you leave coverage">
            A plan stored only on your phone cannot help the person waiting for
            you at home. Share changes directly; existing copies do not update
            automatically.
          </Callout>
          {plan.revision > 1 && (
            <Note>
              This is an updated plan. Send the new copy to your trusted
              contact.
            </Note>
          )}
          <Note>
            Saved on this device · {plan.status} · Revision {plan.revision}
          </Note>
          <Card>
            <T
              selectable
              testID="plan-preview"
              style={{ fontSize: 13, lineHeight: 22 }}
            >
              {buildPlanText(plan)}
            </T>
          </Card>
          <Button
            label={busy ? "Working…" : "Share Trip Plan Now"}
            icon={Share2}
            disabled={busy}
            onPress={() => action(() => share(buildPlanText(plan), plan.title))}
          />
          <View style={[s.flexRow, { marginVertical: 10 }]}>
            <View style={{ flex: 1 }}>
              <Button
                label="Copy Text"
                icon={Copy}
                small
                variant="outline"
                disabled={busy}
                onPress={() => action(() => copy(buildPlanText(plan)))}
              />
            </View>
          </View>
          <Button
            label="Print / Save as PDF"
            icon={FileDown}
            variant="ghost"
            disabled={busy}
            onPress={() => action(() => exportPlan(plan))}
          />
          <View style={{ marginTop: 10 }}>
            <Button
              label="Edit Details"
              variant="outline"
              disabled={busy}
              onPress={() => setEditing(true)}
            />
          </View>
          {plan.status === "current" && (
            <>
              <View style={{ marginTop: 10 }}>
                <Button
                  label="Open Safe-Return Text"
                  icon={MessageSquare}
                  variant="orange"
                  disabled={busy}
                  onPress={() => action(() => sendSafeReturn())}
                />
              </View>
              <View style={{ marginTop: 10 }}>
                <Button
                  label="Complete Trip Plan"
                  variant="outline"
                  disabled={busy}
                  onPress={() =>
                    action(async () => {
                      const saved = await save("completed");
                      if (!saved) return;
                      notify("Plan marked complete locally.");
                      setDialog({
                        title: "Trip completed locally",
                        message:
                          "This marks your trip complete on your phone, but it does not contact anyone. Open a safe-return text to let your trusted contact know you returned safely.",
                        confirmLabel: "Open Safe-Return Text",
                        onConfirm: sendSafeReturn,
                      });
                    })
                  }
                />
              </View>
            </>
          )}
          {plan.status === "completed" && (
            <View style={{ marginTop: 10 }}>
              <Button
                label="Open Safe-Return Text"
                icon={MessageSquare}
                variant="primary"
                disabled={busy}
                onPress={() => action(() => sendSafeReturn())}
              />
            </View>
          )}
          {plan.status !== "current" && plan.status !== "completed" && (
            <View style={{ marginTop: 10 }}>
              <Button
                label="Mark as Current"
                disabled={busy}
                onPress={() => {
                  const issues = validatePlan({ ...plan, status: "current" });
                  if (issues.length) {
                    setErrors(issues);
                    setEditing(true);
                    return;
                  }
                  const existingCurrent = data.plans.find(
                    (p) => p.status === "current" && p.id !== plan.id,
                  );
                  const performSave = () => {
                    action(async () => {
                      const saved = await save("current");
                      if (saved) {
                        notify(
                          "Current plan saved. Share it with your contact.",
                        );
                      }
                    });
                  };
                  if (existingCurrent) {
                    setDialog({
                      title: "Replace current trip?",
                      message: `${existingCurrent.title || "Another trip"} is currently marked Current. Starting ${plan.title || "this trip"} will make it a Draft again. No one will be notified automatically.`,
                      confirmLabel: `Make ${plan.title || "Current"}`,
                      onConfirm: () => {
                        setDialog(null);
                        performSave();
                      },
                    });
                  } else {
                    performSave();
                  }
                }}
              />
            </View>
          )}
          <View style={{ marginTop: 14 }}>
            <Note>
              Opening a share sheet does not confirm delivery. Verify that your
              contact has the plan.
            </Note>
          </View>
        </>
      ) : (
        <>
          <Note>
            Changes are saved when you tap Save. Use Save Draft to keep an
            unfinished plan.
          </Note>
          <Kicker>Trip</Kicker>
          {field("title", "Trip title / destination", "Granite Mountain")}
          <View style={s.flexRow}>
            <View style={{ flex: 1.4 }}>
              {field("travelerName", "Your name", "Name")}
            </View>
            <View style={{ flex: 1 }}>
              {field("partySize", "Party size", "2")}
            </View>
          </View>
          {field(
            "travelerPhone",
            "Phone / contact method",
            "Include country or area code",
          )}
          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <Kicker>Trusted Contact</Kicker>
            <Note>
              This is the person receiving your trip plan and expecting you to
              check in.
            </Note>
          </View>
          {field("trustedContactName", "Contact name", "Name")}
          {field(
            "trustedContactPhone",
            "Contact phone",
            "Include country or area code",
          )}
          {field(
            "trailhead",
            "Starting location / trailhead",
            "Granite Mountain Trailhead, King County",
          )}
          {field(
            "route",
            "Planned route",
            "Granite Mountain Trail to summit and return by the same route",
            true,
          )}
          {field(
            "backup",
            "Backup / turnaround plan",
            "Turn around by 13:00 if not at summit",
          )}
          <Kicker>Timing</Kicker>
          {field(
            "timeZone",
            "Trip time zone",
            "America/Los_Angeles",
            false,
            "Select a US time zone below or enter any IANA zone (e.g. America/Los_Angeles)",
          )}
          <View style={[s.wrap, { marginTop: -6, marginBottom: 10 }]}>
            {US_TIME_ZONES.map((tz) => (
              <Chip
                key={tz.id}
                label={tz.label}
                selected={plan.timeZone.trim() === tz.id}
                onPress={() => change("timeZone", tz.id)}
              />
            ))}
          </View>
          <Note>
            All times are in {plan.timeZone}. Dates are explicit so overnight
            trips and overdue times stay unambiguous.
          </Note>
          <View style={{ marginTop: 14 }}>
            {dateTime("date", "startTime", "Start date", "Start time")}
            <View style={[s.wrap, { marginTop: -6, marginBottom: 16 }]}>
              <Chip
                label="Today"
                selected={plan.date === today}
                onPress={() => applyDateShortcut(0)}
              />
              <Chip
                label="Tomorrow"
                selected={!!today && plan.date === addDays(today, 1)}
                onPress={() => applyDateShortcut(1)}
              />
              <Chip
                label="Now"
                selected={false}
                onPress={() => applyDateShortcut(0, true)}
              />
              <Chip
                label="07:00"
                selected={plan.startTime === "07:00"}
                onPress={() => change("startTime", "07:00")}
              />
              <Chip
                label="08:00"
                selected={plan.startTime === "08:00"}
                onPress={() => change("startTime", "08:00")}
              />
              <Chip
                label="09:00"
                selected={plan.startTime === "09:00"}
                onPress={() => change("startTime", "09:00")}
              />
            </View>
            {dateTime(
              "returnDate",
              "returnTime",
              "Return date",
              "Expected return",
            )}
            <View style={[s.wrap, { marginTop: -6, marginBottom: 16 }]}>
              <Chip
                label="Same day"
                selected={plan.returnDate === (plan.date || localDate())}
                onPress={() => {
                  const d = plan.date || localDate();
                  change("returnDate", d);
                  if (plan.returnTime && !plan.overdueTime) {
                    const sug = suggestOverdue(
                      d,
                      plan.returnTime,
                      2,
                      plan.timeZone,
                    );
                    if (sug) setPlan((p) => ({ ...p, returnDate: d, ...sug }));
                  }
                }}
              />
              <Chip
                label="Tomorrow"
                selected={
                  plan.returnDate === addDays(plan.date || localDate(), 1)
                }
                onPress={() => {
                  const d = addDays(plan.date || localDate(), 1);
                  change("returnDate", d);
                  if (plan.returnTime && !plan.overdueTime) {
                    const sug = suggestOverdue(
                      d,
                      plan.returnTime,
                      2,
                      plan.timeZone,
                    );
                    if (sug) setPlan((p) => ({ ...p, returnDate: d, ...sug }));
                  }
                }}
              />
              <Chip
                label="+2 days"
                selected={
                  plan.returnDate === addDays(plan.date || localDate(), 2)
                }
                onPress={() => {
                  const d = addDays(plan.date || localDate(), 2);
                  change("returnDate", d);
                  if (plan.returnTime && !plan.overdueTime) {
                    const sug = suggestOverdue(
                      d,
                      plan.returnTime,
                      2,
                      plan.timeZone,
                    );
                    if (sug) setPlan((p) => ({ ...p, returnDate: d, ...sug }));
                  }
                }}
              />
              <Chip
                label="16:00 (4 PM)"
                selected={plan.returnTime === "16:00"}
                onPress={() => {
                  const rDate = plan.returnDate || plan.date || localDate();
                  const sug = suggestOverdue(rDate, "16:00", 2, plan.timeZone);
                  setPlan((p) => ({
                    ...p,
                    returnDate: rDate,
                    returnTime: "16:00",
                    ...(!p.overdueTime && sug ? sug : {}),
                  }));
                }}
              />
              <Chip
                label="17:00 (5 PM)"
                selected={plan.returnTime === "17:00"}
                onPress={() => {
                  const rDate = plan.returnDate || plan.date || localDate();
                  const sug = suggestOverdue(rDate, "17:00", 2, plan.timeZone);
                  setPlan((p) => ({
                    ...p,
                    returnDate: rDate,
                    returnTime: "17:00",
                    ...(!p.overdueTime && sug ? sug : {}),
                  }));
                }}
              />
              <Chip
                label="18:00 (6 PM)"
                selected={plan.returnTime === "18:00"}
                onPress={() => {
                  const rDate = plan.returnDate || plan.date || localDate();
                  const sug = suggestOverdue(rDate, "18:00", 2, plan.timeZone);
                  setPlan((p) => ({
                    ...p,
                    returnDate: rDate,
                    returnTime: "18:00",
                    ...(!p.overdueTime && sug ? sug : {}),
                  }));
                }}
              />
              <Chip
                label="19:00 (7 PM)"
                selected={plan.returnTime === "19:00"}
                onPress={() => {
                  const rDate = plan.returnDate || plan.date || localDate();
                  const sug = suggestOverdue(rDate, "19:00", 2, plan.timeZone);
                  setPlan((p) => ({
                    ...p,
                    returnDate: rDate,
                    returnTime: "19:00",
                    ...(!p.overdueTime && sug ? sug : {}),
                  }));
                }}
              />
            </View>
          </View>
          <Callout title="Expected return vs. overdue time">
            Expected return is when you think you’ll be back. “If you have not
            heard from me by” is when your contact should treat this as
            genuinely overdue and start the steps in your plan.
          </Callout>
          {dateTime(
            "overdueDate",
            "overdueTime",
            "Overdue date",
            "If no contact by",
          )}
          <View style={[s.wrap, { marginTop: -6, marginBottom: 12 }]}>
            {[
              { label: "+2 hours", hours: 2 },
              { label: "+3 hours", hours: 3 },
              { label: "+4 hours", hours: 4 },
            ].map(({ label, hours }) => (
              <Chip
                key={label}
                label={label}
                selected={false}
                onPress={() => {
                  const rDate = plan.returnDate || plan.date;
                  const rTime = plan.returnTime;
                  if (!rDate || !rTime) {
                    setErrors(["Set expected return date and time first."]);
                    return;
                  }
                  const sug = suggestOverdue(
                    rDate,
                    rTime,
                    hours,
                    plan.timeZone,
                  );
                  if (sug) {
                    setPlan((p) => ({ ...p, ...sug }));
                    setErrors([]);
                  }
                }}
              />
            ))}
            <Chip
              label="Next morning (08:00)"
              selected={false}
              onPress={() => {
                const rDate = plan.returnDate || plan.date;
                if (!rDate) {
                  setErrors(["Set expected return date first."]);
                  return;
                }
                const nextDate = addDays(rDate, 1);
                setPlan((p) => ({
                  ...p,
                  overdueDate: nextDate,
                  overdueTime: "08:00",
                }));
                setErrors([]);
              }}
            />
          </View>
          <View style={{ marginVertical: 12 }}>
            <Button
              label="Suggest: expected return + 2 hours"
              small
              variant="ghost"
              onPress={() => {
                const suggested = suggestOverdue(
                  plan.returnDate,
                  plan.returnTime,
                  2,
                  plan.timeZone,
                );
                if (!suggested) {
                  setErrors([
                    "Set a valid expected return date and time first.",
                  ]);
                  return;
                }
                setPlan((p) => ({ ...p, ...suggested }));
              }}
            />
          </View>
          <Checkbox
            label="Remind me on this device when check-in time passes"
            description="Schedules a local notification on your phone at your expected return and overdue times. This does NOT notify emergency contacts or 911."
            checked={plan.remind}
            onPress={() => change("remind", !plan.remind)}
          />
          <Kicker>Vehicle (recommended)</Kicker>
          {(() => {
            const car1Desc = data.profile.vehicle.trim();
            const car1Plate = data.profile.plate.trim();
            const hasCar1 = Boolean(car1Desc || car1Plate);

            const car2Desc = data.profile.vehicle2?.trim() ?? "";
            const car2Plate = data.profile.plate2?.trim() ?? "";
            const hasCar2 = Boolean(car2Desc || car2Plate);

            const hasSavedCars = hasCar1 || hasCar2;
            const isCar1Selected =
              hasCar1 &&
              plan.vehicle.trim() === car1Desc &&
              plan.plate.trim() === car1Plate;
            const isCar2Selected =
              hasCar2 &&
              plan.vehicle.trim() === car2Desc &&
              plan.plate.trim() === car2Plate;

            const formatLabel = (num: number, desc: string, plate: string) => {
              const main = desc || plate;
              const truncated =
                main.length > 20 ? `${main.slice(0, 18)}…` : main;
              return `Car ${num}: ${truncated}`;
            };

            if (!hasSavedCars) {
              return (
                <View style={{ marginBottom: 10 }}>
                  <Note>
                    Tip: Save up to two vehicles in My Profile to quickly select
                    between them here.
                  </Note>
                </View>
              );
            }

            return (
              <View style={{ marginBottom: 14 }}>
                <T style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
                  Select vehicle for this trip:
                </T>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {hasCar1 && (
                    <Chip
                      label={formatLabel(1, car1Desc, car1Plate)}
                      selected={isCar1Selected}
                      onPress={() => {
                        setPlan((p) => ({
                          ...p,
                          vehicle: data.profile.vehicle,
                          plate: data.profile.plate,
                        }));
                        setErrors([]);
                      }}
                    />
                  )}
                  {hasCar2 && (
                    <Chip
                      label={formatLabel(2, car2Desc, car2Plate)}
                      selected={isCar2Selected}
                      onPress={() => {
                        setPlan((p) => ({
                          ...p,
                          vehicle: data.profile.vehicle2,
                          plate: data.profile.plate2,
                        }));
                        setErrors([]);
                      }}
                    />
                  )}
                </View>
              </View>
            );
          })()}
          {field("vehicle", "Vehicle color, make, model", "Blue Rivian R1S")}
          {field("plate", "License plate and state", "WA ABC123")}
          <Kicker>Communications carried</Kicker>
          <View style={[s.wrap, { marginBottom: 22 }]}>
            {["Phone", "Satellite messenger", "PLB", "Radio", "Other"].map(
              (c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={plan.comms.includes(c)}
                  onPress={() =>
                    change(
                      "comms",
                      plan.comms.includes(c)
                        ? plan.comms.filter((x) => x !== c)
                        : [...plan.comms, c],
                    )
                  }
                />
              ),
            )}
          </View>
          <Button
            label="Additional SAR Details (optional)"
            icon={additional ? ChevronUp : ChevronDown}
            variant="ghost"
            onPress={() => setAdditional(!additional)}
          />
          {additional && (
            <View style={{ marginTop: 16 }}>
              {field(
                "members",
                "Party member names & ages",
                "One person per line",
                true,
              )}
              {field("allergies", "Allergies & medications", undefined, true)}
              {field("medical", "Relevant medical conditions", undefined, true)}
              {field("experience", "Experience level")}
              {field("outerwear", "Outerwear colors")}
              {field("shelter", "Tent / shelter color")}
              {field("boots", "Boot / shoe description")}
              {field("extraVehicles", "Additional vehicles")}
              {field("notes", "Other notes", undefined, true)}
            </View>
          )}
          <View style={{ marginTop: 20 }}>
            {errors.length > 0 && (
              <Callout critical title="Check these details">
                {errors.join("\n")}
              </Callout>
            )}
            <Button
              label={
                plan.status === "draft" ? "Save and preview" : "Save Changes"
              }
              disabled={busy}
              onPress={() => {
                const issues = validatePlan(plan);
                setErrors(issues);
                if (!issues.length)
                  action(async () => {
                    const saved = await save();
                    if (!saved) return;
                    setEditing(false);
                    notify("Plan saved on this device.");
                    if (isNew)
                      router.replace({
                        pathname: "/plans/[id]",
                        params: { id: saved.id },
                      });
                  });
              }}
            />
            <View style={{ marginTop: 10 }}>
              {plan.status === "draft" ? (
                <Button
                  label={busy ? "Saving…" : "Save Draft"}
                  variant="outline"
                  disabled={busy}
                  onPress={() => {
                    if (!isValidTimeZone(plan.timeZone)) {
                      setErrors([
                        "Enter a valid IANA time zone (for example, America/Los_Angeles).",
                      ]);
                      return;
                    }
                    action(async () => {
                      const saved = await save();
                      if (saved) {
                        setEditing(false);
                        notify("Plan saved on this device");
                        router.replace({
                          pathname: "/plans/[id]",
                          params: { id: saved.id },
                        });
                      }
                    });
                  }}
                />
              ) : (
                <Button
                  label="Cancel"
                  variant="outline"
                  disabled={busy}
                  onPress={() => {
                    setPlan(savedPlan);
                    setErrors([]);
                    setEditing(false);
                  }}
                />
              )}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
