import {
  Button,
  Callout,
  Card,
  fonts,
  Heading,
  Kicker,
  Note,
  Row,
  Screen,
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";
import { useApp } from "@/state/app";
import { useStore } from "@/state/store";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as Updates from "expo-updates";
import {
  ExternalLink,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react-native";
import { useState } from "react";
import { Linking, Platform, View } from "react-native";
import { getGuideContentVersion } from "@/lib/search-indexing";

export default function About() {
  const { C } = useThemeStyles();
  const { reset, error } = useStore(),
    { run, notify, setDialog } = useApp();
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const appVersion = Constants.expoConfig?.version || "0.1.0";
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber || "1"
      : Platform.OS === "android"
        ? String(Constants.expoConfig?.android?.versionCode || 1)
        : "web";
  const platformInfo =
    Platform.OS === "web"
      ? "Web (Browser)"
      : `${Platform.OS === "ios" ? "iOS" : "Android"} ${Platform.Version} · ${__DEV__ ? "Development" : "Release"}`;
  const runtimeVersion =
    Updates.runtimeVersion ||
    (typeof Constants.expoConfig?.runtimeVersion === "string"
      ? Constants.expoConfig.runtimeVersion
      : (
          Constants.expoConfig?.runtimeVersion as
            { policy?: string } | undefined
        )?.policy) ||
    "v57.0.0";

  const isOtaEnabled = Platform.OS !== "web" && Updates.isEnabled;
  const updateStatusText = !isOtaEnabled
    ? Platform.OS === "web"
      ? "N/A (Web)"
      : "Disabled (Local / Dev)"
    : Updates.isEmbeddedLaunch
      ? "Embedded Binary"
      : "Active OTA Update";

  const updateDate = Updates.createdAt
    ? new Date(Updates.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const checkForUpdates = async () => {
    if (!isOtaEnabled) {
      notify("OTA updates are only active on installed native builds.");
      return;
    }
    setCheckingUpdate(true);
    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        setDialog({
          title: "Update Available",
          message:
            "A new update was found for this app. Download and apply the update now?",
          confirmLabel: "Download & Restart",
          onConfirm: async () => {
            notify("Downloading update…");
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          },
        });
      } else {
        notify("You are on the latest update.");
      }
    } catch (err) {
      notify(`Check failed: ${(err as Error).message}`);
    } finally {
      setCheckingUpdate(false);
    }
  };
  return (
    <Screen back={true} title="About" subtitle="KCESAR, KCSARA, and this app">
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
      <Callout title="Search and rescue is free">
        Don't delay calling 911 because of cost. In Washington State, search-and-rescue response does not bill rescued persons.
      </Callout>
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
      <Kicker>Privacy</Kicker>
      <Card>
        <T>
          Your trip plans, profile, and checklists are stored locally. No accounts, advertising, or behavioral analytics. Anonymous crash diagnostics are collected to fix bugs (Bugsnag). No cloud database or background location tracking. KCESAR does not receive your location or trip
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
          version: {getGuideContentVersion()}.
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
      <Kicker>Build & Update Info</Kicker>
      <Card>
        <Heading>Version Details</Heading>
        <View style={{ gap: 4, marginVertical: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}
          >
            <T style={{ fontFamily: fonts.bold, color: C.muted, fontSize: 13 }}>
              App Version
            </T>
            <T
              selectable
              testID="build-version"
              style={{ fontFamily: fonts.bold, fontSize: 13 }}
            >
              {appVersion} ({buildNumber})
            </T>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}
          >
            <T style={{ fontFamily: fonts.bold, color: C.muted, fontSize: 13 }}>
              Platform
            </T>
            <T selectable style={{ fontSize: 13 }}>
              {platformInfo}
            </T>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}
          >
            <T style={{ fontFamily: fonts.bold, color: C.muted, fontSize: 13 }}>
              Runtime Version
            </T>
            <T selectable style={{ fontSize: 13 }}>
              {runtimeVersion}
            </T>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth:
                !!Updates.channel || !!Updates.updateId || !!updateDate ? 1 : 0,
              borderBottomColor: C.line,
            }}
          >
            <T style={{ fontFamily: fonts.bold, color: C.muted, fontSize: 13 }}>
              OTA Status
            </T>
            <T
              selectable
              style={{
                fontSize: 13,
                fontFamily: fonts.bold,
                color: isOtaEnabled ? C.green : C.muted,
              }}
            >
              {updateStatusText}
            </T>
          </View>
          {!!Updates.channel && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}
            >
              <T
                style={{ fontFamily: fonts.bold, color: C.muted, fontSize: 13 }}
              >
                Channel
              </T>
              <T selectable style={{ fontSize: 13 }}>
                {Updates.channel}
              </T>
            </View>
          )}
          {!!Updates.updateId && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: !!updateDate ? 1 : 0,
                borderBottomColor: C.line,
              }}
            >
              <T
                style={{ fontFamily: fonts.bold, color: C.muted, fontSize: 13 }}
              >
                Update ID
              </T>
              <T selectable style={{ fontSize: 13, fontFamily: fonts.bold }}>
                {Updates.updateId.slice(0, 8)}…
              </T>
            </View>
          )}
          {!!updateDate && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <T
                style={{ fontFamily: fonts.bold, color: C.muted, fontSize: 13 }}
              >
                Update Released
              </T>
              <T selectable style={{ fontSize: 13 }}>
                {updateDate}
              </T>
            </View>
          )}
        </View>
        <View style={{ marginTop: 10 }}>
          <Button
            label={checkingUpdate ? "Checking…" : "Check for Updates"}
            icon={RefreshCw}
            variant="outline"
            small
            disabled={checkingUpdate}
            onPress={() => void run(checkForUpdates)}
          />
        </View>
      </Card>
    </Screen>
  );
}
