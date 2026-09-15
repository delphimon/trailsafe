# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

# TrailSafe — Developer & Agent Architecture Guide

This guide gives developers and AI agents the full context needed to build, test, debug, and extend **TrailSafe** without having to read through every line of source code.

---

## 1. Project Mission & Non-Negotiable Safety Principles

**TrailSafe** is an offline-first wilderness safety companion for hikers and outdoor recreationists in the Pacific Northwest (PNW) and Washington State. It provides instant emergency coordinate translation, safety checklists, offline first-aid/survival guides, and verifiable trip plans structured for Search and Rescue (SAR) incident commanders and 911 dispatchers.

### Core Safety Invariants
1. **Never Make Live 911 Calls or Texts in Tests or Practice**:
   - In `Practice Mode` (the default toggle state on Emergency screens), all emergency triggers run simulated handlers (`src/lib/emergency.ts` and `src/state/app.tsx`). Native phone and SMS handoffs MUST NEVER execute.
2. **Never Insert Caller GPS for Missing/Overdue Persons**:
   - In `buildEmergencyDraft()`, if the situation is overdue or missing person, the draft prompts for the subject's *last known location* rather than inserting the caller's current GPS position.
3. **No Unmonitored Safety Illusion**:
   - TrailSafe never claims or implies background dispatch monitoring, cloud synchronization, or automatic emergency signaling. If a user is overdue, the app relies on the hiker's chosen emergency contact to notify 911.
4. **Offline & Client-Side Privacy**:
   - There are zero accounts, analytics, advertising SDKs, cloud databases, or telemetry trackers. All user data is stored strictly on-device in `AsyncStorage`.

---

## 2. Tech Stack & Environment

- **Framework**: React Native 0.86.3 with Expo SDK 57 (SDK version 57.0.20)
- **Routing**: Expo Router 57 (`src/app/` file-system routing)
- **Language**: TypeScript 6 (strict mode enabled)
- **State & Storage**: React Context + `@react-native-async-storage/async-storage`
- **Coordinate Transformations**: `proj4` (WGS84 projection to UTM zones 1–60)
- **Typography**: `@expo-google-fonts/public-sans` (body) & `@expo-google-fonts/barlow-condensed` (headings)
- **Icons**: `lucide-react-native`
- **Unit Testing**: Node.js test runner (`node:test`) executed via `tsx`
- **End-to-End Testing**: Playwright (`@playwright/test`) running against an exported static web build served by `scripts/serve-preview.cjs` on port `8082`

---

## 3. Directory & File Structure

