# KCESAR TrailSafe

An offline-first wilderness safety companion built with React Native 0.86, TypeScript, and Expo SDK 57. It follows the supplied **TrailSafe** HTML prototype’s design and content, adapting the older TrailReady product definition to Expo for iOS and Android. Web is available for development and workflow review.

## Run

```sh
npm ci
npm start
```

Open with an SDK 57-compatible Expo Go, or create a native development build:

```sh
npm run ios
npm run android
```

Native builds require the matching Xcode / Android SDK toolchains. On this Mac, Xcode is installed at `/Applications/Xcode-beta.app`; use `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer npm run ios` if command-line tools point elsewhere. These commands do not publish the app.

### Standalone install on a personal iPhone

A signed **Release** build includes the app code, fonts, and content and runs without Expo Go, Metro, or a connection to the Mac. Pair the iPhone with Xcode, enable Developer Mode on the phone, and sign into your Apple developer account in Xcode. Find the phone identifier with `xcrun devicectl list devices`.

With the native iOS project generated (`npx expo prebuild --platform ios` on a fresh checkout), build and install using your phone identifier and Apple team ID:

```sh
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer \
  bash scripts/install-iphone.sh YOUR_IPHONE_UDID YOUR_APPLE_TEAM_ID
```

This uses automatic Apple development signing and installs directly on the selected phone. Xcode may request account authentication or keychain access. The signed app is under `builds/iphone/Build/Products/Release-iphoneos/TrailSafe.app`. Installation is limited by the embedded provisioning profile's allowed devices and expiry; rebuild before that profile expires. This is a personal device install, with no App Store submission.

The local `plugins/with-ios-scenes.cjs` plugin adds the scene lifecycle required on iOS 27 when building with Xcode 27. It preserves Expo startup, lifecycle callbacks, and incoming links and is reapplied by Expo prebuild.

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

## Implemented

- **Home:** prototype forest-green / orange / paper styling, bundled Public Sans and Barlow Condensed fonts, prominent emergency entry, persistent five-section navigation.
- **Emergency:** native call/text handoffs, location-first text drafts, no-delivery claims, bounce-back guidance, and a practice mode that blocks all emergency handoffs.
- **Automatic location:** begins when Emergency opens, after the operating system’s required permission prompt. No Get Location button. Foreground-only updates stop when leaving Emergency or backgrounding the app.
- **Coordinate dropdown:** WGS84 decimal degrees, degrees and decimal minutes (DDM), and UTM. Format persists. Includes uncertainty, real fix timestamp/age, stale and poor-accuracy warnings, copy/share, and Maps handoff. UTM handles Norway/Svalbard exceptions, both hemispheres, and polar exclusions.
- **Trip plans:** create, edit, save draft, mark current, complete, duplicate, delete, text preview, copy, share, and PDF/print. Explicit start/return/overdue dates support overnight trips. Updated plans are labeled. Optional SAR details stay collapsed initially.
- **Reusable profile:** local name/contact, vehicle, equipment, and optional medical considerations prefill new plans. Existing plans retain their original details.
- **Prepare:** persistent Ten Essentials and phone checklists, trip-type add-ons, an explicit food reminder, reset, and external condition resources.
- **Guide:** 20 bundled articles, missing-versus-overdue branching, full-text search, and source references.
- **About:** organization distinctions, privacy, content version/review status, source directory, profile management, and local data deletion.

There is no account, backend, analytics, automatic emergency notification, or background tracking. Plans are not monitored. Copy, share, Maps, and phone/message actions are explicit. Device backups may include saved local app data.

## Validate

```sh
npm run typecheck
npm run lint
npm test
npm run export
```

Browser tests use **synthetic locations and intercepted handoffs**, never live 911:

```sh
npx playwright install chromium
# Start the export preview server in another terminal first.
TRAILSAFE_TEST_URL=http://127.0.0.1:8082 npm run test:e2e
```

Set `TRAILSAFE_BROWSER` to an existing Chromium executable if needed. See [validation notes](docs/VALIDATION.md) for results and remaining device checks.

## Source and maintenance

- `src/app/`: Expo Router screens.
- `src/components/trailsafe/`: native shared UI, coordinate card, emergency controls.
- `src/content/library.json`: editable offline content blocks and metadata; no HTML/WebView runtime.
- `src/lib/`: coordinate conversion, trip logic, safe PDF text escaping, persistence validation, and emergency action guard.
- `src/state/`: local storage and shared application state.
- `src/hooks/use-location.ts`: foreground lifecycle, native Expo Location, and browser geolocation adapter.
- `docs/reference/`: unchanged supplied documents for provenance.
- [Implementation decisions](docs/IMPLEMENTATION.md): scope reconciliation, design, technical limits, and content corrections.

Content changes should normally edit `src/content/library.json` directly. `npm run content:extract` is a one-time reconstruction tool for the supplied prototype and will replace subsequent manual edits; do not run it casually. The extractor parses data literals rather than executing the reference document’s JavaScript.

## Release status

This is a development implementation, not an official KCESAR release. Medical guidance, dispatch-facing wording, organizational endorsement, accessibility on physical devices, and real phone/SMS handoffs need their respective validation before public release. Do not send uncoordinated test calls or texts to 911.

The existing Expo owner and EAS project association were preserved. The provisional native identifier is `com.appliedinteractions.trailsafe`; no App Store / Play Store upload or deployment was performed.
