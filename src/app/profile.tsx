import { useState } from "react";
import { View } from "react-native";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import { emptyProfile, type Profile as ProfileData } from "@/lib/plans";
import {
  Button,
  Card,
  Chip,
  Field,
  Kicker,
  Note,
  Screen,
  T,
  fonts,
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
  const { C, s } = useThemeStyles();
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
        <Field
          label="Your name"
          value={profile.name}
          onChangeText={(v) => setProfile((p) => ({ ...p, name: v }))}
        />
        <Field
          label="Phone / contact method"
          value={profile.phone}
          onChangeText={(v) => setProfile((p) => ({ ...p, phone: v }))}
          keyboardType="phone-pad"
        />
      </View>

      <Kicker>Saved Vehicles</Kicker>
      <View style={{ marginBottom: 12 }}>
        <Note>
          Save up to two vehicles to easily select which car you are taking when
          creating a new trip plan.
        </Note>
      </View>

      <Card>
        <T
          style={{
            fontFamily: fonts.bold,
            fontSize: 16,
            color: C.heading,
            marginBottom: 12,
          }}
        >
          Primary Vehicle (Car 1)
        </T>
        <Field
          label="Car 1: Color, make, model"
          placeholder="e.g. Silver Subaru Outback"
          value={profile.vehicle}
          onChangeText={(v) => setProfile((p) => ({ ...p, vehicle: v }))}
        />
        <Field
          label="Car 1: License plate and state"
          placeholder="e.g. WA ABC123"
          value={profile.plate}
          onChangeText={(v) => setProfile((p) => ({ ...p, plate: v }))}
        />
      </Card>

      <Card>
        <T
          style={{
            fontFamily: fonts.bold,
            fontSize: 16,
            color: C.heading,
            marginBottom: 12,
          }}
        >
          Secondary Vehicle (Car 2)
        </T>
        <Field
          label="Car 2: Color, make, model"
          placeholder="e.g. Blue Rivian R1S"
          value={profile.vehicle2}
          onChangeText={(v) => setProfile((p) => ({ ...p, vehicle2: v }))}
        />
        <Field
          label="Car 2: License plate and state"
          placeholder="e.g. WA XYZ789"
          value={profile.plate2}
          onChangeText={(v) => setProfile((p) => ({ ...p, plate2: v }))}
        />
      </Card>

      <Kicker>Safety & Medical</Kicker>
      <View style={{ marginTop: 8 }}>
        <Field
          label="Medical considerations (optional)"
          value={profile.medical}
          multiline
          onChangeText={(v) => setProfile((p) => ({ ...p, medical: v }))}
        />
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
