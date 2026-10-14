/* global __dirname */
const {
  withAppDelegate,
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
// SDK 58 owns scene startup/lifecycle. Extend it only to preserve Spotlight links.
function withIosScenes(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "TrailSafe",
            UISceneDelegateClassName:
              "$(PRODUCT_MODULE_NAME).TrailSafeSceneDelegate",
          },
        ],
      },
    };
    return mod;
  });
  config = withAppDelegate(config, (mod) => {
    if (!mod.modResults.contents.includes("ExpoReactNativeFactoryProvider"))
      throw new Error(
        "TrailSafe requires the SDK 58 scene-based AppDelegate template.",
      );
    return mod;
  });
  config = withDangerousMod(config, [
    "ios",
    async (mod) => {
      fs.copyFileSync(
        path.join(__dirname, "ios", "TrailSafeSceneDelegate.swift"),
        path.join(
          mod.modRequest.platformProjectRoot,
          "TrailSafe",
          "TrailSafeSceneDelegate.swift",
        ),
      );
      return mod;
    },
  ]);
  return withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    if (!project.hasFile("TrailSafe/TrailSafeSceneDelegate.swift")) {
      const group =
        project.findPBXGroupKey({ name: "TrailSafe" }) ||
        project.findPBXGroupKey({ path: "TrailSafe" });
      project.addSourceFile(
        "TrailSafe/TrailSafeSceneDelegate.swift",
        { target: project.getFirstTarget().uuid },
        group,
      );
    }
    return mod;
  });
}
module.exports = withIosScenes;
