# Validation — October 2, 2026

This document records the current validation status and verification evidence across automated tests, native simulators, and physical devices for **TrailSafe**, released by the **Center for Adventure Leadership** (`adventureleader.org`).

---

## 1. Automated Verification Summary

| Check / Suite | Status | Execution Command | Verification Scope |
| :--- | :--- | :--- | :--- |
| **Strict Typecheck** | **PASS** (0 errors) | `npm run typecheck` | Strict TypeScript compilation across all app routes, hooks, components, state containers, and libraries. |
| **Linter** | **PASS** (0 errors) | `EXPO_NO_TELEMETRY=1 npx eslint .` | React Native, React Hooks, Expo Router, and React purity lint rules. |
| **Unit & Contract Suite** | **PASS** (93 tests) | `npm test` | Core mathematical, domain invariant, coordinate, and safety subsystem tests via `tsx --test`. |
| **Theme & Contrast** | **PASS** (17 tests) | `npm test` | Mathematical W3C WCAG 2.1 relative luminance and contrast compliance (>= 4.5:1 body, >= 3.0:1 headings/buttons) across light and dark palettes. |
| **End-to-End Browser** | **PASS** (10 tests) | `npm run test:e2e` | Playwright browser suite on exported static bundle (port 8082). |
| **CI Automation** | **CONFIGURED** | `ci/ci.yml` | GitHub Actions workflow automating typecheck, lint, unit tests, web export, and Playwright E2E tests (ready to link to `.github/workflows/ci.yml` when OAuth workflow scope is refreshed). |

---

## 2. Core Safety Subsystems Validated

### A. Location & Coordinate Subsystem
- **Coordinate Formats**: Full round-trip mathematical verification for Decimal Degrees (DD), Degrees & Decimal Minutes (DDM), and Universal Transverse Mercator (UTM Zones 1–60 with Norway/Svalbard zone adjustments and polar limits).
- **Elevation Uncertainty**: Elevation formatting includes vertical accuracy (`±X ft`) when reported by device GPS hardware.
- **Watcher Lifecycle**: Hardware GPS watches are automatically engaged on `/emergency` and `/location` and torn down upon tab navigation or backgrounding (`AppState !== 'active'`).
- **Safety Warnings**: Stale fix (>= 120s), low horizontal accuracy (> 100m), and mocked location flags are prominently rendered and travel with copied coordinate text.

### B. Emergency Dispatch & Practice Isolation
- **Practice Mode Isolation**: When Practice Mode is enabled (default state), native telephone dialer (`tel:`) and SMS composer (`sms:`) handoffs are strictly blocked. Simulated alerts confirm action without dialing.
- **Missing vs. Reporter GPS Distinction**: Generic emergency text drafts clearly label the reporter's current GPS location and prompt for third-party reporting. Overdue and separated/missing person drafts omit reporter GPS and explicitly require the subject's last known position (LKP) and time.
- **Authoritative Citing**: King County 911, KCSAR, NWAC, CDC, and NWS are cited as authoritative informational sources without implying creation, review, or sponsorship.

### C. Trip Planning Lifecycle & Notifications
- **Domain Lifecycle API**: Clean state transitions between `draft` -> `current` -> `completed`, supporting draft saving, current plan activation, duplication, and local completion.
- **Opt-In Reminder Scheduling**: `computeTripReminderIntents` enforces strict user opt-in (`remind: true`) and active status (`status: "current"`). Reminders derive trigger timestamps using the plan's saved `timeZone` (e.g. `America/Los_Angeles`, `America/New_York`) and drop past triggers.
- **No False Delivery Invariant**: Local plan completion is strictly separated from external communication. Tapping "Open Safe-Return Text" opens the device SMS composer with check-in copy, accompanied by explicit notices that TrailSafe cannot verify SMS delivery and does not dispatch emergency services.

