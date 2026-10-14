# Validation — October 13, 2026

Current candidate: TrailSafe 0.5.0 (native build 3), SDK 58 next/beta, Router 58, React Native 0.88 RC. Earlier SDK 57 evidence is historical and does not establish native acceptance for this update.

| Check | Result | Scope |
| --- | --- | --- |
| Unit/domain/contrast suite | 94 passed | Coordinates, solar references, durable trip commands, DST, checklist compatibility, reminder reconciliation, storage failure, SMS outcomes, JS/native diagnostic gates and search hashing |
| TypeScript | Passed | Application, tests, native sliders/date fields |
| ESLint | 0 errors, 9 warnings | Lazy native require boundaries, scratch file, generated route declaration |
| Dependency graph | Passed | `expo install --check`, `npm ls --depth=0`; SDK 58 map plus a documented RN RC peer override |
| Expo export, all platforms | Passed | iOS/Android JS assets and static web, 17 routes, SDK 58 server-document hydration nodes |
| Playwright in Chrome | 17 passed | Home and separate Trips/Prepare access, visible headlamp result on a 440x956 viewport, immediate compass access, quick hiking controls and keyboard slider, one-app-tap intercepted SMS, here/elsewhere drafts, offline loaded-route navigation, plan/profile storage and failures |
| iOS simulator Release compilation | Passed | Version 0.5.0 (3), preview channel, embedded JS/assets, iPhone 17 Pro Max target |
| Signed iPhone Release compilation | Passed | Version 0.5.0 (3), preview channel, code signature verified, existing bundle identifier/team |
| Native simulator UI | In progress | Native controls and above-fold layout are reverified for this revision; simulator GPS service recovery/fallback is kept separate from app behavior |
| GitHub CI | Awaiting current candidate push | Prior SDK 57 run is not acceptance for this dependency graph |
| Surge and physical-phone delivery | Pending merge | Replacement installation will preserve the app container and compare private saved-data hashes |

Browser tests use fictional data, mocked location/share/clipboard and intercepted `window.open`; the one-tap SMS test captures the URL and sends nothing. Native smoke tests never tap call/SMS transports. No actual 911 call or text is made.

Solar fixtures are stored in `tests/fixtures/usno-seattle-{summer,winter}.json`, fetched from the US Naval Observatory one-day API on October 13, 2026. Seattle sunrise/sunset/civil dusk at both solstices agree within 90 seconds. This checks the model against an independent source; actual trail light still depends on terrain, canopy and weather.

The first browser attempt had no running preview server. After starting port 8082, 16/17 passed; the remaining test found the slider library's web control did not support keyboard arrows. A web-specific accessible range fixed it and the full run passed 17/17. Native compile checks caught and corrected the Bugsnag Swift initializer name and SDK 58 launch-options key signature. The SDK 58 simulator then built successfully. Its initial OS CoreLocation migration delay is simulator infrastructure, not an app launch assertion.

Logs: `/private/tmp/trailsafe-usability-tests.log`, `trailsafe-usability-typecheck.log`, `trailsafe-usability-lint.log`, `trailsafe-usability-export-final.log`, `trailsafe-usability-e2e-final.log`, `trailsafe-sdk58-simulator-build-final.log`, and `trailsafe-sdk58-phone-build.log`. Browser screenshots/traces stay in ignored `test-results/`. Native evidence is added after UI checks finish. See `DEPENDENCIES.md` for beta/RC pins and upstream audit advisories.

Deployment uses `npm run deploy:surge`: production channel, checks and web export, a Surge `200.html` fallback for direct plan links and `deploy-info.json` containing exported version/commit. Native runtime 0.5.0 prevents an older cached OTA from loading into the changed native graph. Phone replacement installation retains bundle identity and data; private backup/hash readback does not publish personal details.

Physical airplane-mode cold launch after restart, real GPS/permission/staleness, notification delivery/cleanup, voice replay, large text/VoiceOver/TalkBack, sunlight readability and actual production-store diagnostic transmission remain separate acceptance checks. This delivery is a personal preview install and browser preview, not a store submission. Content review is direct in-app review, with no governance registry or expiry subsystem.
