const {
  withInfoPlist,
  withAppDelegate,
  withMainApplication,
} = require("expo/config-plugins");
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
  if (!enabled) return config;
  config = withAppDelegate(config, (mod) => {
    let source = mod.modResults.contents;
    if (source.includes("// TrailSafe pre-release diagnostics")) return mod;
    const anchor = "    let delegate = ReactNativeDelegate()";
    if (!source.includes(anchor))
      throw new Error("Review the SDK AppDelegate before adding diagnostics.");
    source = "import Bugsnag\n" + source;
    source = source.replace(
      anchor,
      `    // TrailSafe pre-release diagnostics\n    let diagnostics = BugsnagConfiguration(${JSON.stringify(apiKey)})\n    diagnostics.releaseStage = ${JSON.stringify(channel)}\n    diagnostics.autoTrackSessions = false\n    diagnostics.persistUser = false\n    diagnostics.enabledBreadcrumbTypes = []\n    diagnostics.telemetry = []\n    diagnostics.addOnSendError { event in\n      event.setUser(nil, withEmail: nil, andName: nil)\n      return true\n    }\n    Bugsnag.start(with: diagnostics)\n${anchor}`,
    );
    mod.modResults.contents = source;
    return mod;
  });
  return withMainApplication(config, (mod) => {
    const anchor = "    super.onCreate()";
    let source = mod.modResults.contents;
    if (source.includes("// TrailSafe pre-release diagnostics")) return mod;
    if (!source.includes(anchor))
      throw new Error(
        "Review the SDK MainApplication before adding diagnostics.",
      );
    source = source.replace(
      anchor,
      `${anchor}\n    // TrailSafe pre-release diagnostics\n    val diagnostics = com.bugsnag.android.Configuration(${JSON.stringify(apiKey)})\n    diagnostics.releaseStage = ${JSON.stringify(channel)}\n    diagnostics.autoTrackSessions = false\n    diagnostics.persistUser = false\n    diagnostics.enabledBreadcrumbTypes = emptySet()\n    diagnostics.telemetry = emptySet()\n    diagnostics.addOnSendError { event -> event.setUser(null, null, null); true }\n    com.bugsnag.android.Bugsnag.start(this, diagnostics)`,
    );
    mod.modResults.contents = source;
    return mod;
  });
}
module.exports = withReleaseDiagnostics;
