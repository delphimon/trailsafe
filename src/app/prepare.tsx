import { View, Linking } from "react-native";
import { router } from "expo-router";
import { ClipboardList, ExternalLink } from "lucide-react-native";
import library from "@/content/library.json";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import {
  Button,
  Card,
  Checkbox,
  Chip,
  Heading,
  Kicker,
  Note,
  Row,
  Screen,
  T,
  s,
} from "@/components/trailsafe/ui";
export default function Prepare() {
  const { data, update, ready, error } = useStore(),
    { run, setDialog } = useApp();
  const toggle = (key: string) =>
    void run(() =>
      update((d) => ({
        ...d,
        checks: d.checks.includes(key)
          ? d.checks.filter((k) => k !== key)
          : [...d.checks, key],
      })),
    );
  const addon = library.ADD_ONS[data.tripType];
  return (
    <Screen
      title="Before You Go"
      subtitle="Essentials, phone readiness, and trip prep"
    >
      <Row
        title="Leave a Trip Plan"
        subtitle="Do this before you leave coverage"
        icon={ClipboardList}
        onPress={() => router.push("/plans")}
      />
      <Kicker>Trip type</Kicker>
      <View style={s.wrap}>
        {(["day", "overnight", "winter"] as const).map((t, i) => (
          <Chip
            key={t}
            label={["Day hike", "Overnight", "Winter"][i]}
            selected={data.tripType === t}
            onPress={() =>
              void run(() => update((d) => ({ ...d, tripType: t })))
            }
          />
        ))}
      </View>
      <View style={{ marginTop: 12 }}>
        <Note>
          This isn’t an exhaustive gear list — just the Ten Essentials plus a
          few reminders specific to your trip type.
        </Note>
      </View>
      {(!ready || error) && <Note>{error || "Loading saved checklist…"}</Note>}
      <Kicker>
        Ten Essentials ·{" "}
        {data.checks.filter((k) => k.startsWith("ess-")).length}/
        {library.ESSENTIALS.length}
      </Kicker>
      <Card style={{ paddingVertical: 0 }}>
        {library.ESSENTIALS.map((e, i) => (
          <Checkbox
            key={e[0]}
            label={e[0]}
            description={e[1]}
            checked={data.checks.includes(`ess-${i}`)}
            onPress={() => toggle(`ess-${i}`)}
          />
        ))}
      </Card>
      <Card>
        <Heading>{addon.title}</Heading>
        {addon.items.map((item, i) => (
          <Checkbox
            key={item}
            label={item}
            checked={data.checks.includes(`${data.tripType}-${i}`)}
            onPress={() => toggle(`${data.tripType}-${i}`)}
          />
        ))}
        <Checkbox
          label="Food for the trip, plus extra for a delay"
          checked={data.checks.includes("food")}
          onPress={() => toggle("food")}
        />
      </Card>
      <Kicker>Phone & communications readiness</Kicker>
      <Card style={{ paddingVertical: 0 }}>
        {library.PHONE_CHECKLIST.map((item, i) => (
          <Checkbox
            key={item}
            label={item}
            checked={data.checks.includes(`phone-${i}`)}
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
            onConfirm: () => update((d) => ({ ...d, checks: [] })),
          })
        }
      />
      <Kicker>Trusted contact instructions</Kicker>
      <Card>
        <Heading>Give this to someone at home</Heading>
        <T>
          Your Trip Plan writes out exactly when to worry and when to call 911.
          Whoever’s holding your plan shouldn’t need this app at all.
        </T>
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
