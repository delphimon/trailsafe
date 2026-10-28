import {
  Card,
  Heading,
  Kicker,
  Note,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
import { ExternalLink } from "@/components/trailsafe/icons";
import { useApp } from "@/state/app";
import { Linking, View } from "react-native";

export default function PrivacyScreen() {
  const { run } = useApp();

  return (
    <Screen
      back
      title="Privacy Policy"
      subtitle="Center for Adventure Leadership"
    >
      <Kicker>Organization policy</Kicker>
      <Card>
        <T>
          The Center for Adventure Leadership (CAL) is committed to protecting
          your privacy across our website, training programs, and all mobile
          applications we build. Read the complete organization policy online or
          review the TrailSafe disclosures below.
        </T>
        <Row
          title="adventureleader.org/privacy"
          subtitle="Hosted CAL policy · Internet required"
          icon={ExternalLink}
          onPress={() =>
            void run(() =>
              Linking.openURL("https://adventureleader.org/privacy"),
            )
          }
        />
      </Card>

      <Kicker>1. CAL Privacy Commitment</Kicker>
      <Card>
        <Heading>Privacy by Architecture</Heading>
        <T>
          Across all our apps, we minimize data collection, default to local
          on-device storage, never sell personal data, and never employ
          commercial advertising or behavioral tracking.
        </T>
      </Card>

      <Kicker>2. What We Do NOT Collect</Kicker>
      <Card>
        <Heading>Zero Remote Data Collection</Heading>
        <T>• No user accounts, registration, or logins</T>
        <T style={{ marginTop: 6 }}>
          • No cloud database or remote synchronization
        </T>
        <T style={{ marginTop: 6 }}>
          • No third-party behavioral analytics or telemetry
        </T>
        <T style={{ marginTop: 6 }}>
          • No commercial advertising or tracking IDs
        </T>
        <T style={{ marginTop: 6 }}>
          • No background location tracking or monitoring
        </T>
      </Card>

      <Kicker>3. Local Data Handling</Kicker>
      <Card>
        <Heading>Location Data (GPS)</Heading>
        <T>
          Location access is requested only while viewing screens that display or
          calculate coordinates (Emergency, Daylight, and Coordinate tools). GPS
          fixes are held in transient memory only and are never saved with trip
          plans, uploaded to servers, or tracked in the background.
        </T>
        <View style={{ marginTop: 14 }}>
          <Heading>Plans & Profiles</Heading>
        </View>
        <T>
          Trip details, checklists, and reusable profile data are stored strictly
          on your local device using local storage. They remain on your device
          until you edit or delete them.
        </T>
        <View style={{ marginTop: 14 }}>
          <Heading>Reminders</Heading>
        </View>
        <T>
          Optional trip check-in and overdue reminders are scheduled purely as
          local on-device alarms. No remote push notification service is used.
        </T>
      </Card>

      <Kicker>4. Communications & Handoffs</Kicker>
      <Card>
        <Heading>User-Initiated Actions</Heading>
        <T>
          TrailSafe does not automatically dispatch help or notify contacts.
          Tapping “CALL 911” opens your phone’s system dialer. Tapping “TEXT
          911” opens your native SMS composer with a pre-filled draft. Exporting
          or sharing a plan opens the native OS share sheet. You review and
          dispatch all communications yourself.
        </T>
      </Card>

      <Kicker>5. Diagnostics Policy</Kicker>
      <Card>
        <Heading>Production Releases</Heading>
        <T>
          Production store releases have all diagnostic and crash reporting
          tools completely disabled. Pre-release beta builds (such as
          TestFlight) may enable Bugsnag to catch native crashes, with personal
          data and identifiers strictly redacted.
        </T>
      </Card>

      <Kicker>6. Data Deletion</Kicker>
      <Card>
        <Heading>Full User Control</Heading>
        <T>
          You can delete all locally stored plans, profile details, checklist
          progress, and preferences at any time by tapping “Delete all local
          data” on the About screen, or by uninstalling the app.
        </T>
      </Card>

      <View style={{ marginBottom: 16 }}>
        <Note>
          Effective Date: October 27, 2026 · Center for Adventure Leadership
        </Note>
      </View>
    </Screen>
  );
}
