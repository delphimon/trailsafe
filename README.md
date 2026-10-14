# TrailSafe

Released by the Center for Adventure Leadership.

An offline-first wilderness safety companion built with React Native 0.88 RC, TypeScript, and Expo SDK 58 next/beta. It follows the supplied **TrailSafe** HTML prototype’s design and content, adapting the older TrailReady product definition to Expo for iOS and Android. Features instant coordinate translation (DD/DDM/UTM), verifiable SAR trip plans, offline emergency guides, Siri & Google Assistant voice shortcuts, on-device CoreSpotlight search indexing, and Action Button integration. Web is available for development and workflow review.

## Run

```sh
npm ci
npm start
```

Open with an SDK 58-compatible Expo Go, or create a native development build:

```sh
npm run ios
npm run android
```

Native builds require the matching Xcode / Android SDK toolchains. On this Mac, Xcode is installed at `/Applications/Xcode.app`; use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run ios` if command-line tools point elsewhere. These commands do not publish the app.

### Standalone install on a personal iPhone

A signed **Release** build includes the app code, fonts, and content and runs without Expo Go, Metro, or a connection to the Mac. Pair the iPhone with Xcode, enable Developer Mode on the phone, and sign into your Apple developer account in Xcode. Find the phone identifier with `xcrun devicectl list devices`.

Generate the native iOS project for the preview channel, then build and install using your phone identifier and Apple team ID:

```sh
EXPO_PUBLIC_RELEASE_CHANNEL=preview npx expo prebuild --platform ios
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  bash scripts/install-iphone.sh YOUR_IPHONE_UDID YOUR_APPLE_TEAM_ID
```

This uses automatic Apple development signing and installs directly on the selected phone. Xcode may request account authentication or keychain access. The signed app is under `builds/iphone/Build/Products/Release-iphoneos/TrailSafe.app`. Installation is limited by the embedded provisioning profile's allowed devices and expiry; rebuild before that profile expires. This is a personal device install, with no App Store submission.

### Over-the-Air Updates (EAS Update)

TrailSafe uses `expo-updates` for optional manual updates. Normal launch does not check for or download updates. About exposes the connected update flow, and applying an update is blocked while a trip is Current. Publishing an EAS update must target the intended release channel and compatible native runtime; it does not instantly replace every installed app. Native-module or SDK changes require a new native build. Version 0.5.0 uses a new native runtime for the SDK 58 dependency graph and sliders. Build profiles and diagnostic channels are documented in [Release Diagnostics Policy](docs/RELEASE-DIAGNOSTICS.md).

SDK 58 supplies the scene lifecycle required on iOS 27. `plugins/with-ios-scenes.cjs` extends the Expo scene delegate for Spotlight links while preserving Expo startup and callbacks.

For a browser preview:

```sh
npm run web
```

For a production-style local web preview:

```sh
npx expo export --platform web
node scripts/serve-preview.cjs
# http://127.0.0.1:8082
```

The preview server supports dynamic routes for device-local trip plans and bundled articles. Web geolocation requires localhost or HTTPS. The native installed app includes its content and fonts; web requires the initial app load and does not install an offline service worker.

Publish the browser preview to the existing Surge domain with `npm run deploy:surge`. This checks and exports the production web bundle, supplies direct-link fallback, and publishes a version/commit receipt at `https://trailsafe.kass.net/deploy-info.json`.

## Implemented

