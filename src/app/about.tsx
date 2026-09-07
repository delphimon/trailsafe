import { Linking } from "react-native";
import { router } from "expo-router";
import { ExternalLink, UserRound, Trash2 } from "lucide-react-native";
import { useStore } from "@/state/store";
import { useApp } from "@/state/app";
import {
  Button,
  Callout,
  Card,
  Heading,
  Kicker,
  Note,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
export default function About() {
  const { reset, error } = useStore(),
    { run, setDialog } = useApp();
  return (
    <Screen title="About" subtitle="KCESAR, KCSARA, and this app">
      <Kicker>Organization</Kicker>
      <Card>
        <Heading>About KCESAR</Heading>
        <T>
          King County Explorer Search & Rescue (KCESAR) is an operational
          search-and-rescue unit and a separate 501(c)(3) nonprofit. It
          describes itself as the largest member unit of King County Search &
          Rescue and King County’s primary ground search-and-rescue team.
        </T>
        <Row
          title="kcesar.org"
          icon={ExternalLink}
          onPress={() =>
            void run(() => Linking.openURL("https://www.kcesar.org/"))
          }
        />
      </Card>
      <Card>
        <Heading>About King County Search & Rescue</Heading>
        <T>
          The King County Search & Rescue Association (KCSARA, often shortened
          to KCSAR) is the non-operational umbrella association that represents
          and supports King County’s specialized SAR member units, including
          KCESAR. Member units keep their own identities.
        </T>
        <Row
          title="kingcountysar.org"
          icon={ExternalLink}
          onPress={() =>
            void run(() => Linking.openURL("https://kingcountysar.org/"))
          }
        />
      </Card>
      <Kicker>Important</Kicker>
      <Callout critical title="This app is not monitored">
        Nobody at KCESAR, KCSARA, or anywhere else is watching your location or
        trip plans. TrailSafe doesn’t alert anyone automatically. In an
        emergency, call or text 911.
      </Callout>
      <Kicker>Privacy</Kicker>
      <Card>
        <T>
          Your trip plans, profile, and checklists are stored locally. No
          accounts, advertising, analytics, cloud database, or background
          location tracking. KCESAR does not receive your location or trip
          information.
        </T>
        <T style={{ marginTop: 12 }}>
          Information is handed to other apps only when you copy, share, open
          Maps, or start a call or text. Your device’s backup settings may
          include local app data. Location fixes are kept in memory and are not
          saved with your plans.
        </T>
        <Row
          title="My reusable profile"
          subtitle="Name, contact method, vehicle, and equipment"
          icon={UserRound}
          onPress={() => router.push("/profile")}
        />
      </Card>
      {error && (
        <Callout critical title="Saved data unavailable">
          {error} Emergency tools and offline guides are still available.
          Deleting all local data below also clears the preserved unreadable
          data.
        </Callout>
      )}
      <Button
        label="Delete all local data"
        variant="outline"
        icon={Trash2}
        onPress={() =>
          setDialog({
            title: "Delete all local data?",
            message:
              "This removes all saved plans, profile details, checklist progress, and coordinate preferences from this app. Copies you previously shared remain with their recipients.",
            confirmLabel: "Delete all data",
            onConfirm: reset,
          })
        }
      />
      <Kicker>Content & sources</Kicker>
      <Card>
        <Heading>TrailSafe · Development build</Heading>
        <T>
          Based on the supplied TrailSafe prototype and product definition.
          Safety guidance is bundled with the app for offline use. Content
          version: 2026.09.06.
        </T>
        <T style={{ marginTop: 12 }}>
          Organizational endorsement, medical review, and dispatch-facing
          wording remain pending. This is not an official KCESAR release. This
          app is an educational aid, not a substitute for training or
          instructions from 911 and rescuers.
        </T>
        <Row
          title="Source directory"
          subtitle="Local SAR, King County 911, and specialist resources"
          icon={ExternalLink}
          onPress={() => router.push("/resources")}
        />
      </Card>
      <Kicker>Connect</Kicker>
      <Card>
        {[
          { title: "Follow KCESAR", url: "https://linktr.ee/kingcounty_esar" },
          { title: "Donate or volunteer", url: "https://www.kcesar.org/" },
          { title: "Send feedback", url: "https://www.kcesar.org/contact-us" },
        ].map((r) => (
          <Row
            key={r.title}
            title={r.title}
            icon={ExternalLink}
            onPress={() => void run(() => Linking.openURL(r.url))}
          />
        ))}
      </Card>
      <Note>
        External links require Internet. Feedback channels are not emergency
        services.
      </Note>
    </Screen>
  );
}
