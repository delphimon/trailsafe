# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# TrailSafe developer guide

TrailSafe is a fully offline hiking preparation and emergency-information companion, initially focused on Washington and the PNW. Core features are preparation checklists, local shareable trip plans, emergency coordinates, a bundled guide, and simple hiking tools.

## Product rules

- Five bottom tabs: Plan (backpack), Prepare (clipboard checklist), Help, Guide, Tools. The shared title bar has a Home button to the left of the title and an Info/About button on the right. `/` still opens the existing Home page with visible trip access; Plan shows Current, Upcoming and Past; Prepare focuses on Ten Essentials and gear. Existing emergency/article/plan deep links remain valid.
- No consumer Practice Mode. Tests inject inert handoff handlers or intercept browser APIs. Never initiate real 911 calls or texts during tests. Native smoke tests must not tap transport controls.
- Calls open the phone handoff. On Help, Text 911 directly opens the system composer with the caller location in one app tap. A separate someone-elsewhere/edit option opens the editable draft and omits reporter GPS. The user sends it; composer/share results never establish delivery.
- Never use the reporter's GPS for someone elsewhere. Use the subject's last known location and time instead.
- TrailSafe does not monitor trips, notify contacts or dispatch help automatically. Completing a trip updates local data only.
- Water treatment is guidance only. Use the device's Clock timer; do not implement another app timer, notification alarm or countdown.
- No content-governance registry, ownership/review schedule, expiry machinery or automated release-content approval gate. Review content in the app before releasing it. Ordinary citations and content indexing remain useful.
- No accounts, advertising, behavioral analytics, backend or background location. Preserve all saved plans, profiles, preferences and checklist progress.
- Bugsnag is permitted in developer/internal/TestFlight builds, disabled in production store builds and on web. `eas.json` selects an explicit build channel; local signed installs default to preview. Verify the actual store artifact before distribution.

## Architecture

- Expo SDK 58, Router 58, React Native 0.88.0, React 19.3, TypeScript. Read the v58.0.0 docs for the current target in addition to the required v57.0.0 reference above. Expo Router routes in `src/app`.
- `src/state/store.tsx`: serialized AsyncStorage writes. Damaged data blocks overwriting. `changeTrip` computes against the latest stored snapshot and returns after a successful write.
- `src/lib/plans.ts`: plan schema, lifecycle, date/time validation, text/PDF formatting. Plans have explicit IANA time zones. Reject skipped and repeated DST wall times instead of guessing.
- `src/lib/trip-commands.ts`: shared asynchronous persistence boundary for lifecycle commands.
- `src/lib/reminder-reconciliation.ts`: pure desired-vs-pending local-reminder reconciliation. `src/lib/notifications.ts` supplies the Expo adapter. Reconcile after persisted plan changes/reset and at startup; report permission/failure separately from saving. Never cancel unrelated notifications.
- `src/hooks/use-location.tsx`: shared foreground GPS watcher. Consumers request only while focused; last-known fixes retain age/accuracy warnings.
- `src/lib/coordinates.ts`: DD/DDM/UTM and WMM declination. Positive declination means magnetic north lies east of true north. Grid north is map-specific.
- `src/lib/solar.ts`: offline sunrise/sunset/twilight estimates; 0/30/60-minute headlamp planning buffers. No silent location fallback or invented polar sunrise.
- Tools keeps Daylight, Compass and Hiking one tap away, with answers before settings. Hiking uses native sliders and quick choices; the web uses keyboard-accessible ranges.
- `src/lib/hiking-tools.ts`: rough hiking-time estimate. No cold-risk calculator, avalanche slope classification, audio whistle, screen strobe or water timer.
- `src/content/library.json`: editable bundled content and source links. `src/content/regions.ts`: bundled region/preset data for future expansion.
- Checklist IDs use stable names. `parseStoredData` preserves legacy index-based check meanings when mapping to these names.
- `modules/device-search`: optional on-device indexing. Do not record a successful version if indexing failed. Bound Android dynamic shortcuts by capacity after static shortcuts. Hash the actual indexed payload.
- `plugins/ios/TrailSafeIntents.swift`: preserve shipped intent identifiers and phrases. Intent descriptions must describe local actions, not automatic contact notification.

## Validation

```sh
npm test
npm run typecheck
npx eslint .
EXPO_NO_TELEMETRY=1 npx expo export --platform all
node scripts/serve-preview.cjs
TRAILSAFE_BROWSER="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:e2e
```

Export outside the filesystem sandbox when needed: Expo traverses parent directories for its workspace. Preview port is 8082. Test screenshots go to ignored `test-results/screenshots`, preserving prior documentation images. Fresh exports validate JS/assets for all platforms; they are not native compilation or device acceptance.

Expo Router bundles its navigation APIs: do not assume a separate `@react-navigation/*` import shares its context. Typed routes may be stale after adding files; regenerate with the installed Expo tooling. Keep Node-tested domain modules free of React Native imports; use lazy imports at native boundaries.

The default physical iPhone is Andrew's iPhone 18 Pro Max. Use it for deployments and device checks unless the user explicitly selects another phone; do not pick the still-paired iPhone 17 Pro Max. Its UDID and the project's signing team are stored privately in ignored `.iphone-device.local.json` as `udid` and `teamId`.

For signed iOS deployment, use `scripts/install-iphone.sh` with no arguments for that default, or `scripts/install-iphone.sh <UDID> <team>` for an explicit override. At every stable checkpoint, commit all changes, deploy to Surge (`npm run deploy:surge`), and deploy to the default iPhone (`bash scripts/install-iphone.sh`) if available before continuing. Preserve signing settings and installed user data. Device acceptance includes airplane-mode cold launch, permission/accuracy/staleness, native date pickers, reminders/cleanup, voice cancellation, accessibility and diagnostic policy. No live 911 test calls.

Reference prototypes in `docs/reference` are historical, not current requirements. Current user instructions and this guide supersede their Practice Mode, timers and governance sections.