### D. Wilderness Tools & Hazards
- **Hypothermia & Wind Chill Index**: Preserves objective NWS Wind Chill calculations within validity bounds (temperatures <= 50°F, wind > 3 mph). Incorporates PNW "Cascade Concrete" wet-cold deductions (-12°F damp, -22°F soaked) and diagnostic "Umbles" signs without claiming to clinically diagnose internal core body temperature.
- **Avalanche Slope Inclinometer**: Objective slope angle measurement using device tilt sensors. Classifies slopes into start-zone categories (below prime <30°, prime slab 30°–45°, steep >45°) with explicit warnings that lower-angle slopes remain exposed to avalanches from connected overhead terrain.
- **Water Treatment Timers**: Disinfection presets based directly on CDC guidelines and manufacturer instructions (Aquamira, Potable Aqua, SteriPEN, boiling elevation thresholds). Timers reconcile against wall-clock time (`Date.now()`) across app background/resume cycles.
- **Solar & Canopy Dusk Planning Buffer**: Pure offline NOAA astronomical ephemeris computing sunrise, solar noon, sunset, and twilight. PNW Forest Dusk factors provide conservative planning targets before artificial illumination is required, accompanied by clear-sky baseline disclaimers.

### E. Content Governance & Diagnostics Policy
- **Content Governance (`src/content/governance.ts`)**: All 22 bundled offline guide articles and 5 embedded wilderness tools are tracked in an auditable governance registry recording owner (`Center for Adventure Leadership`), citations, version, last verification date, and next review date.
- **Release Gating**: `isProductionReleaseBlocked()` blocks production builds if any safety content is missing sources, malformed, or overdue for revalidation.
- **Bugsnag Diagnostics Gating (`src/lib/diagnostics.ts`)**: Strictly disabled for final production releases (`releaseChannel === 'production'`) and web builds, while permitted for pre-release, developer, and TestFlight builds.

---

## 3. Native & Device Verification

### Native Simulator Smoke Tests
- Xcode 27.0 compiled iOS **Release** simulator build with bundled Hermes JavaScript and assets (`TrailSafe.app`).
- Native XCTest suite (`tests/native/TrailSafeSmoke.swift`) executed in simulator: verified automatic GPS coordinate acquisition, format switching (DD, DDM, UTM), tab persistence, and Practice Mode safety interlocks.

### Physical iOS Device Installation
- Built signed arm64 Release binary for physical iPhone (UDID `00008150-000E5D110247801C`) using `scripts/install-iphone.sh` with Apple Development signing.
- Verified live capabilities: Siri voice triggers (`OpenEmergencyIntent`), Lock Screen / Action Button shortcuts, hands-free trip completion (`CompleteCurrentTripIntent`), and CoreSpotlight search indexing.

---

## 4. Physical Device Release Checklist

Before submitting a new production release to the Apple App Store or Google Play Store, perform these physical device verification steps:

- [ ] **GPS Hardware & Permissions**:
  - Test initial launch permission prompt (allow precise, allow approximate, deny).
  - Verify cold GPS fix time under dense tree canopy.
  - Confirm vertical accuracy display (`±X ft`) appears when available from GPS hardware.
- [ ] **Emergency & Handoff Safeguards**:
  - Verify Practice Mode toggle is ON by default on fresh installation.
  - Test simulated call and text in Practice Mode: confirm zero cellular handoff.
  - In Live Mode (safe test environment), verify phone dialer opens with 911 pre-filled and SMS opens with structured draft without auto-sending.
- [ ] **Trip Plan Lifecycle & Reminders**:
  - Create, edit, and activate a trip plan with reminders enabled.
  - Verify local notification triggers when overdue deadline is reached.
  - Complete trip: confirm reminders are immediately cancelled.
  - Open Safe-Return text: verify SMS composer opens and delivery verification disclaimer is visible.
- [ ] **Wilderness Tools & Sensors**:
  - Test inclinometer on tilted physical surface: confirm angle updates smoothly.
  - Start water treatment timer, background the app for 2 minutes, and reopen: verify countdown reconciled accurately with wall-clock time.
  - Test audible whistle blast and screen beacon modes.
- [ ] **Offline & Cold Launch**:
  - Turn on Airplane Mode and reboot device.
  - Launch app from cold state: confirm all 22 articles, checklists, tools, and saved plans load instantly without network requests.
- [ ] **Accessibility & Display**:
  - Verify VoiceOver (iOS) and TalkBack (Android) announce coordinates, emergency buttons, and tools clearly.
  - Test under maximum Dynamic Type size and high-contrast outdoor sunlight.
- [ ] **Production Diagnostics Verification**:
  - Verify that the production release artifact has Bugsnag initialization disabled (zero crash diagnostic network traffic).
