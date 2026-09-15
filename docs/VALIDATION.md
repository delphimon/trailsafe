# Validation — September 15, 2026

## Completed

- **TypeScript Strict Typecheck**: Passed with 0 errors (`npm run typecheck`).
- **Expo ESLint**: Passed with 0 errors (`npx eslint .`).
- **44 Unit & Math Tests (`npm test`)**:
  - Coordinate transformations (DD, DDM, UTM WGS84 projections, Norway/Svalbard zones, antimeridian and polar boundaries).
  - Practice isolation (asserting zero native handoffs when practice is enabled).
  - Emergency message generation (asserting overdue drafts never insert caller GPS).
  - Trip plan validation (overnight date math, midnight deadline carry, time-zone overdue checks, PDF escaping, HTML generator).
  - Versioned storage round-tripping, corrupted data rejection, and dual-vehicle legacy profile migration.
  - Theme color token parity and mathematical W3C WCAG 2.1 relative luminance contrast tests (>= 4.5:1 body text, >= 3.0:1 bold text across all light/dark surfaces).
- **9 Chromium Browser End-to-End Tests (`npm run test:e2e`)**:
  - Automatic coordinates, dropdown persistence, and watcher cleanup.
  - Denied location permission handling.
  - Stale and poor accuracy warning retention during copy/share.
  - Practice actions across emergency and guide screens.
  - Offline checklist, search, and article reading.
  - Trip creation, midnight buffer, persistence, editing, and deletion.
  - Reusable profile persistence with dual vehicle saving and one-tap plan prefill selection.
  - Small screen 320px responsive layout without overflow.
  - About screen native build info and OTA update checking action.
- All browser location values are injected test fixtures. Phone and share integrations are intercepted. No test calls/texts were sent to emergency services.
- Expo iOS, Android, and web JavaScript/Hermes exports.
- iOS native prebuild and CocoaPods dependency installation.
- Xcode Release simulator build and native XCTest UI flow on iPhone 17 Pro / iOS 26.5.

## Native build

Xcode 27.0 (27A5252f) successfully compiled the iOS **Release** simulator build, including its bundled JavaScript and assets. Command: `xcodebuild -workspace ios/TrailSafe.xcworkspace -scheme TrailSafe -configuration Release -sdk iphonesimulator -destination "generic/platform=iOS Simulator" -derivedDataPath /private/tmp/trailsafe-derived CODE_SIGNING_ALLOWED=NO`.

The build artifact is `/private/tmp/trailsafe-derived/Build/Products/Release-iphonesimulator/TrailSafe.app`. The app was installed and launched in the simulator. `tests/native/TrailSafeSmoke.swift` passed in 29 seconds with zero failures; it exercised automatic GPS display, both alternate formats, continued access to all five tabs after closing the dropdown, and both practice actions. The test results are at `/private/tmp/trailsafe-native-smoke-final.xcresult`.

This validates native compilation and the exercised simulator flows, not physical GPS, carrier service, satellite service, or actual 911 delivery.

## Personal iPhone installation — September 6, 2026

- Built a signed arm64 **Release** for the connected iPhone 17 Pro Max running iOS 27.0, using Xcode 27 beta and automatic Apple development signing.
- `codesign --verify --deep --strict` passed. The embedded provisioning profile includes the target phone. The app contains its 4,878,457-byte `main.jsbundle` and bundled fonts; the Release native entry point loads this bundle from the app package.
- Apple CoreDevice reported successful installation and launch of `com.appliedinteractions.trailsafe`, version 0.1.0. No emergency actions were exercised on the physical phone.
- Installable device package saved locally at `builds/TrailSafe-0.1.0-iphone.ipa` (ignored by Git). The package is development-signed for the provisioned phone; it is not an App Store upload or public download link.
- The embedded profile expires September 14, 2026 at 06:11:02 UTC (September 13 at 11:11 p.m. Pacific). Rebuild/reinstall to renew this personal installation. No claim of long-term distribution signing is made.
- Repeat future builds and installations using `scripts/install-iphone.sh`; see README. Initial physical launch was performed with the phone connected to the Mac over the local network; a cold launch in airplane mode remains a separate check.

## Remaining physical and release checks

- Real iPhone and Android: location permission combinations, approximate/precise location, disabled services, cold GPS fix under tree cover, background/resume and battery behavior.
- Native phone dialer, SMS composer, user cancellation, bounce-back instructions, external Maps, clipboard, share sheets, PDF/printing. Do not make uncoordinated 911 test calls/texts.
- Fresh installed native launch without network; the release app bundles its fonts/content. The browser test proves offline navigation after initial loading, not a browser cold-start PWA.
- VoiceOver, TalkBack, maximum Dynamic Type, high-contrast visibility outdoors, and hardware keyboard/focus behavior.
- Organizational endorsement, medical review, dispatch wording, publisher identity, store privacy disclosures, distribution signing/provisioning, and field beta.
- No App Store / Play Store release, deployment, or remote publication was performed.

## Screenshots

`docs/screenshots/` contains viewport captures from the automated browser tests. Coordinates shown there are simulated test data, not a real user position. Native screenshots, if present, are named `ios-*`.

## Reproduce the native smoke test

1. Build/install the Release simulator app. Set a simulator GPS fix to `47.42537,-121.41382` and grant the app foreground location permission.
2. Run `scripts/create-native-smoke.rb` with CocoaPods’ Ruby/gem environment to create `/private/tmp/trailsafe-native-smoke/TrailSafeSmoke.xcodeproj`. The script uses the existing `xcodeproj` gem.
3. Run `xcodebuild test -project /private/tmp/trailsafe-native-smoke/TrailSafeSmoke.xcodeproj -scheme TrailSafeSmoke -destination 'platform=iOS Simulator,id=YOUR_SIMULATOR_UUID' CODE_SIGNING_ALLOWED=NO`.

The runner drives the installed app by bundle ID. It asserts Practice Mode is active before tapping either 911 action, and stops on the first failure. It creates no production service connections.
