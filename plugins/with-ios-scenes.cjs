const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

// SDK 57's template still starts a window from UIApplicationDelegate. iOS 27
// requires UIScene when linked with the iOS 27 SDK. Keep this in prebuild.
function migrateAppDelegate(source) {
  if (source.includes('// TrailSafe scene lifecycle')) return source;
  const windowBlock = /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)[\s\S]*?launchOptions: launchOptions\)\s+#endif/;
  if (!source.includes('var window: UIWindow?') || !windowBlock.test(source)) {
    throw new Error('Expo AppDelegate template changed; review the TrailSafe scene migration before building.');
  }
  return source
    .replace('var window: UIWindow?', 'var window: UIWindow?\n  var initialLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?')
    .replace(windowBlock, '    initialLaunchOptions = launchOptions')
    + '\n' + fs.readFileSync(path.join(__dirname, 'ios', 'TrailSafeSceneDelegate.swift'), 'utf8');
}

function withIosScenes(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{
          UISceneConfigurationName: 'TrailSafe',
          UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).TrailSafeSceneDelegate',
        }],
      },
    };
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') throw new Error('TrailSafe requires the Expo Swift AppDelegate.');
    mod.modResults.contents = migrateAppDelegate(mod.modResults.contents);
    return mod;
  });
}

module.exports = withIosScenes;
module.exports.migrateAppDelegate = migrateAppDelegate;
