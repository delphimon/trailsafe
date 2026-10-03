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
    <Screen
      back={true}
      title="About"
      subtitle="Center for Adventure Leadership and this app"
    >
      <Kicker>Organization</Kicker>
      <Card>
        <Heading>About TrailSafe</Heading>
        <T>
          TrailSafe is an offline wilderness-safety companion released by the
          Center for Adventure Leadership, whose mission is to train adults to
          be safe and effective adventure leaders for youth.
        </T>
        <Row
          title="adventureleader.org"
          subtitle="Training, Wilderness First Aid classes, and contact"
          icon={ExternalLink}
          onPress={() =>
            void run(() => Linking.openURL("https://adventureleader.org/"))
          }
        />
      </Card>
      <Note>
        External links require Internet. The Center for Adventure Leadership
        is not an emergency service — in an emergency, call or text 911.
      </Note>
      <Kicker>Important</Kicker>
      <Callout critical title="This app is not monitored">
        Nobody is watching your location or trip plans. TrailSafe doesn’t
        alert anyone automatically. In an emergency, call or text 911.
      </Callout>
      <Callout title="Search and rescue is free">
        Don’t delay calling 911 because of cost. In Washington State, search-and-rescue response does not bill rescued persons.
      </Callout>
      <Kicker>Privacy</Kicker>
      <Card>
        <T>
          Your trip plans, profile, and checklists are stored locally. No accounts, advertising, or behavioral analytics. Anonymous crash diagnostics are collected to fix bugs (Bugsnag). No cloud database or background location tracking. The Center for Adventure Leadership does not receive your location or trip
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
          Safety guidance is bundled with the app for offline use. Content
          version: {getGuideContentVersion()}.
        </T>
        <T style={{ marginTop: 12 }}>
          Guidance draws on and cites public material from authoritative
          sources, including King County Search & Rescue, King County 911, the
          Northwest Avalanche Center, the CDC, and the National Weather
          Service. Cited organizations did not create, sponsor, or endorse
          TrailSafe.
        </T>
        <T style={{ marginTop: 12 }}>
          This app is an educational aid, not a substitute for training or
          instructions from 911 and rescuers.
        </T>
        <Row
          title="Source directory"
          subtitle="Local SAR, 911, conditions, and specialist resources"
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
