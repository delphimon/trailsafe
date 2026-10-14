import { useCallback, useState } from "react";
import { View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Button,
  Chip,
  Field,
  Note,
  Screen,
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";
import { useApp } from "@/state/app";
import { useStore } from "@/state/store";
import { buildEmergencyDraft } from "@/lib/emergency";

export default function EmergencyMessage() {
  const { situation = "Describe what happened", kind: initialKind } =
    useLocalSearchParams<{
      situation?: string;
      kind?: "here" | "elsewhere";
    }>();
  const { s } = useThemeStyles();
  const { location, sendEmergencyText, run } = useApp();
  const { data } = useStore();
  const missingPerson = /missing|overdue/i.test(situation);
  const [kind, setKind] = useState<"here" | "elsewhere" | null>(
    missingPerson || initialKind === "elsewhere" ? "elsewhere" : "here",
  );
  const [edited, setEdited] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const request = location.requestLocation;
  useFocusEffect(
    useCallback(
      () => (kind === "here" ? request() : undefined),
      [kind, request],
    ),
  );
  const draft =
    edited ??
    buildEmergencyDraft(
      location.fix,
      situation,
      undefined,
      data.profile.travelerPhone,
      kind ?? "elsewhere",
    );
  return (
    <Screen
      title="Text 911"
      subtitle="Choose the emergency location, then review your message"
      back
    >
      <T>Where is help needed?</T>
      <View style={[s.wrap, { marginVertical: 16 }]}>
        {!missingPerson && (
          <Chip
            label="At my location"
            selected={kind === "here"}
            onPress={() => {
              setKind("here");
              setEdited(null);
            }}
          />
        )}
        <Chip
          label="Someone elsewhere"
          selected={kind === "elsewhere"}
          onPress={() => {
            setKind("elsewhere");
            setEdited(null);
          }}
        />
      </View>
      {kind && (
        <>
          <Field
            label="Emergency message"
            value={draft}
            onChangeText={setEdited}
            multiline
          />
          <Note>
            Fill in unknown details. For someone elsewhere, provide their last
            known location and time seen; your GPS is omitted.
          </Note>
          <Button
            label={busy ? "Opening…" : "Open Messages to 911"}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                setBusy(true);
                try {
                  await sendEmergencyText(draft);
                } finally {
                  setBusy(false);
                }
              })
            }
          />
        </>
      )}
      <Note>
        You must send the message in Messages. TrailSafe cannot verify sending
        or delivery. Call if you can; text if you cannot. If a text bounces
        back, try another emergency communication method.
      </Note>
    </Screen>
  );
}