```
trailsafe/
├── modules/
│   └── device-search/            # Local Expo module for CoreSpotlight (iOS) & shortcuts (Android)
│       ├── ios/                  # Swift CoreSpotlight indexing implementation
│       ├── android/              # Kotlin ShortcutManagerCompat implementation
│       ├── index.ts              # Universal TypeScript module interface
│       └── expo-module.config.json
├── plugins/
│   ├── with-ios-scenes.cjs       # Scene lifecycle configuration for iOS 27
│   ├── with-app-intents.cjs      # CNG plugin injecting App Intents & Android shortcuts.xml
│   └── ios/
│       ├── TrailSafeIntents.swift # Siri AppIntents, AppShortcutsProvider, Action Button hooks
│       └── TrailSafeSceneDelegate.swift # Intercepts CoreSpotlight item selection
├── src/
│   ├── app/                      # Expo Router screens (routes map 1:1 to URL paths)
│   │   ├── _layout.tsx           # App root: font loading, splash, StoreProvider, AppProvider, Shell, Search Indexing
│   │   ├── index.tsx             # Home screen (Emergency hero, quick links, current plan banner)
│   │   ├── emergency.tsx         # Emergency screen (LocationCard, Call/Text 911, Practice toggle)
│   │   ├── prepare.tsx           # Checklists (Ten Essentials, phone prep, trip presets)
│   │   ├── guide.tsx             # Offline survival & first-aid library search (supports ?search= query)
│   │   ├── article/[id].tsx      # Dynamic article reader for library topics
│   │   ├── plans/
│   │   │   ├── index.tsx         # List of saved trip plans (Drafts, Current, Completed)
│   │   │   └── [id].tsx          # Trip plan editor & reader (new plan, edit, share, PDF)
│   │   ├── plan/
│   │   │   └── current/
│   │   │       └── [action].tsx  # Hands-free trip completion/start route (/plan/current/complete)
│   │   ├── profile.tsx           # Hiker reusable profile (Name, Phone, Car 1, Car 2, Comms)
│   │   ├── about.tsx             # SAR info, privacy, Native Build & OTA Update details
│   │   └── resources.tsx         # Directory of verified PNW SAR and 911 links
│   ├── components/trailsafe/     # Reusable UI library
│   │   ├── theme.ts              # Pure TypeScript color tokens, typography, and contrast specs
│   │   ├── ui.tsx                # Re-exports theme; Screen, Card, Button, Field, Chip, etc.
│   │   ├── location-card.tsx     # GPS display card with DD/DDM/UTM format selector
│   │   ├── emergency-actions.tsx # Call 911, Text 911 buttons and Practice Mode toggle
│   │   ├── shell.tsx             # Global bottom tab bar, modal dialogs, and toast banners
│   │   └── article-body.tsx      # Rich content renderer for offline library articles
│   ├── hooks/
│   │   └── use-location.ts       # Automatic foreground GPS tracking with lifecycle management
│   ├── lib/                      # Pure domain logic (no React dependencies)
│   │   ├── coordinates.ts        # DD, DDM, UTM math, WGS84 projection, fix warnings
│   │   ├── emergency.ts          # Emergency message drafts and practice interlock
│   │   ├── plans.ts              # TripPlan schema, validation, overdue calculations, HTML export
│   │   ├── persistence.ts        # Storage schema, parseStoredData validation, profile migration
│   │   ├── export-plan.ts        # PDF generation (expo-print) and share sheet (expo-sharing)
│   │   └── search-indexing.ts    # Guide content hashing and CoreSpotlight/Android indexing
│   ├── state/
│   │   ├── store.tsx             # Queued serialized storage store (StoreProvider, useStore)
│   │   └── app.tsx               # UI dialogs, toasts, practice mode, emergency actions (useApp)
│   └── content/
│       ├── library.json          # 20 bundled offline emergency & survival articles
│       └── index.ts              # Typed search and retrieval interface for library articles
├── tests/
│   ├── coordinates.test.ts       # Unit tests for coordinate math & format edge cases
│   ├── emergency.test.ts         # Unit tests for practice isolation and draft creation
│   ├── plans.test.ts             # Unit tests for plan validation, storage, and dual vehicle migration
│   ├── theme.test.ts             # Automated WCAG AA/AAA relative luminance contrast suite
│   ├── search-indexing.test.ts   # Unit tests for content hashing, keyword extraction, and hands-free actions
│   ├── e2e/
│   │   └── app.spec.ts           # 9 Playwright end-to-end browser tests
│   └── native/                   # Native iOS smoke tests (XCTest)
├── scripts/
│   ├── serve-preview.cjs         # Static HTTP server for web export preview on port 8082
│   ├── install-iphone.sh         # Fast local build & install script for physical iOS device
│   └── build-content.py          # Offline content processing utility
├── docs/                         # Extended documentation (ARCHITECTURE.md, IMPLEMENTATION.md, VALIDATION.md)
├── app.json                      # Expo application manifest
└── playwright.config.ts          # E2E test configuration
```

---

## 4. Core Subsystems

