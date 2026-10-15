const {
  withInfoPlist,
  withAppDelegate,
  withMainApplication,
} = require("expo/config-plugins");
const marker = "// TrailSafe pre-release diagnostics";

// Remove our block on every prebuild, including blocks shipped before the end marker.
// A malformed block must fail the build rather than quietly retain a preview initializer.
function removeDiagnostics(source, platform) {
  const finish =
    platform === "ios"
      ? "Bugsnag.start(with: diagnostics)"
      : "com.bugsnag.android.Bugsnag.start(this, diagnostics)";
  while (source.includes(marker)) {
    const start = source.indexOf(marker);
    const end = source.indexOf(finish, start);
    if (end === -1)
      throw new Error(
        "Review the incomplete TrailSafe native diagnostics block.",
      );
    const lineStart = source.lastIndexOf("\n", start) + 1;
    const lineEnd = source.indexOf("\n", end);
    source =
      source.slice(0, lineStart) +
      source.slice(lineEnd === -1 ? source.length : lineEnd + 1);
  }
  source = source.replace(/^\s*\/\/ End TrailSafe diagnostics\r?\n/gm, "");
  if (platform === "ios" && !source.includes("Bugsnag")) return source;
  if (
    platform === "ios" &&
    !source.replace(/^import Bugsnag\r?\n/gm, "").includes("Bugsnag")
  )
    source = source.replace(/^import Bugsnag\r?\n/gm, "");
  return source;
}
function withReleaseDiagnostics(config) {
  const channel = config.extra?.releaseChannel || "production";
  const enabled = ["development", "preview", "testflight"].includes(channel);
  const apiKey = config.extra?.bugsnag?.apiKey;
  if (enabled && !apiKey)
    throw new Error("Pre-release diagnostics requires a Bugsnag API key.");
  config = withInfoPlist(config, (mod) => {
    mod.modResults.TrailSafeReleaseChannel = channel;
    delete mod.modResults.Bugsnag;
    return mod;
  });
  config = withAppDelegate(config, (mod) => {
    let source = removeDiagnostics(mod.modResults.contents, "ios");
    if (enabled) {
      const anchor = "    let delegate = ReactNativeDelegate()";
      if (!source.includes(anchor))
        throw new Error(
          "Review the SDK AppDelegate before adding diagnostics.",
        );
      source = "import Bugsnag\n" + source;
      source = source.replace(
        anchor,
        `    ${marker}\n    let diagnostics = BugsnagConfiguration(${JSON.stringify(apiKey)})\n    diagnostics.releaseStage = ${JSON.stringify(channel)}\n    diagnostics.autoTrackSessions = false\n    diagnostics.persistUser = false\n    diagnostics.enabledBreadcrumbTypes = []\n    diagnostics.telemetry = []\n    diagnostics.addOnSendError { event in\n      event.setUser(nil, withEmail: nil, andName: nil)\n      return true\n    }\n    Bugsnag.start(with: diagnostics)\n    // End TrailSafe diagnostics\n${anchor}`,
      );
    } else if (/Bugsnag\.start\s*\(/.test(source)) {
      throw new Error(
        "Production AppDelegate retains an unrecognized Bugsnag initializer.",
      );
    }
    mod.modResults.contents = source;
    return mod;
  });
  return withMainApplication(config, (mod) => {
    let source = removeDiagnostics(mod.modResults.contents, "android");
    if (enabled) {
      const anchor = "    super.onCreate()";
      if (!source.includes(anchor))
        throw new Error(
          "Review the SDK MainApplication before adding diagnostics.",
        );
      source = source.replace(
        anchor,
        `${anchor}\n    ${marker}\n    val diagnostics = com.bugsnag.android.Configuration(${JSON.stringify(apiKey)})\n    diagnostics.releaseStage = ${JSON.stringify(channel)}\n    diagnostics.autoTrackSessions = false\n    diagnostics.persistUser = false\n    diagnostics.enabledBreadcrumbTypes = emptySet()\n    diagnostics.telemetry = emptySet()\n    diagnostics.addOnSendError { event -> event.setUser(null, null, null); true }\n    com.bugsnag.android.Bugsnag.start(this, diagnostics)\n    // End TrailSafe diagnostics`,
      );
    } else if (/Bugsnag\.start\s*\(/.test(source)) {
      throw new Error(
        "Production MainApplication retains an unrecognized Bugsnag initializer.",
      );
    }
    mod.modResults.contents = source;
    return mod;
  });
}
module.exports = withReleaseDiagnostics;
