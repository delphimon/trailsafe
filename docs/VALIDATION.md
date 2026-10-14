# Validation — October 13, 2026

This records fresh checks for the review implementation. The earlier validation document contained stale scope and unverified device claims; those are not acceptance evidence for this revision.

| Check | Result | Scope |
| --- | --- | --- |
| Unit/domain/contrast suite | 92 passed, 0 failed | Coordinates, solar references, plan saving, DST, checklist compatibility, reminder reconciliation, storage failure, SMS outcomes, diagnostics and search hashing |
| TypeScript | Passed | All application and test sources, including native date fields |
| ESLint | 0 errors, 9 warnings | Remaining warnings: lazy native `require` boundaries, scratch file, generated route declaration |
| Expo export, all platforms | Passed | iOS/Android JS assets and web export, 17 static routes including Start/Complete action URLs |
| Playwright in Chrome | 15 passed | Preparation, coordinates, location warnings, offline navigation after launch, editable here/elsewhere drafts, plan lifecycle/persistence, profile, small screen, Tools, completed edits, voice cancellation, failed storage and unsaved-edit navigation |
| Signed iPhone Release compilation | Passed | Version 0.4.0 (2), SDK 57 native dependency graph, code-signature verification and iOS 27 scene configuration; replacement installation and physical launch follow the main merge |
| iOS simulator Release compilation | Passed | Production channel, embedded JS/assets, iPhone 17 simulator; UI verification recorded below when complete |
| Native simulator UI | 3 passed; strengthened picker check also passed | Prepare/four tabs, synthetic DD/DDM/UTM, guide search and bundled cold article, native date spinner changes a day and retains it after Done, water guidance without a timer; screenshots and accessibility hierarchies inspected |
| GitHub CI | Both jobs passed | [Run 38476729930](https://github.com/delphimon/trailsafe/actions/runs/38476729930), integrated main plus native smoke sources |

Browser tests use fictional data and mocked location/share/clipboard. They do not click final call/text handoff controls. Unit tests inject inert emergency handlers; native smoke tests have been changed to avoid transports entirely. No actual 911 call or text was made.

Solar fixtures are stored in `tests/fixtures/usno-seattle-{summer,winter}.json`, fetched from the US Naval Observatory one-day API on October 13, 2026. Seattle sunrise/sunset/civil dusk at both solstices agree within 90 seconds. This checks the model against an independent source; actual trail light still depends on terrain, canopy and weather.

The first browser run passed 12/15. One failure was an old cold-guide heading selector and two were direct voice-action URLs missing from the static export. Updated the selector and exported both action routes; the subsequent full run passed 15/15.

Fresh integrated-main checks: `/private/tmp/trailsafe-final-tests.log`, `trailsafe-final-typecheck.log`, `trailsafe-final-lint.log`, `trailsafe-final-web-export.log`, and `trailsafe-final-e2e.log`. Native build logs: `/private/tmp/trailsafe-phone-build.log` and `/private/tmp/trailsafe-simulator-build-retry.log`. Screenshots and traces are in ignored `test-results/`; existing documentation screenshots were preserved. CI resides in `.github/workflows/ci.yml`.

Main's security update was retained while restoring Expo Router to SDK 57's versioned package graph. The first simultaneous native builds hit a shared Expo native-cache database lock; the sequential simulator retry passed. This was a build concurrency failure, not a passing UI check. The initial native UI run used Button selectors for controls exposed as tabs; accessibility hierarchy and screenshots confirmed normal app startup. Corrected tab selectors passed all three smoke tests. No native phone/SMS transports were tapped. Native evidence is in `/private/tmp/trailsafe-native-smoke-tabs-2026-10-13.xcresult` and `/private/tmp/trailsafe-native-smoke-picker-2026-10-13.xcresult`, with extracted screenshots/hierarchies. Visual review caught a stale cold-guide subtitle; it now reads "Recognize cold illness and take action".

Deployment uses `npm run deploy:surge`: production channel, local checks and web export, a Surge `200.html` fallback for direct plan links, and `deploy-info.json` containing the exported version and Git commit. The native runtime was bumped to 0.4.0 so an older cached OTA cannot load against the changed native modules. Phone replacement installation retains the bundle identifier and app container; a private pre-install backup and value hash provide a data-preservation readback without publishing personal data.

Before distributing the native build, verify airplane-mode cold launch after restart, every bundled guide and saved plan without network, location permission/accuracy/staleness, native date/time picker behavior, check-in notification denial/scheduling/deletion/reset, voice cancellation/replay, large text/VoiceOver/TalkBack, sunlight readability, and diagnostic policy on the actual production artifact. Content review is a direct in-app pre-release activity, with no governance registry or expiry subsystem.
