# Dependency update — October 13, 2026

The requested Router 58 update uses Expo 58.0.9 and Router 58.0.18 from the next/beta release line. React 19.3.0 and React Native 0.88.0-rc.4 match Expo's bundled version map. This is a beta/RC stack, not the SDK 57 stable line.

All direct Expo modules, native navigation/animation libraries, SVG and date picker use SDK 58's recommended versions. Added the native slider and explicit worklets dependency. Updated Playwright, Node/React types, icons, Prettier, Sharp and tsx. The dependency tree installs without force or legacy-peer-deps; `expo install --check` and `npm ls --depth=0` pass. A root React Native override pins peers to Expo's RC: ordinary peer ranges otherwise exclude the prerelease even though it is the SDK's intended version.

AsyncStorage remains at Expo's recommended 2.2.0. Moving to 3.x would introduce a separate storage migration and is not needed for this upgrade. TypeScript 6 and ESLint 9 remain because the installed TypeScript-ESLint parser requires TypeScript <6.1 and Expo’s React/import lint plugins require ESLint <=9. Newer native navigation/animation minors remain on the SDK version map. The user's plans, profiles, preferences and checkmarks retain the existing storage key/schema and native bundle identifier.

The current Bugsnag Expo wrapper declares only SDK 56/57 support. It is replaced by `@bugsnag/react-native` 9.1.0 with a CNG plugin that adds native initialization only for development, preview and TestFlight channels. Production prebuild registers no native initializer; web/production JS never starts Bugsnag. Session tracking, automatic breadcrumbs and diagnostic-product telemetry are disabled. Native/JS channel mismatches are rejected by the local phone build script. Actual production store-artifact transmission checks remain a separate release gate.

`npm audit` still reports upstream advisories for braces (latest 3.0.3), node-forge (latest 1.4.0) and an older uuid inside Xcode tooling. The report propagates these through Expo/RN dependency chains. No compatible automatic fix is offered. These are retained rather than forcing incompatible major versions; audit evidence is `/private/tmp/trailsafe-sdk58-audit.json`. An update does not mean the dependency graph has no advisories.

References:

- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/router/migrate/sdk-57-to-58/
- https://expo.dev/changelog/sdk-58-beta
- https://docs.expo.dev/versions/v58.0.0/sdk/async-storage/
- https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/
