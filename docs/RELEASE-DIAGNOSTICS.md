# Release Diagnostics Policy

TrailSafe uses Bugsnag as a **pre-release engineering diagnostic**, not as a production telemetry service.

## Build-channel policy

| Build / distribution | Bugsnag |
| --- | --- |
| Local developer / development build | Enabled |
| Internal / pre-release build | Enabled |
| TestFlight beta build | Enabled |
| Final production App Store / Play Store release | **Disabled** |

Production privacy and product documentation should describe the behavior of the final production artifact. Pre-release/TestFlight diagnostic collection does not require weakening production privacy language, provided the production build is verified not to initialize or transmit Bugsnag diagnostics.

## Implementation requirements

The app must gate Bugsnag using an explicit build/release-channel configuration rather than relying only on `__DEV__`. The build pipeline must make the intended setting inspectable and testable before distribution.

Before shipping a production store artifact:

1. Verify the artifact is configured as the production distribution channel.
2. Verify Bugsnag initialization is disabled.
3. Verify no Bugsnag API key or runtime initialization path can transmit production crash diagnostics.
4. Record that verification in the release validation evidence.

Developer, internal, and TestFlight builds may enable Bugsnag to diagnose failures during testing. Diagnostic configuration should continue to minimize unnecessary user data and should never be treated as part of TrailSafe's functional emergency-delivery path.

Tracking: see GitHub issue #11.

## Current artifact configuration

`eas.json` explicitly selects the diagnostic channel for development, preview, TestFlight and production profiles. `app.config.ts` embeds that selection in manifest extras and the manual OTA request channel. `scripts/install-iphone.sh` defaults local signed Release installs to preview; set `EXPO_PUBLIC_RELEASE_CHANNEL=production` for a local store-policy build. Production and web initialize no Bugsnag diagnostics, and About renders channel-appropriate privacy wording. Normal app launch does not check for OTA updates; manual update application is blocked while a trip is Current.

Unit checks and JS exports pass. Actual production native-artifact network/crash behavior remains a separate distribution check; configuration alone is not evidence that a shipped artifact was inspected.
