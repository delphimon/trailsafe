import { router } from "expo-router";
import {
  Backpack,
  BookOpen,
  ClipboardList,
  Siren,
  ArrowUpRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  Button,
  C,
  Card,
  fonts,
  FooterNote,
  Kicker,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
import { useStore } from "@/state/store";
export default function Home() {
  const { data } = useStore();
  const plan = data.plans.find((p) => p.status === "current");
  return (
    <Screen title="TrailSafe" subtitle="King County Explorer Search & Rescue">
      <LinearGradient
        colors={["#25503F", "#132720"]}
        style={{
          borderRadius: 16,
          padding: 22,
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <Svg
          width="450"
          height="290"
          viewBox="0 0 450 290"
          style={{ position: "absolute", right: -65, top: -5 }}
          pointerEvents="none"
        >
          {Array.from({ length: 11 }, (_, i) => (
            <Path
              key={i}
              d={`M${180 + i * 9} -30 C ${410 + i * 8} ${20 + i * 6}, ${90 - i * 8} ${130 + i * 8}, ${410 + i * 7} ${300 + i * 4}`}
              fill="none"
              stroke="#AFCDBB"
              strokeOpacity={0.1}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
        <T
          style={{
            fontFamily: fonts.display,
            fontSize: 16,
            color: "#BFD3C6",
            letterSpacing: 2,
            marginBottom: 3,
          }}
        >
          KCESAR
        </T>
        <T
          style={{
            fontFamily: fonts.display,
            fontSize: 48,
            lineHeight: 55,
            color: "white",
            marginBottom: 12,
          }}
        >
          TrailSafe
        </T>
        <T
          style={{
            fontSize: 14,
            lineHeight: 22,
            color: "#D7E6DC",
            marginBottom: 22,
            maxWidth: 360,
          }}
        >
          Prepare for ordinary trips, know when to ask for help, and give
          rescuers what they need — even with no signal.
        </T>
        <Button
          label="NEED HELP?"
          icon={Siren}
          variant="orange"
          onPress={() => router.navigate("/emergency")}
        />
      </LinearGradient>
      <T
        accessibilityRole="header"
        style={{
          fontFamily: fonts.display,
          fontSize: 17,
          color: C.green,
          marginBottom: 2,
        }}
      >
        Get ready
      </T>
      <Row
        title="Leave a Trip Plan"
        subtitle="Give someone the information SAR would need"
        icon={ClipboardList}
        onPress={() => router.push("/plans")}
      />
      <Row
        title="Before You Go"
        subtitle="Essentials, phone readiness, and trip prep"
        icon={Backpack}
        onPress={() => router.navigate("/prepare")}
      />
      <Row
        title="Safety Guide"
        subtitle="What to do if you’re lost, hurt, stranded, or overdue"
        icon={BookOpen}
        onPress={() => router.navigate("/guide")}
      />
      {plan && (
        <>
          <Kicker>Your current plan</Kicker>
          <Card>
            <Row
              title={plan.title}
              subtitle={`${plan.date} · Expected back ${plan.returnTime}`}
              icon={ArrowUpRight}
              onPress={() =>
                router.push({
                  pathname: "/plans/[id]",
                  params: { id: plan.id },
                })
              }
            />
          </Card>
        </>
      )}
      <FooterNote />
    </Screen>
  );
}
