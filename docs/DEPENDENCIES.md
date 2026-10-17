# Dependency update — October 17, 2026

TrailSafe uses the official Expo SDK 58 release (`expo` `~58.0.14`, `expo-router` `~58.0.23`), React `19.3.0`, and React Native `0.88.0` matching Expo's bundled version map.

All direct Expo modules, native navigation/animation libraries, SVG and date picker use SDK 58's recommended stable versions. Added the native slider and explicit worklets dependency. Updated Playwright, Node/React types, icons, Prettier, Sharp and tsx. The dependency tree installs without force or legacy-peer-deps; `expo install --check`, `expo-doctor`, and `npm ls --depth=0` pass. Root overrides pin React Native and worklets to Expo’s version map so npm 10 does not resolve duplicate native versions.

AsyncStorage remains at Expo's recommended 2.2.0. Moving to 3.x would introduce a separate storage migration and is not needed for this upgrade. TypeScript 6 and ESLint 9 remain because the installed TypeScript-ESLint parser requires TypeScript <6.1 and Expo’s React/import lint plugins require ESLint <=9. Newer native navigation/animation minors remain on the SDK version map. The user's plans, profiles, preferences and checkmarks retain the existing storage key/schema.

The current Bugsnag Expo wrapper declares only SDK 56/57 support. It is replaced by `@bugsnag/react-native` 9.1.0 with a CNG plugin that adds native initialization only for development, preview and TestFlight channels. Production prebuild registers no native initializer; web/production JS never starts Bugsnag. Session tracking, automatic breadcrumbs and diagnostic-product telemetry are disabled. Native/JS channel mismatches are rejected by the local phone build script. Actual production store-artifact transmission checks remain a separate release gate.

`npm audit` still reports upstream advisories for braces (latest 3.0.3), node-forge (latest 1.4.0) and an older uuid inside Xcode tooling. The report propagates these through Expo/RN dependency chains. No compatible automatic fix is offered. These are retained rather than forcing incompatible major versions; audit evidence is `/private/tmp/trailsafe-sdk58-audit.json`. An update does not mean the dependency graph has no advisories.

The October 14 [Dependabot update run](https://github.com/delphimon/trailsafe/actions/runs/38600423244) independently confirmed no security update exists for braces 3.0.3 or node-forge 1.4.0. It reported uuid 14.0.0 as the first patched version, blocked by Xcode tooling 3.0.1's `^7.0.3` dependency. This updater failure is separate from the successful application CI on delivered main. The compatible shell-quote 1.12.0 update was included through PR #16.

References:

- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/router/migrate/sdk-57-to-58/
- https://expo.dev/changelog/sdk-58
- https://docs.expo.dev/versions/v58.0.0/sdk/async-storage/
- https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/
