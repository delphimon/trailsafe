# TrailSafe application review — October 13, 2026

Reviewed commit: `804dd68cdb9298dcef72a6b684d189cbfa48fa5c`.

TrailSafe has a useful core: preparation, a shareable trip plan, readable coordinates, and short offline guidance. It needs fewer safety claims and fewer modes, with more reliable persistence and clearer handoffs. I would address the high-priority findings below before a public release. This is a review, not an implementation change.

## Evidence and limits

Reviewed the React screens, domain logic, storage, notification integration, bundled articles, device-search modules, voice intents, build configuration, and validation documentation. Consulted Expo SDK 57 documentation and Apple App Intents guidance. Earlier review notes were used as leads; the findings here come from current source and fresh checks.

Fresh checks: 93/93 unit tests passed; TypeScript passed; ESLint returned zero errors and 22 warnings; a fresh web export produced 14 routes; all 10 existing Playwright tests passed in Chrome. The first browser-suite attempt could not launch Chrome inside the sandbox; the permitted run outside it passed. Test copies directed generated screenshots/results to `/private/tmp/trailsafe-review-suite`, preserving tracked screenshots. Logs are `/private/tmp/trailsafe-review-tests.log`, `/private/tmp/trailsafe-review-export.log`, and `/private/tmp/trailsafe-review-e2e.log`.

Manual browser inspection covered Home, Prepare, Tools, and plan creation/activation/completion/editing using fictional data. It reproduced the silent location fallback, timer loss on navigation, and discarded completed-plan edits. No real calls or messages were initiated. Native builds, actual device sensors, airplane-mode cold launch, native reminders, VoiceOver/TalkBack, and native handoffs were not exercised in this review. Existing documentation is not fresh evidence for those capabilities.

## Findings, in priority order

P1 means address before public release because the behavior can mislead a safety decision or falsely report a consequential action. P2 means a concrete reliability/usability defect. Recommendations below distinguish reproduced behavior from source inspection and product judgment.

### 1. P1 — Cold-exposure guidance communicates unsupported medical certainty

`src/content/library.json:503–549`, `src/lib/hypothermia.ts:139–193`, `src/app/tools.tsx:903`.

The article claims that wet clothing causes a fixed 25× heat-loss rate, supplies a 45–60 minute hypothermia timeline, and asserts that cessation of shivering proves a core temperature below 90°F and severe hypothermia. The tool separately tells a person at 55°F that active hiking produces enough warmth to maintain core temperature. These statements go beyond what its inputs establish. Clothing, exhaustion, exposure duration, illness, and the person's condition are missing.

