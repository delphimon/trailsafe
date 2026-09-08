import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  Share2,
} from "lucide-react-native";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import {
  TripPlan,
  buildPlanText,
  newPlan,
  suggestOverdue,
  validatePlan,
} from "@/lib/plans";
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
  Row,
  Screen,
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";

export default function PlanScreen() {
  const { C, s } = useThemeStyles();
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
  const { update } = useStore();
  const { run, copy, share, notify } = useApp();
  const [plan, setPlan] = useState(initial),
    [editing, setEditing] = useState(editInitially),
    [additional, setAdditional] = useState(false),
    [errors, setErrors] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  const change = <K extends keyof TripPlan>(key: K, value: TripPlan[K]) => {
    setPlan((p) => ({ ...p, [key]: value }));
    setErrors([]);
  };
  const save = async (status = plan.status) => {
    let saved = plan;
    await update((d) => {
      const previous = d.plans.find((p) => p.id === plan.id);
      saved = {
        ...plan,
        status,
        updatedAt: Date.now(),
        revision: previous ? previous.revision + 1 : 1,
      };
      return {
        ...d,
        plans: [...d.plans.filter((p) => p.id !== saved.id), saved],
      };
    });
    setPlan(saved);
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
          : key === "phone"
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
    <View style={s.flexRow}>
      <View style={{ flex: 1.15 }}>
        {field(dateKey, dateLabel, "YYYY-MM-DD", false, "YYYY-MM-DD")}
      </View>
      <View style={{ flex: 1 }}>
        {field(timeKey, timeLabel, "HH:MM", false, "24-hour time")}
      </View>
    </View>
  );
  return (
    <Screen
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
            onPress={() =>
              action(async () => {
                const saved = await save();
                await share(buildPlanText(saved), saved.title);
              })
            }
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
            <View style={{ flex: 1 }}>
              <Button
                label="Save Plan"
                small
                variant="outline"
                disabled={busy}
                onPress={() =>
                  action(async () => {
                    await save();
                    notify("Plan saved on this device");
                  })
                }
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
          {plan.status !== "current" && plan.status !== "completed" && (
            <View style={{ marginTop: 10 }}>
              <Button
                label="Mark as Current"
                disabled={busy}
                onPress={() => {
                  const issues = validatePlan(plan);
                  if (issues.length) {
                    setErrors(issues);
                    setEditing(true);
                    return;
                  }
                  action(async () => {
                    await save("current");
                    notify("Current plan saved. Share it with your contact.");
                  });
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
          <Kicker>Trip</Kicker>
          {field("title", "Trip title / destination", "Granite Mountain")}
          <View style={s.flexRow}>
            <View style={{ flex: 1.4 }}>
              {field("name", "Your name", "Name")}
            </View>
            <View style={{ flex: 1 }}>
              {field("partySize", "Party size", "2")}
            </View>
          </View>
          {field(
            "phone",
            "Phone / contact method",
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
          <Note>
            All times are in {plan.timeZone}. Dates are explicit so overnight
            trips and overdue times stay unambiguous.
          </Note>
          <View style={{ marginTop: 14 }}>
            {dateTime("date", "startTime", "Start date", "Start time")}
            {dateTime(
              "returnDate",
              "returnTime",
              "Return date",
              "Expected return",
            )}
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
          <Note>
            Add time for ordinary delays without waiting so long that darkness,
            weather, cold, or a medical problem could get worse. Choose this
            time on purpose.
          </Note>
          <View style={{ marginVertical: 12 }}>
            <Button
              label="Suggest: expected return + 2 hours"
              small
              variant="ghost"
              onPress={() => {
                const suggested = suggestOverdue(
                  plan.returnDate,
                  plan.returnTime,
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
            label="Flag this plan when my check-in time passes"
            description="Shown in Trip Plans while this plan is Current. No background notification is sent, and nobody is contacted."
            checked={plan.remind}
            onPress={() => change("remind", !plan.remind)}
          />
          <Kicker>Vehicle (recommended)</Kicker>
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
              label="Generate Plan"
              disabled={busy}
              onPress={() => {
                const issues = validatePlan(plan);
                setErrors(issues);
                if (!issues.length) setEditing(false);
              }}
            />
            <View style={{ marginTop: 10 }}>
              <Button
                label={busy ? "Saving…" : "Save Draft"}
                variant="outline"
                disabled={busy}
                onPress={() =>
                  action(async () => {
                    const saved = await save("draft");
                    notify("Draft saved on this device");
                    router.replace({
                      pathname: "/plans/[id]",
                      params: { id: saved.id },
                    });
                  })
                }
              />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
