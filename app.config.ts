import type { ConfigContext, ExpoConfig } from "expo/config";
/** Each distributed artifact selects its own diagnostics and manual-update channel. */
export default ({ config }: ConfigContext): ExpoConfig => {
  const channel = process.env.EXPO_PUBLIC_RELEASE_CHANNEL || "production";
  if (!["development", "preview", "testflight", "production"].includes(channel))
    throw new Error("Unsupported TrailSafe release channel.");
  return {
    ...config,
    name: config.name || "TrailSafe",
    slug: config.slug || "trailsafe",
    extra: { ...config.extra, releaseChannel: channel },
    updates: {
      ...config.updates,
      checkAutomatically: "NEVER",
      requestHeaders: { "expo-channel-name": channel },
    },
  };
};
