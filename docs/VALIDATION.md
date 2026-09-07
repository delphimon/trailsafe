# Validation — September 6, 2026

## Completed

- TypeScript strict typecheck.
- Expo ESLint, including React Compiler rules.
- 24 unit tests: DD/DDM, rounding carry, WGS84 UTM known fixtures, both hemispheres, Norway/Svalbard, antimeridian and polar limits, invalid coordinates, stale/poor/mock fix labels, practice isolation, unknown/missing-person SMS locations, article targets, overnight dates, invalid plan inputs, time-zone-based overdue checks, updated text, PDF escaping, versioned storage, and rejection of damaged data.
- 8 Chromium mobile browser end-to-end tests against the production-style web export: automatic coordinates, format selection and reload persistence, copy/share metadata, location-watch cleanup, denied location, stale/poor fixes, practice mode on hub and article screens, offline checklist/search/article use after launch, plan save/edit/share/duplicate/delete, profile reload/prefill, and 320-pixel layout.
- All browser location values are injected test fixtures. Phone and share integrations are intercepted. No test calls/texts were sent to emergency services.
- Expo iOS, Android, and web JavaScript/Hermes exports.
- iOS native prebuild and CocoaPods dependency installation.
- Xcode Release simulator build and one native XCTest UI flow on iPhone 17 Pro / iOS 26.5: launch, automatic simulated GPS fix, DDM and UTM selection, and guarded practice call/text actions. All passed; no real emergency handoff occurred.
- Generated iOS plist checked: foreground-only location description, no Always-location or motion usage descriptions, no background location mode.

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