The [Wilderness Medical Society summary](https://wms.org/magazine/1260/2020hypothermia-CPG/default.aspx) assesses patients using multiple clinical signs and distinguishes moderate from severe hypothermia; it does not justify diagnosing an exact temperature from one sign. [CDC guidance](https://www.cdc.gov/winter-weather/prevention/index.html) supports recognizing symptoms and obtaining help, not the app's numerical certainty.

**Recommendation:** replace the risk-ranking calculator with a concise cold/wet exposure guide and symptom/action checklist. Retain a separately labeled wind-chill calculation only if it earns its space. Remove the numerical heat-loss multipliers, precise cooling timeline, and reassurance that movement guarantees warmth. Have medical content checked against specific passages, not merely organization homepages. This recommendation concerns the app's guidance; it is not a replacement field-treatment protocol.

### 2. P1 — Compass instructions reverse magnetic and true north

`src/app/tools.tsx:1532–1535`.

For positive/east declination, the screen says true north is east of magnetic north. The relationship is reversed: magnetic north is east of true north. [NOAA's definition and bearing examples](https://www.ncei.noaa.gov/products/magnetic-declination) make the sign convention explicit. The following sentence also conflates magnetic declination with grid-to-magnetic correction; grid north requires map-projection context the app does not have.

**Recommendation:** correct the relationship, separate true/magnetic/grid north, and add east and west example tests. Present WMM output as an estimate with its model/date, not an exact adjustment independent of map or compass conventions.

### 3. P1 — “Dusk (19:00)” is a fixed time, unrelated to daylight

`src/app/plans/[id].tsx:586–594`.

The trip editor's Dusk shortcut always sets expected return to 19:00. It reads neither trip location nor season. In a Washington winter this is hours after twilight. The app's own solar function gives roughly 16:55 Pacific civil dusk at Snoqualmie Pass on December 21, 2026; that illustrative calculation also has the smaller numerical defect described below.

**Recommendation:** rename the shortcut “19:00 (7 PM)” or remove it. Only offer a calculated dusk time after selecting a trip location and date, with its meaning made explicit.

### 4. P1 — Missing GPS silently becomes Snoqualmie Pass

`src/app/tools.tsx:95–112, 422`, and the declination display at `1539–1543`.

When “GPS” is selected but no fix exists, the solar calculation falls back to the first preset. The screen continues to say “GPS (Searching...)” while presenting precise sunrise, sunset, and headlamp times. This was reproduced in the browser. Denied or disabled location is not surfaced here as it is on Emergency. Existing fixes also get labeled active without using the Emergency screen's age/accuracy warnings.

**Recommendation:** show “Choose a location or enable GPS” until a real fix or explicit preset exists. Display the actual selected location and date beside every result. Distinguish current, stale, denied, and unavailable location. Avoid running GPS for tools that do not need it.

### 5. P1 — Water instructions and selectable timer durations disagree

`src/lib/hiking-tools.ts:214–231`, `src/app/tools.tsx:317–347, 1740–1834`.

The cold-water preset mentions a four-hour treatment case but can only start a 30-minute timer. There is no duration input or four-hour option. The interface presents branded “Product Label” guidance without an exact product, label edition, dose/volume workflow, or cited label available to audit. The warm-water option asserts Giardia treatment in 15 minutes; that claim needs verification against the precise product label. The completion copy correctly says to follow product instructions, but the selected timer still contradicts the longer duration mentioned above it.

[CDC guidance](https://www.cdc.gov/drinking-water/prevention/water-treatment-hiking-camping-traveling.html) emphasizes following the actual product instructions and distinguishes treatment methods and organisms. It also supports the app's one/three-minute boiling distinction.

**Recommendation:** for this simple product, provide a user-set treatment timer with “Use the duration on your product label.” Retain carefully sourced boiling guidance. Remove chemical/UV product presets until exact labels and all required conditions are represented. Do not imply that elapsed time alone verifies potable water.

### 6. P1 — Voice/deep-link actions announce success before storage succeeds

`src/app/plan/current/[action].tsx:36–53, 69–98`.

Start/completion calls `void update(...)`, launches reminder changes, immediately reports success, and navigates. A rejected AsyncStorage write is not awaited by the dialog's error wrapper. The person can be told a trip completed while storage still contains an active trip; reminders can already have been cancelled. Lifecycle results are also calculated from a captured array instead of the latest value inside the serialized store mutation.

**Recommendation:** one shared asynchronous command for each lifecycle action. Compute against the latest stored state, await the durable save, then reconcile reminders and report the outcome. Inject storage and notification failures in tests. Never make notification permission or scheduling failure prevent saving an otherwise valid plan; report the two outcomes separately.

### 7. P1 while retained — Practice Mode silently becomes live

`src/state/app.tsx:64–81`.

Practice starts false, ends when the app becomes inactive/backgrounded, and expires after 15 minutes. This contradicts both the guide and validation document, which describe default-on isolation. Someone returning from another app can have a different emergency-button behavior without explicitly choosing it. The native confirmation/composer still provides an additional barrier; this is not evidence that the app automatically sends a message or places a call.

**Recommendation:** remove global Practice Mode from the consumer experience, as discussed below. Until removal, do not silently exit a mode explicitly promising isolation. Test interception belongs at the transport boundary regardless of the consumer UI.

### 8. P2 — Saving completed-plan edits discards them

`src/app/plans/[id].tsx:140–147`; `src/lib/plans.ts:407–426`.

Reproduced: create a plan, mark Current, complete it, edit its title, Generate Plan, then Save Plan. The edited title appears in the preview, but saving restores the old title and displays “Plan saved on this device.” The completed branch calls `completeTrip(id, storedPlans)` instead of saving edited values. Share Trip Plan Now uses the same save path, so it can share the old values too.

**Recommendation:** separate editing a completed record from the transition to completed. Either save edits while preserving status or make completed records explicitly read-only and offer Duplicate. Add a persistence regression test.

### 9. P2 — Water timer disappears during ordinary navigation

`src/app/tools.tsx:327–378`.

Reproduced: start the 30-minute timer, go Home, return to Tools → Planning. It is back at 30:00 with Start Timer. The deadline exists only in screen state. Wall-clock reconciliation fixes suspension only while that component/state survives; it does not survive unmounting or process death. There is no scheduled completion notification.

**Recommendation:** persist the selected duration, deadline, and running/paused state outside the screen. Reconcile on launch and resume. If a notification is offered, make it explicit and local; otherwise explain that completion is visible when reopening the app. Include navigation and force-quit cases in acceptance tests.

### 10. P2 — Android safe-return texts are reported as unsent even when status is unknown

`src/app/plans/[id].tsx:106–111`, `src/app/plans/index.tsx:185–194`.

Both paths treat every result other than `sent` as “not sent.” The installed SDK 57 contract in `node_modules/expo-sms/src/SMS.ts:31–39` and Android implementation in `android/.../SMSModule.kt:85–87` state/return `unknown` on Android. The user may have sent successfully. False failure can be as confusing as false delivery.

**Recommendation:** distinguish cancelled from unknown. For unknown, say “Check your messaging app; TrailSafe cannot verify sending or delivery.” Use one helper across both screens. No real SMS was sent during review.

### 11. P2 — Reminder cleanup and failure handling are incomplete

`src/app/plans/index.tsx:218–222`, `src/state/store.tsx:89–99`, `src/lib/notifications.ts:14–38, 48–56`.

Deleting a plan and resetting stored app data do not cancel its pending OS notifications. Scheduling can silently skip denied permission, and cancellation errors are swallowed. Several callers discard scheduling promises. A checked reminder option therefore does not prove an actual reminder exists, and old reminders can outlive deleted plans.

**Recommendation:** reconcile only TrailSafe-owned notifications from persisted plans after all lifecycle operations and on launch. Report scheduled/permission-denied/failed status. Keep overdue state separate from opting into reminders: currently `isOverdue` returns false whenever `remind` is false, hiding an overdue in-app status because a person declined alerts.

### 12. P2 — Solar calculations contain a degrees/minutes/seconds conversion error

`src/lib/solar.ts:187–193, 348–354`.

Mean obliquity evaluates as `23 + (26 + seconds) / 60 / 60`. The 26 represents arcminutes and must not be divided by 3,600. The intended conversion is `23 + (26 + seconds / 60) / 60`. The error occurs in both event and instantaneous-position calculations.

An isolated corrected copy in `/private/tmp` shifted Seattle solstice sunrise/sunset by about 147–154 seconds and solar elevation by 0.4–0.5 degrees. This is a differential reproduction, not a full independent astronomical certification. Existing tests accept broad daylight ranges and miss the error. [NOAA calculation details](https://gml.noaa.gov/grad/solcalc/calcdetails.html) provide reference material and explain observational uncertainty.

**Recommendation:** correct the conversion, avoid duplicate astronomy formulas, and compare fixed dates/locations against independent reference fixtures. Treat 30/60-minute canopy deductions as selectable planning buffers, not measured forest darkness. Replace “Headlamp needed in X” with “Planning target: have your headlamp ready by X; use it sooner if needed.”

### 13. P2 — Cancelling a voice action leaves a permanent updating screen

`src/app/plan/current/[action].tsx:23–27, 32–55, 113–121`; `src/components/trailsafe/shell.tsx:143–148`.

Source inspection: the route sets `processedRef` before presenting the dialog. Cancel only closes the shared dialog; there is no cancellation navigation or idle state. The route continues showing an Updating spinner even though nothing is happening. Changing/replaying an action while the component survives also needs deliberate handling of that ref.

**Recommendation:** cancelled actions return to the relevant plan. Keep the spinner only while actual work is awaited. Voice descriptions should say the action opens local completion; it cannot prevent false alarms by notifying a contact. Validate voice behavior with existing shortcuts preserved.

### 14. P2 — Release enforcement is weaker than the documentation claims

`src/content/governance.ts:268`, `tests/governance.test.ts`, `ci/ci.yml`, `package.json`, `app.json`, `src/lib/diagnostics.ts:17–37`, `src/app/about.tsx:142`.

The governance function is exercised by tests but not called by a production build/export gate. The “current” test date is fixed at October 2, 2026, so it will not start rejecting expired reviews as time advances. GitHub Actions configuration sits under `ci/ci.yml`; no `.github/workflows` directory exists in this checkout. That is a prepared workflow, not an active GitHub workflow.

The diagnostics helper defaults Release builds to production, but there is no checked-in explicit channel configuration for internal/TestFlight/store builds. About unconditionally says Bugsnag diagnostics are collected, despite the production/web gate disabling initialization. Production native telemetry was not inspected in an artifact.

**Recommendation:** enforce content checks with the actual release date and a complete inventory during packaging. Install CI in the recognized workflow directory. Select the diagnostics policy explicitly per artifact and make privacy copy match it. Update validation documentation to distinguish unit assertions, source intent, browser proof, and device evidence.

## Practice Mode decision

I recommend removing it from normal use. Most of TrailSafe is already safe to explore. A global mode changes the meaning of prominent emergency buttons and creates extra state to remember under stress.

The actual code calls `Linking.openURL("tel:911")` and `SMS.sendSMSAsync`, not a background calling/sending service. [Apple documents confirmation for native tel URLs on iOS 10.3 and later](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/PhoneLinks/PhoneLinks.html). The installed Expo SMS module opens the system composer; the user controls sending. Android dialing/handoff behavior should be confirmed on supported devices without making a live 911 test call; [Android documents the difference between dialer and direct-call intents](https://developer.android.com/guide/components/intents-common#Phone).

Keep clearly labeled Call 911 and Text 911 actions and a brief description of the handoff. Do not add a routine second app confirmation where the OS already provides the necessary interaction. For Text 911, offer a short editable draft before the composer if it resolves the missing-person problem: “Help at my location” versus “Report someone elsewhere.” That choice adds essential context, whereas a global practice switch does not. The generic draft currently inserts the reporter's GPS and asks them to replace it; a sentence after coordinates is weaker than selecting the right location semantics before constructing the draft (`src/lib/emergency.ts:31–38`).

If training/demo use is still wanted, make it a separate “Preview an emergency message” flow that cannot invoke phone/SMS transports. Automated and native tests should inject inert handoff implementations independently of any consumer mode. Removing Practice Mode must not remove test isolation.

## A smaller, clearer product

| Area | Keep | Simplify or defer |
| --- | --- | --- |
| Prepare | Essentials, trip plan, reusable contact/vehicle details, external condition links | One clear saved draft flow; less repeated caution text; no mandatory optional SAR detail |
| Help | Large call/text actions, coordinates with uncertainty, concise incident guidance | Remove global modes; put coordinates near the top; move background explanations below immediate actions |
| Guide | Small searchable offline library, concrete actions, source/version traceability | Remove dramatic scientific claims, repeated boilerplate, and clinical detail beyond the intended reader |
| Tools | Sunrise/sunset, modest hiking-time estimate, reliable treatment timer, simple signaling guidance | Remove the hypothermia risk calculator; defer avalanche interpretation and elaborate beacon/audio modes until device behavior and value are established |

Four primary destinations—Prepare, Help, Guide, Tools—are sufficient. Home currently duplicates their entry points; a Prepare landing screen can carry the current-trip card and an always-visible Help action. This is a design recommendation, not a required navigation rewrite.

Trip entry should save progress clearly and safely. “Generate Plan” currently changes only the preview state; it does not save. Copy and PDF can use unsaved text, while Share performs a save. Replace this with “Save and preview” plus an explicit saved indicator, native date/time controls, and optional extra details. Warn before discarding unsaved work or recover it as a draft. Editing an active trip should not offer “Save Draft” as the only obvious save button: that demotes it and cancels reminders. Keep the distinction between storing a plan and confirming that a contact received it.

The Ten Essentials count excludes food while communication occupies a slot. Food appears separately, so it is not absent, but 10/10 can be shown without checking it. Align the named ten systems with a declared source such as the [NPS list](https://www.nps.gov/articles/10essentials.htm), and add communications as an extra. Checklist items also use positional IDs (`ess-0`, etc.); use stable IDs before changing ordering so old checkmarks cannot silently move to different gear.

The design system provides generous primary touch targets and useful contrast tests. Tools bypasses it with hard-coded warning colors, dense explanatory cards, horizontal preset strips, and many small adjustment buttons. Test actual rendered warning text in both themes; token tests do not prove those combinations. Remove the visible “Planned Wilderness Tools Roadmap” and technical terms such as GCS/byte budgets from the consumer screen. A hiker looking for a timer should not have to understand four secondary categories or scroll through unrelated navigation and pace calculators.

## Offline behavior, battery, and expansion

The native architecture is appropriate for offline operation: guides and fonts are bundled, calculations are local, storage is local, and location acquisition does not depend on an app backend. The browser test proves navigation after an online launch with the network disabled. It does not prove native cold launch or offline web reload; the web export has no service worker/offline shell.

“Works offline” should name the boundary: guidance, plans, checklists, coordinates when a fix is available, and tools work locally; calls/messages need an available communications path; external maps need their own downloaded data; forecasts and resource links require connectivity. TrailSafe does not supply offline maps, dispatch, or live conditions. These are sensible scope limits.

`app.json` still checks for OTA updates on launch with zero cache fallback delay. That can be compatible with offline functionality, but not with a literal promise of zero network requests. Store-delivered updates alone would reduce complexity; if OTA stays, version safety content and avoid surprising changes during an active outing. Never make expired review metadata block access to already-installed emergency guidance in the field.

GPS consumers in Tools/articles use mount effects rather than explicit navigation focus; sensors similarly depend on an active boolean without full focus/background/availability handling. Verify that retained native Stack screens stop GPS, audio, vibration, and motion updates when hidden. Verify screen-beacon behavior under auto-lock and Silent Mode audio behavior on devices. Avoid presenting a phone speaker as a substitute for carrying a whistle.

For expansion, use a small bundled region definition: region ID, agencies and links, jurisdiction-specific wording, sources/review dates, trailhead presets, units, and emergency guidance. Keep universal content shared. Separate trip location/time zone from device location/time zone. Current plan time zones are inherited from the device with no editor control, and the parser normalizes a nonexistent Pacific 02:30 on March 14, 2027 to 03:30 instead of rejecting it. Resolve DST ambiguity and validate actual instants before claiming nationwide timing correctness. Add polar-day/night fixtures before Alaska support; current solar logic treats missing sunset/twilight as night and invents a fallback sunrise interval.

Device search is optional convenience, not an offline safety dependency. The Android module submits every article as a dynamic shortcut without limiting to the platform's allowance (`DeviceSearchModule.kt:44`). Native indexing errors are swallowed while the guide version is still marked indexed (`modules/device-search/index.ts:31–37`, `src/lib/search-indexing.ts:96–98`). Return a real success result and bound Android shortcuts; do not keep retrying only after content changes. The guide hash includes versions/titles, not article bodies or keywords, despite its description. Include the indexed payload or strictly enforce version bumps. Preserve existing voice identifiers and phrases during simplification.

## Suggested implementation order and acceptance

1. Correct/remove misleading cold, water, compass, and daylight claims; remove silent location substitution. Attach focused reference-based tests.
2. Simplify emergency handoffs and remove consumer Practice Mode while preserving an independent test transport. Keep missing-person location semantics explicit.
3. Fix durable plan saving, completed edits, safe-return outcomes, reminder reconciliation, and cancellation. Exercise failure paths as well as success paths.
4. Persist timers, streamline trip entry and Tools, and audit screen-focus/battery behavior. Preserve existing on-device data and stable checklist IDs.
5. Enforce release checks, reconcile documentation, then run a fresh device acceptance pass.

Device acceptance should cover airplane-mode cold launch after restart; saved plans and every article without network; approximate/denied/stale location; timer navigation/background/process death; notification denial and cleanup; voice cancellation/replay; large text and screen readers; sunlit readability; sensor calibration/availability; inert call/text handoff tests; and artifact-level diagnostics behavior. These are specific outstanding checks, not claims that the current build has passed them.
