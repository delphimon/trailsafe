import { useState } from "react";
import { View } from "react-native";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import { emptyProfile, type Profile as ProfileData } from "@/lib/plans";
import {
  Button,
  Chip,
  Field,
  Kicker,
  Note,
  Screen,
  useThemeStyles,
} from "@/components/trailsafe/ui";
export default function Profile() {
  const { data, ready, error } = useStore();
  if (!ready || error)
    return (
      <Screen title="My Profile" back>
        <Note>{error || "Loading saved profile…"}</Note>
      </Screen>
    );
  return <ProfileEditor initial={data.profile} />;
}
function ProfileEditor({ initial }: { initial: ProfileData }) {
  const { s } = useThemeStyles();
  const { update, ready, error } = useStore();
  const { run, notify, setDialog } = useApp();
  const [profile, setProfile] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <Screen
      title="My Profile"
      subtitle="Reusable details, saved on your device"
      back
    >
      <Note>
        Used to prefill new plans. Existing plans keep their original details.
        All fields are optional.
      </Note>
      <View style={{ marginTop: 20 }}>
        {(["name", "phone", "vehicle", "plate", "medical"] as const).map(
          (k, i) => (
            <Field
              key={k}
              label={
                [
                  "Your name",
                  "Phone / contact method",
                  "Vehicle color, make, model",
                  "License plate and state",
                  "Medical considerations (optional)",
                ][i]
              }
              value={profile[k]}
              onChangeText={(v) => setProfile((p) => ({ ...p, [k]: v }))}
              multiline={k === "medical"}
              keyboardType={k === "phone" ? "phone-pad" : "default"}
            />
          ),
        )}
      </View>
      <Kicker>Usual communications</Kicker>
      <View style={s.wrap}>
        {["Phone", "Satellite messenger", "PLB", "Radio", "Other"].map((c) => (
          <Chip
            key={c}
            label={c}
            selected={profile.comms.includes(c)}
            onPress={() =>
              setProfile((p) => ({
                ...p,
                comms: p.comms.includes(c)
                  ? p.comms.filter((x) => x !== c)
                  : [...p.comms, c],
              }))
            }
          />
        ))}
      </View>
      <View style={{ marginTop: 22, gap: 12 }}>
        <Button
          label={busy ? "Saving…" : "Save Profile"}
          disabled={!ready || !!error || busy}
          onPress={() =>
            void run(async () => {
              setBusy(true);
              try {
                await update((d) => ({ ...d, profile }));
                notify("Profile saved on this device");
              } finally {
                setBusy(false);
              }
            })
          }
        />
        <Button
          label="Delete Profile"
          variant="outline"
          onPress={() =>
            setDialog({
              title: "Delete profile?",
              message:
                "Reusable profile details will be removed. Saved trip plans keep the information already included in them.",
              confirmLabel: "Delete profile",
              onConfirm: async () => {
                await update((d) => ({ ...d, profile: emptyProfile }));
                setProfile(emptyProfile);
              },
            })
          }
        />
      </View>
    </Screen>
  );
}
