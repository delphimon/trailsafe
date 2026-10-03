/**
 * @file diagnostics.ts
 * @description Release-channel gated crash reporting and diagnostics policy.
 *
 * Policy (see docs/RELEASE-DIAGNOSTICS.md and GitHub issue #11):
 * - Developer, internal/pre-release, and TestFlight builds: Bugsnag ENABLED.
 * - Final production App Store / Play Store release builds: Bugsnag DISABLED.
 *
 * This configuration is inspectable and testable at build time.
 */

export type ReleaseChannel = "development" | "preview" | "testflight" | "production";

/**
 * Derives the active release channel using explicit environment or manifest configuration.
 */
export function getReleaseChannel(): ReleaseChannel {
  const env = process.env.EXPO_PUBLIC_RELEASE_CHANNEL?.toLowerCase();
  if (env === "production" || env === "store") return "production";
  if (env === "testflight") return "testflight";
  if (env === "preview" || env === "internal") return "preview";
  if (env === "development" || env === "dev") return "development";

  try {
    const Constants = require("expo-constants").default || require("expo-constants");
    const extraChannel = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.releaseChannel;
    if (typeof extraChannel === "string") {
      const norm = extraChannel.toLowerCase();
      if (norm === "production" || norm === "store") return "production";
      if (norm === "testflight") return "testflight";
      if (norm === "preview" || norm === "internal") return "preview";
    }
  } catch {
    // Non-fatal if expo-constants cannot be loaded in pure Node test environment
  }

  return (typeof __DEV__ !== "undefined" && __DEV__) ? "development" : "production";
}

function getPlatformName(): string {
  try {
    const { Platform } = require("react-native");
    return Platform.OS;
  } catch {
    return typeof window !== "undefined" && typeof navigator !== "undefined" ? "web" : "ios";
  }
}

/**
 * Determines whether crash telemetry diagnostics should be initialized.
 * Strictly returns false for production store artifacts and web environments.
 *
 * @param channel The target release channel (defaults to getReleaseChannel()).
 */
export function shouldInitializeCrashDiagnostics(
  channel: ReleaseChannel = getReleaseChannel(),
  platform: string = getPlatformName(),
): boolean {
  // Never initialize on web
  if (platform === "web") {
    return false;
  }

  // Strictly disabled in production store artifacts
  if (channel === "production") {
    return false;
  }

  // Enabled for development, preview/internal, and TestFlight
  return true;
}

/**
 * Initializes Bugsnag if allowed by the release channel policy.
 * Returns true if initialized, false if gated off.
 */
export function initializeDiagnostics(): boolean {
  if (!shouldInitializeCrashDiagnostics()) {
    return false;
  }

  try {
    // Dynamic require so production builds that strip Bugsnag do not fail
    const BugsnagModule = require("@bugsnag/expo");
    const Bugsnag = BugsnagModule.default || BugsnagModule;
    Bugsnag.start({
      onError: function (event: any) {
        event.context = "redacted";
        event.user = {};
        event.addMetadata("device", "id", "redacted");
      },
    });
    return true;
  } catch {
    return false;
  }
}