### A. Location & Coordinate Subsystem (`src/lib/coordinates.ts`, `src/hooks/use-location.ts`)
- **Automatic Lifecycle**: `useAutomaticLocation` starts watching position automatically when mounted on `/emergency` or `/location`. When the user switches tabs or backgrounds the app (`AppState !== "active"`), hardware GPS watches are immediately torn down.
- **Three Supported Formats**:
  1. **DD**: Decimal Degrees (`47.42537° N, 121.41382° W`) — standard for digital mapping and 911 dispatch.
  2. **DDM**: Degrees & Decimal Minutes (`47° 25.522′ N, 121° 24.829′ W`) — standard for King County Sheriff Air Support helicopters. Rounds to thousandths of a minute; carries 59.99995+ min into degrees.
  3. **UTM**: Universal Transverse Mercator (`10T · Northern hemisphere, 619574 m E, 5253549 m N`) — standard for ground search teams and topographic maps. Uses `proj4` WGS84 projection and includes Norway/Svalbard zone adjustments.
- **Warning Thresholds**:
  - Fix age >= 120 seconds -> **STALE LOCATION** warning banner.
  - Horizontal uncertainty > 100 meters -> **LOW ACCURACY** warning banner.
  - Fix flagged with `mocked: true` -> **SIMULATED LOCATION** label.

### B. Trip Planning & Dual Vehicles (`src/lib/plans.ts`, `src/app/profile.tsx`, `src/app/plans/[id].tsx`)
- **Trip Plan Lifecycle**: Plans transition between `draft` -> `current` -> `completed`.
- **Reusable Profile & Dual Vehicles**:
  - `Profile` supports two vehicles: Car 1 (`vehicle`, `plate`) and Car 2 (`vehicle2`, `plate2`).
  - When creating a new trip plan (`/plans/new`), quick-select chips (`Car 1` / `Car 2`) allow one-tap selection of which vehicle is being parked at the trailhead.
- **Explicit Deadlines**: Trip plans enforce explicit return and overdue dates/times. Overnight trips carry across midnight.
- **Safe Return Notification**: One-tap SMS check-in draft (`buildSafeReturnDraft`) confirms safe completion to emergency contacts.

### C. Storage & Persistence Layer (`src/lib/persistence.ts`, `src/state/store.tsx`)
- **Storage Key**: `trailsafe.local.v1` in `AsyncStorage`.
- **Concurrency & Integrity**: All updates are serialized through a promise queue (`queue.current`). If AsyncStorage contains unparseable data, the loader throws and sets `writable = false`, blocking any overwrite to guarantee zero data loss.
- **Migration**: `parseStoredData` normalizes legacy single-vehicle profiles by initializing `vehicle2: ""` and `plate2: ""` seamlessly.

### D. Design System & WCAG Contrast Standards (`src/components/trailsafe/theme.ts`, `ui.tsx`)
- **Token Architecture**: `theme.ts` is pure TypeScript (no React Native runtime dependencies) so it can be tested directly in Node via `tsx`.
- **Semantic Tokens**: Avoid raw color references. Use semantic tokens:
  - Surfaces: `paper`, `cardBg`, `headerBg`, `locationCardBg`, `checkBg` (elevated slate for checked items and active tabs).
  - Text: `ink`, `muted`, `heading` (12.9:1 in dark mode), `kicker` (8.2:1 in dark mode), `headerText`.
  - Buttons: `btnPrimaryBg/btnPrimaryText` (6.56:1 in dark mode), `btnOutlineBorder/btnOutlineText` (11.75:1 in dark mode), `orange` (4.07:1 for bold text).
  - Badges/Toasts: `toastBg/toastText`, `chipSelectedBg/chipSelectedText`.
- **Automated Verification**: `tests/theme.test.ts` calculates relative luminance and asserts WCAG AA compliance (>= 4.5:1 for body/subtext, >= 3.0:1 for large bold text) across all light and dark combinations.

