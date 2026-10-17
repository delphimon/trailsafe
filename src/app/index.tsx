import { useRouter } from "expo-router";
import { ClipboardList, Compass, Backpack } from "@/components/trailsafe/icons";
import { useStore } from "@/state/store";
import {
  Button,
  Card,
  Heading,
  Note,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
export default function Home() {
  const router = useRouter();
  const { data, ready, error } = useStore();
  const current = data.plans.find((p) => p.status === "current");
  return (
    <Screen
      title="TrailSafe"
      subtitle="Ready for the trail. Help when you need it."
    >
      <Button
        label="NEED HELP?"
        variant="orange"
        onPress={() => router.navigate("/emergency")}
      />
      <Card style={{ marginTop: 16 }}>
        <Heading>{current ? "Your current trip" : "Your trip plans"}</Heading>
        {current && (
          <T style={{ marginVertical: 10 }}>
            {current.title || "Untitled trip"} · Back {current.returnDate} at{" "}
            {current.returnTime}
          </T>
        )}
        {!current && (
          <Note>Current, upcoming and past trips, saved on your device.</Note>
        )}
        {current && (
          <Button
            label="Open current trip"
            onPress={() =>
              router.push({
                pathname: "/plans/[id]",
                params: { id: current.id },
              })
            }
          />
        )}
        <Row
          title="All trip plans"
          subtitle={
            ready
              ? `${data.plans.length} saved · Create, review and share`
              : "Loading saved trips…"
          }
          icon={Backpack}
          onPress={() => router.navigate("/plans")}
        />
        {error && <Note>{error}</Note>}
      </Card>
      <Row
        title="Pack the essentials"
        subtitle="Ten Essentials and gear for your trip"
        icon={ClipboardList}
        onPress={() => router.navigate("/prepare")}
      />
      <Heading>Useful on the trail</Heading>
      {(
        [
          {
            title: "When will I need a headlamp?",
            subtitle: "Daylight for your location",
            tool: "daylight",
          },
          {
            title: "Compass declination",
            subtitle: "Adjust for true north",
            tool: "compass",
          },
          {
            title: "Estimate hiking time",
            subtitle: "Quick distance and elevation sliders",
            tool: "hiking",
          },
        ] as const
      ).map((item) => (
        <Row
          key={item.tool}
          title={item.title}
          subtitle={item.subtitle}
          icon={Compass}
          onPress={() =>
            router.navigate({ pathname: "/tools", params: { tool: item.tool } })
          }
        />
      ))}
      <Note>
        Guides, saved plans and tools work offline. Share your trip plan before
        leaving coverage; TrailSafe does not monitor trips.
      </Note>
    </Screen>
  );
}
