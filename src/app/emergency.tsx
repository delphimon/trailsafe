import { Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  Clock,
  Compass,
  HeartPulse,
  Info,
  Mountain,
  Users,
  ShieldCheck,
} from "lucide-react-native";
import { useApp } from "@/state/app";
import {
  Button,
  useThemeStyles,
  Callout,
  fonts,
  Kicker,
  Note,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
import { EmergencyActions } from "@/components/trailsafe/emergency-actions";
import { LocationCard } from "@/components/trailsafe/location-card";
const choices = [
  { id: "g-lost", title: "Lost / off route", icon: Compass },
  { id: "g-injured", title: "Injured or sick", icon: HeartPulse },
  { id: "g-stranded", title: "Can’t continue / stranded", icon: Mountain },
  { id: "g-missing-split", title: "Someone missing / overdue", icon: Users },
  { id: "g-other", title: "Other emergency", icon: Info },
];
export default function Emergency() {
  const { C } = useThemeStyles();
  const { practice, setPractice } = useApp();
  return (
    <Screen title="Need Help?" subtitle="Call, text, and share your location">
      <EmergencyActions />
      <T
        style={{
          fontSize: 13,
          fontFamily: fonts.bold,
          textAlign: "center",
          color: C.orangeDark,
          marginTop: 12,
          marginBottom: 6,
        }}
      >
        Call if you can, text if you can’t.
      </T>
      <Note>
        These buttons open your phone’s calling and messaging apps. TrailSafe
        does not contact KCESAR directly.
      </Note>
      <LocationCard />
      <Callout title="If a text bounces back">
        A carrier bounce-back means your message did not reach 911. Try calling
        or another available emergency communication method. Stay with your
        phone and answer follow-up questions.
      </Callout>
      <Kicker>What happened?</Kicker>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {choices.map((c, i) => (
          <Pressable
            accessibilityRole="button"
            key={c.id}
            onPress={() =>
              router.push({ pathname: "/article/[id]", params: { id: c.id } })
            }
            style={({ pressed }) => ({
              width: i === 4 ? "100%" : "48%",
              flexGrow: 1,
              minHeight: i === 4 ? 54 : 106,
              padding: 14,
              borderWidth: 1.5,
              borderColor: C.line,
              borderRadius: 10,
              backgroundColor: "white",
              gap: 10,
              flexDirection: i === 4 ? "row" : "column",
              alignItems: i === 4 ? "center" : "flex-start",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <c.icon size={22} color={C.green} />
            <T
              style={{
                fontFamily: fonts.bold,
                fontSize: 13,
                lineHeight: 19,
                flexShrink: 1,
              }}
            >
              {c.title}
            </T>
          </Pressable>
        ))}
      </View>
      <Kicker>While you wait</Kicker>
      <Row
        title="Waiting for rescue"
        subtitle="What to do after you’ve called for help"
        icon={Clock}
        onPress={() =>
          router.push({
            pathname: "/article/[id]",
            params: { id: "g-waiting" },
          })
        }
      />
      <View style={{ marginTop: 22 }}>
        <Button
          label={practice ? "Exit Practice Mode" : "Practice Emergency Mode"}
          icon={ShieldCheck}
          variant="ghost"
          onPress={() => setPractice(!practice)}
        />
      </View>
      <T
        style={{
          textAlign: "center",
          fontSize: 12,
          lineHeight: 19,
          color: C.muted,
          marginTop: 20,
        }}
      >
        King County SAR resources are requested through 911 and King County
        dispatch — not through this app.
      </T>
    </Screen>
  );
}