### E. Voice Assistant, App Intents & Device Search Subsystem (`modules/device-search`, `plugins/with-app-intents.cjs`, `plugins/ios/TrailSafeIntents.swift`, `src/lib/search-indexing.ts`, `src/app/plan/current/[action].tsx`)
- **Emergency / Panic Trigger**: Siri ("Open Emergency in TrailSafe", "I need help in TrailSafe") or Action Button / Lock Screen controls open `trailsafe://emergency` for immediate GPS acquisition and 911 SMS prep without live dispatch risk.
- **Hands-Free Trip Management**: Assistant commands ("Mark my trip complete in TrailSafe", "Start my trip in TrailSafe") invoke `trailsafe://plan/current/complete` or `start`. It updates persistent storage and alerts hikers to confirm safe return with emergency contacts, preventing false SAR callouts.
- **Safety Guide Voice Search**: "Search in TrailSafe" deep-links to `trailsafe://guide?search=<query>` for instant filtering across all 20 offline survival articles.
- **On-Device Search Indexing**:
  - `modules/device-search`: Local Expo module interfacing with CoreSpotlight (`CSSearchableIndex`) on iOS and `ShortcutManagerCompat` on Android.
  - `TrailSafeSceneDelegate.swift`: Intercepts `CSSearchableItemActionType` to route directly to `trailsafe://article/[id]`.
  - OTA Compatibility: `getGuideContentVersion` hashes article contents. Whenever an OTA update via `expo-updates` changes guide content, the app detects the hash change and silently re-indexes CoreSpotlight/Android shortcuts on launch.
- **Continuous Native Generation (CNG)**: `plugins/with-app-intents.cjs` injects `TrailSafeIntents.swift`, `Info.plist` activity types, and Android `shortcuts.xml` dynamically during `npx expo prebuild --clean`.

---

## 5. Development & Testing Commands

### Standard Checks
```sh
# 1. Run all 48 unit & contrast tests
npm test

# 2. Strict TypeScript type check
npm run typecheck

# 3. Linter
npx eslint .
```

### Static Web Export & Playwright E2E Tests
Playwright tests run against the production web export served locally by `scripts/serve-preview.cjs`:

```sh
# 1. Export production web bundle (requires BypassSandbox outside sandbox)
EXPO_NO_TELEMETRY=1 npx expo export --platform web

# 2. Start the local preview server in the background (runs on port 8082)
node scripts/serve-preview.cjs &

# 3. Run Playwright E2E test suite (Chrome browser)
TRAILSAFE_BROWSER="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:e2e
```

### Physical iOS Device Deployment
To build and install a signed Release build directly on a connected iPhone:
```sh
bash scripts/install-iphone.sh YOUR_IPHONE_UDID YOUR_APPLE_TEAM_ID
```

---

## 6. Critical Agent & Contributor Gotchas

1. **Expo Versioned Docs**: Always consult `https://docs.expo.dev/versions/v57.0.0/` for API contracts in SDK 57.
2. **Web Export Sandbox**: `npx expo export` traverses parent directories to find workspace root (`/Users/andrew/package.json`). Inside agent sandbox environments, always execute `expo export` with `BypassSandbox: true`.
3. **Preview Port is 8082**: `scripts/serve-preview.cjs` serves on port `8082` (to avoid standard Metro port 8081 conflicts). Playwright's `baseURL` in `playwright.config.ts` defaults to `http://localhost:8082`.
4. **Node Test Runner Separation**: The unit test runner uses `tsx --test tests/*.test.ts`. Any file imported by tests must NOT import React Native components that rely on JSX runtime without transpilation. In `src/lib/search-indexing.ts`, keep domain functions pure and load `@react-native-async-storage/async-storage` and `device-search` lazily inside `indexGuideContent()`.
5. **AppIntents Phrase Parameter Restrictions**: In Swift `AppShortcutsProvider.appShortcuts`, trigger phrases cannot interpolate open-ended primitive `String` parameters (e.g. `\(\.$query)`). Only `AppEntity` or `AppEnum` types are permitted. Use static phrases (e.g., `"Search in \(.applicationName)"`) so Apple's `appintentsmetadataprocessor` compiles successfully.
6. **Preserve User Rules**: Always keep the user rule `# Expo HAS CHANGED` at the very top of `AGENTS.md`.