- **Navigation:** forest-green / orange / paper styling, bundled Public Sans and Barlow Condensed fonts, Home with visible trip access, and six tabs: Home, Trips, Prepare, Help, Guide, Tools.
- **Emergency:** explicit native handoffs, one-tap Text 911 for caller-location help and a separate editable someone-elsewhere draft, no-delivery claims and bounce-back guidance. Missing/overdue drafts ask for the subject's last-known location. Tests inject inert transports; there is no consumer Practice Mode.
- **Automatic location:** begins when Emergency opens, after the operating system’s required permission prompt. No Get Location button. Foreground-only updates stop when leaving Emergency or backgrounding the app.
- **Coordinate dropdown:** WGS84 decimal degrees, degrees and decimal minutes (DDM), and UTM. Format persists. Includes uncertainty, real fix timestamp/age, stale and poor-accuracy warnings, copy/share, and Maps handoff. UTM handles Norway/Svalbard exceptions, both hemispheres, and polar exclusions.
- **Trip plans:** create, edit, save draft, mark current, complete, duplicate, delete, text preview, copy, share, safe return check-in draft, and PDF/print. Explicit start/return/overdue dates support overnight trips. One-tap quick vehicle selection from saved profile cars. Updated plans are labeled. Optional SAR details stay collapsed initially.
- **Reusable profile:** local name/contact, dual vehicle management (Car 1 and Car 2), equipment, and optional medical considerations prefill new plans. Existing plans retain their original details.
- **Prepare:** persistent Ten Essentials and phone checklists, trip-type add-ons, an explicit food reminder, reset, and external condition resources.
- **Guide:** bundled offline articles, missing-versus-overdue branching, full-text search, and source references.
- **Tools:** immediate headlamp time with expandable settings, one-tap compass declination, hiking estimates with native sliders and quick choices, and water/signaling guidance. Water instructions direct users to the device's Clock timer. Content is reviewed directly in the app before release.
- **Voice assistant & system integration:** Siri App Intents (`OpenEmergencyIntent`, `CompleteCurrentTripIntent`, `SearchGuideIntent`) and Google Assistant shortcuts (`shortcuts.xml`). Action Button & Lock Screen shortcut trigger. Instant emergency screen launch (`trailsafe://emergency`), hands-free trip completion and start (`trailsafe://plan/current/complete`), and voice search (`trailsafe://guide?search=...`).
- **On-device search indexing:** Local Expo module (`modules/device-search`) indexing the bundled offline guide into iOS CoreSpotlight (`CSSearchableIndex`) and Android shortcuts (`ShortcutManagerCompat`) with deterministic content hashing (`getGuideContentVersion`) that triggers automated re-indexing across OTA updates.
- **About:** publisher, privacy, content version, source directory, native build metadata, OTA update status (`expo-updates`), check for updates flow, profile management, and local data deletion.

There is no account, backend, behavioral analytics, automatic emergency notification, or background tracking. Plans are not monitored. Copy, share, Maps, and phone/message actions are explicit. Device backups may include saved local app data. Bugsnag crash diagnostics are enabled only in developer, pre-release/internal, and TestFlight builds and are disabled for the final production App Store / Play Store release; see [Release Diagnostics Policy](docs/RELEASE-DIAGNOSTICS.md).

## Validate

```sh
npm run typecheck
npm run lint
npm test
npm run export
```

Runs the current automated unit and contrast test suite (`npm test`), strict TypeScript type checking, and linter. Browser tests use **synthetic locations and intercepted handoffs**, never live 911:

```sh
npx playwright install chromium
# Start the export preview server in another terminal first.
TRAILSAFE_TEST_URL=http://127.0.0.1:8082 npm run test:e2e
```

Set `TRAILSAFE_BROWSER` to an existing Chromium executable if needed. See [validation notes](docs/VALIDATION.md) for results and remaining device checks.

## Source and maintenance

- [Architecture & Technical Reference](docs/ARCHITECTURE.md): Full technical specifications, data flows, and subsystem deep dive.
- [Agent & Developer Guide](AGENTS.md): Essential rules, conventions, and file guide for developers and AI agents.
- [Implementation Decisions](docs/IMPLEMENTATION.md): Scope reconciliation, design, technical limits, and content corrections.
- [Release Diagnostics Policy](docs/RELEASE-DIAGNOSTICS.md): Bugsnag build-channel policy and production verification requirements.
- `modules/device-search/`: local Expo module interfacing with CoreSpotlight (`CSSearchableIndex`) and Android shortcuts (`ShortcutManagerCompat`).
- `plugins/with-app-intents.cjs`: CNG config plugin generating Swift App Intents and Android shortcuts.
- `src/app/`: Expo Router screens.
- `src/components/trailsafe/`: native shared UI, coordinate card, emergency controls, and design tokens (`theme.ts`).
- `src/content/library.json`: editable offline content blocks and metadata; no HTML/WebView runtime.
- `src/lib/`: coordinate conversion, trip logic, safe PDF text escaping, persistence validation, dual vehicle migration, emergency action guard, and on-device search indexing.
- `src/state/`: local storage and shared application state.
- `src/hooks/use-location.ts`: foreground lifecycle, native Expo Location, and browser geolocation adapter.
- `docs/reference/`: unchanged supplied documents for provenance.

Content changes should normally edit `src/content/library.json` directly. `npm run content:extract` is a one-time reconstruction tool for the supplied prototype and will replace subsequent manual edits; do not run it casually. The extractor parses data literals rather than executing the reference document’s JavaScript.

## Release status

This is a development implementation. Accessibility on physical devices and real phone/SMS handoffs need validation before public release. Bugsnag may be active in developer, pre-release, and TestFlight builds for crash diagnosis, but must be disabled in the final production store build. Do not send uncoordinated test calls or texts to 911.

The existing Expo owner, EAS project association and native identifier `com.appliedinteractions.trailsafe` are preserved. Version 0.5.0 (native build 3) is intended for the personal iPhone install and Surge browser preview. No App Store / Play Store submission is part of this delivery.
