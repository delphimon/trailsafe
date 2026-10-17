import { useState } from "react";
import { View, Linking } from "react-native";
import { ExternalLink } from "@/components/trailsafe/icons";
import library from "@/content/library.json";
import { WASHINGTON_REGION } from "@/content/regions";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import { toggleChecklist } from "@/lib/checklist";
import {
  Button,
  Callout,
  Card,
  Checkbox,
  Chip,
  Heading,
  Kicker,
  Note,
  Row,
  Screen,
  useThemeStyles,
} from "@/components/trailsafe/ui";
export default function Prepare() {
  const { s } = useThemeStyles();
  const [mountedAt] = useState(() => Date.now());
  const { data, update, ready, error } = useStore(),
    { run, setDialog } = useApp();
  const toggle = (key: string) =>
    void run(() =>
      update((d) => ({
        ...d,
        checklist: toggleChecklist(d, key),
      })),
    );

  const baseAddon = library.ADD_ONS[data.tripDuration];
  const winterAddon = data.winterConditions ? library.ADD_ONS["winter"] : null;
  const currentPlan = data.plans.find((p) => p.status === "current");

  const isStale =
    data.checklist.checks.length > 0 &&
    ((currentPlan && data.checklist.planId !== currentPlan.id) ||
      (!currentPlan &&
        mountedAt - data.checklist.updatedAt > 7 * 24 * 60 * 60 * 1000));

  return (
    <Screen title="Prepare" subtitle="Ten Essentials and the gear to bring">
      {isStale && (
        <View style={{ marginBottom: 12 }}>
          <Callout title="Checklist may be from a previous trip">
            This checklist was started a while ago or belongs to an older trip
            plan.
            <View style={{ marginTop: 10 }}>
              <Button
                label="Start Fresh"
                small
                onPress={() =>
                  void run(() =>
                    update((d) => ({
                      ...d,
                      checklist: {
                        checks: [],
                        startedAt: Date.now(),
                        updatedAt: Date.now(),
                        planId: d.plans.find((p) => p.status === "current")?.id,
                      },
                    })),
                  )
                }
              />
            </View>
          </Callout>
        </View>
      )}

      <Kicker>Duration</Kicker>
      <View style={s.wrap}>
        <Chip
          label="Day hike"
          selected={data.tripDuration === "day"}
          onPress={() =>
            void run(() => update((d) => ({ ...d, tripDuration: "day" })))
          }
        />
        <Chip
          label="Overnight"
          selected={data.tripDuration === "overnight"}
          onPress={() =>
            void run(() => update((d) => ({ ...d, tripDuration: "overnight" })))
          }
        />
      </View>
      <View style={{ marginTop: 8 }}>
        <Checkbox
          label="Winter / snow conditions"
          description="Adds traction, insulation, and avalanche gear reminders"
          checked={data.winterConditions}
          onPress={() =>
            void run(() =>
              update((d) => ({ ...d, winterConditions: !d.winterConditions })),
            )
          }
        />
      </View>
      <View style={{ marginTop: 12 }}>
        <Note>
          This isn’t an exhaustive gear list — just the Ten Essentials plus a
          few reminders specific to your trip type.
        </Note>
        <Callout title="Why this matters">
          Lower-extremity injuries, inadequate lighting, insufficient water, and
          inadequate layers are common reasons ordinary outings turn into
          rescues.
        </Callout>
      </View>
      {(!ready || error) && <Note>{error || "Loading saved checklist…"}</Note>}
      <Kicker>
        Ten Essentials ·{" "}
        {
          library.ESSENTIALS.filter((e) =>
            data.checklist.checks.includes(`essential:${e[0]}`),
          ).length
        }
        /{library.ESSENTIALS.length}
      </Kicker>
      <Card style={{ paddingVertical: 0 }}>
        {library.ESSENTIALS.map((e) => (
          <Checkbox
            key={e[0]}
            label={e[0]}
            description={e[1]}
            checked={data.checklist.checks.includes(`essential:${e[0]}`)}
            onPress={() => toggle(`essential:${e[0]}`)}
          />
        ))}
      </Card>
      <Card>
        {baseAddon.items.length > 0 && (
          <>
            <Heading>{baseAddon.title}</Heading>
            {baseAddon.items.map((item) => {
              const key = `addon:${data.tripDuration}:${item}`;
              return (
                <Checkbox
                  key={item}
                  label={item}
                  checked={data.checklist.checks.includes(key)}
                  onPress={() => toggle(key)}
                />
              );
            })}
          </>
        )}
        {winterAddon && (
          <>
            <View style={{ marginTop: 16 }}>
              <Heading>{winterAddon.title}</Heading>
            </View>
            {winterAddon.items.map((item) => {
              const key = `addon:winter:${item}`;
              return (
                <Checkbox
                  key={item}
                  label={item}
                  checked={data.checklist.checks.includes(key)}
                  onPress={() => toggle(key)}
                />
              );
            })}
          </>
        )}
        <Checkbox
          label="Communications: charged phone and a backup way to reach help"
          checked={data.checklist.checks.includes("communication")}
          onPress={() => toggle("communication")}
        />
      </Card>
      <Kicker>Phone & communications readiness</Kicker>
      <Card style={{ paddingVertical: 0 }}>
        {library.PHONE_CHECKLIST.map((item) => {
          const key = `phone:${item}`;
          return (
            <Checkbox
              key={item}
              label={item}
              checked={data.checklist.checks.includes(key)}
              onPress={() => toggle(key)}
            />
          );
        })}
      </Card>
      <Button
        label="Reset checklist for a new trip"
        variant="ghost"
        onPress={() =>
          setDialog({
            title: "Reset checklist?",
            message:
              "This clears the checked items for your next outing. Your saved trip plans stay available.",
            confirmLabel: "Reset checklist",
            onConfirm: () =>
              update((d) => ({
                ...d,
                checklist: {
                  checks: [],
                  startedAt: Date.now(),
                  updatedAt: Date.now(),
                  planId: d.plans.find((p) => p.status === "current")?.id,
                },
              })),
          })
        }
      />
      <Kicker>Know before you go</Kicker>
      <Card>
        {WASHINGTON_REGION.resources
          .filter((r) => r.cat === "conditions" || r.cat === "wildlife")
          .map((r) => (
            <Row
              key={r.url}
              title={r.name}
              subtitle={r.note}
              icon={ExternalLink}
              onPress={() => void run(() => Linking.openURL(r.url))}
            />
          ))}
      </Card>
      <Note>
        These links need Internet and open your browser. TrailSafe doesn’t fetch
        or store live conditions.
      </Note>
    </Screen>
  );
}
