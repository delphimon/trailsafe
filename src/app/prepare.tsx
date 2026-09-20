import { View, Linking } from "react-native";
import { router } from "expo-router";
import { ClipboardList, ExternalLink } from "lucide-react-native";
import library from "@/content/library.json";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
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
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";
export default function Prepare() {
  const { s } = useThemeStyles();
  const { data, update, ready, error } = useStore(),
    { run, setDialog } = useApp();
  const toggle = (key: string) =>
    void run(() =>
      update((d) => ({
        ...d,
        checklist: {
          ...d.checklist,
          checks: d.checklist.checks.includes(key)
            ? d.checklist.checks.filter((k) => k !== key)
            : [...d.checklist.checks, key],
          updatedAt: Date.now(),
        },
      })),
    );
  
  const baseAddon = library.ADD_ONS[data.tripDuration];
  const winterAddon = data.winterConditions ? library.ADD_ONS["winter"] : null;
  const currentPlan = data.plans.find((p) => p.status === "current");


  const isStale = data.checklist.checks.length > 0 && (
    (currentPlan && data.checklist.planId !== currentPlan.id) ||
    (!currentPlan && Date.now() - data.checklist.updatedAt > 7 * 24 * 60 * 60 * 1000)
  );
  
  return (
    <Screen
      title="Before You Go"
      subtitle="Essentials, phone readiness, and trip prep"
    >
      {isStale && (
        <View style={{ marginBottom: 12 }}>
          <Callout title="Checklist may be from a previous trip" >
            This checklist was started a while ago or belongs to an older trip plan.
            <View style={{ marginTop: 10 }}>
              <Button
                label="Start Fresh"
                small
                onPress={() =>
                  void run(() =>
                    update((d) => ({
                      ...d,
                      checklist: { checks: [], startedAt: Date.now(), updatedAt: Date.now(), planId: currentPlan?.id },
                    }))
                  )
                }
              />
            </View>
          </Callout>
        </View>
      )}

      <Row
        title="Leave a Trip Plan"
        subtitle="Do this before you leave coverage"
        icon={ClipboardList}
        onPress={() => router.push("/plans")}
      />
      <Kicker>Duration</Kicker>
      <View style={s.wrap}>
        <Chip
          label="Day hike"
          selected={data.tripDuration === "day"}
          onPress={() => void run(() => update((d) => ({ ...d, tripDuration: "day" })))}
        />
        <Chip
          label="Overnight"
          selected={data.tripDuration === "overnight"}
          onPress={() => void run(() => update((d) => ({ ...d, tripDuration: "overnight" })))}
        />
      </View>
      <View style={{ marginTop: 8 }}>
        <Checkbox
          label="Winter / snow conditions"
          description="Adds traction, insulation, and avalanche gear reminders"
          checked={data.winterConditions}
          onPress={() => void run(() => update((d) => ({ ...d, winterConditions: !d.winterConditions })))}
        />
      </View>
      <View style={{ marginTop: 12 }}>
        <Note>
          This isn’t an exhaustive gear list — just the Ten Essentials plus a
          few reminders specific to your trip type.
        </Note>
        <Callout title="Why this matters">
          Lower-extremity injuries, inadequate lighting, insufficient water, and inadequate layers are common reasons ordinary outings turn into rescues.
        </Callout>
      </View>
      {(!ready || error) && <Note>{error || "Loading saved checklist…"}</Note>}
      <Kicker>
        Ten Essentials ·{" "}
        {data.checklist.checks.filter((k) => k.startsWith("ess-")).length}/
        {library.ESSENTIALS.length}
      </Kicker>
      <Card style={{ paddingVertical: 0 }}>
        {library.ESSENTIALS.map((e, i) => (
          <Checkbox
            key={e[0]}
            label={e[0]}
            description={e[1]}
            checked={data.checklist.checks.includes(`ess-${i}`)}
            onPress={() => toggle(`ess-${i}`)}
          />
        ))}
      </Card>
      <Card>
        {baseAddon.items.length > 0 && (
          <>
            <Heading>{baseAddon.title}</Heading>
            {baseAddon.items.map((item, i) => (
              <Checkbox
                key={item}
                label={item}
                checked={data.checklist.checks.includes(`${data.tripDuration}-${i}`)}
                onPress={() => toggle(`${data.tripDuration}-${i}`)}
              />
            ))}
          </>
        )}
        {winterAddon && (
          <>
            <View style={{ marginTop: 16 }}><Heading>{winterAddon.title}</Heading></View>
            {winterAddon.items.map((item, i) => (
              <Checkbox
                key={item}
                label={item}
                checked={data.checklist.checks.includes(`winter-${i}`)}
                onPress={() => toggle(`winter-${i}`)}
              />
            ))}
          </>
        )}
        <Checkbox
          label="Food for the trip, plus extra for a delay"
          checked={data.checklist.checks.includes("food")}
          onPress={() => toggle("food")}
        />
      </Card>
      <Kicker>Phone & communications readiness</Kicker>
      <Card style={{ paddingVertical: 0 }}>
        {library.PHONE_CHECKLIST.map((item, i) => (
          <Checkbox
            key={item}
            label={item}
            checked={data.checklist.checks.includes(`phone-${i}`)}
            onPress={() => toggle(`phone-${i}`)}
          />
        ))}
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
            onConfirm: () => update((d) => ({ ...d, checklist: { checks: [], startedAt: Date.now(), updatedAt: Date.now(), planId: currentPlan?.id } })),
          })
        }
      />
      <Kicker>Trusted contact</Kicker>
      <Card style={{ gap: 10 }}>
        <Heading>Share your plan before you go</Heading>
        <T style={s.note}>
          Your trip plan spells out exactly when to worry and when to call 911.
          Whoever holds it shouldn't need this app.
        </T>
        {currentPlan ? (
          <Button
            label={`Share: ${currentPlan.title || "Current Plan"}`}
            variant="primary"
            onPress={() => router.push({ pathname: "/plans/[id]", params: { id: currentPlan.id } })}
          />
        ) : (
          <Button
            label="Create a Trip Plan"
            variant="outline"
            onPress={() => router.push("/plans")}
          />
        )}
      </Card>
      <Kicker>Know before you go</Kicker>
      <Card>
        {library.RESOURCES.filter(
          (r) => r.cat === "conditions" || r.cat === "wildlife",
        ).map((r) => (
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
