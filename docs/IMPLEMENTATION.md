# TrailSafe implementation checkpoint — October 13, 2026

The application review was implemented with the user's two overrides: remove the water timer entirely, and remove the content-governance capability. Content is reviewed directly in the app before release; citations remain available.

Implemented:

- Following usability feedback, restored Home and added a dedicated Trips destination alongside Prepare, Help, Guide and Tools. Home exposes trip access; Trips groups Current/Upcoming/Past; Prepare focuses on essentials and gear.
- Removed consumer Practice Mode. Help Text 911 directly opens the system composer for help at the caller location in one app tap. A separate someone-elsewhere/edit path keeps the subject location explicit and omits reporter GPS. Tests supply inert handlers; native smoke tests never tap transports.
- Replaced cold-risk scoring and exact cooling/temperature claims with concise cold/wet symptom/action guidance.
- Tools now has always-visible Daylight, Compass and Hiking selectors, with the headlamp time and compass answer ahead of expandable settings. Hiking has a prominent duration, native sliders and restored quick choices; water and signaling guidance remain under More. Removed slope classification, audio/beacon modes, roadmap copy and all water countdown code/product presets.
- Corrected the east/west compass wording and mean-obliquity conversion. Solar estimates match independent USNO solstice fixtures within 90 seconds; polar-day/night branches do not invent events. Tools requires explicit location and shows fix warnings.
- Shared durable trip commands: await storage, preserve concurrent changes, save completed edits, then reconcile reminders. Voice cancellation returns to the plan, with no idle spinner.
- Unified SMS outcome wording for cancelled, unknown and reported sent. No outcome implies delivery.
- Reconcile TrailSafe-owned local reminders on launch and saved-plan changes/deletion/reset; permission and failures are visible separately. Overdue status is independent of notification opt-in.
- Save and preview persists before displaying the preview. Active/completed edits preserve status. Native date/time controls and editable trip time zone; DST gaps/repeated hours are rejected. App navigation/back controls protect unsaved edits, with browser unload protection.
- Food is part of the named Ten Essentials, communications an additional item. Legacy checkmarks migrate to stable identifiers without changing meaning.
- Hash actual indexed text/keywords; failed indexing remains retryable. Android dynamic shortcuts are bounded after accounting for static shortcuts. Intent identifiers and phrases are preserved.
- Activated `.github/workflows/ci.yml`; explicit EAS diagnostics channels and matching privacy wording. Launch OTA checks are disabled; manual checks remain available.

Offline scope: local guides, stored plans, checklists and calculations are available without network. GPS availability depends on device/location conditions. Calls/texts need an available communication path. Live resources and maps require separate connectivity/downloads. The browser export is a preview, not an installed offline web app.

Sources used for content corrections:

- https://www.cdc.gov/winter-weather/prevention/index.html
- https://wms.org/magazine/1260/2020hypothermia-CPG/default.aspx
- https://www.cdc.gov/drinking-water/prevention/water-treatment-hiking-camping-traveling.html
- https://www.ncei.noaa.gov/products/magnetic-declination
- https://aa.usno.navy.mil/data/RS_OneDay
- https://www.nps.gov/articles/10essentials.htm

See `VALIDATION.md` for fresh evidence and device limits. The review document describes the original defects and is retained as the implementation rationale. Prototype extraction writes an archival file in `/private/tmp` and does not overwrite app-reviewed content.

Dependency update: Router 58 and the SDK 58 next/beta graph, with React 19.3 and Expo-pinned RN 0.88 RC. Bugsnag’s unsupported Expo wrapper is replaced with its current React Native SDK and channel-gated native setup. See `DEPENDENCIES.md` for compatibility pins and outstanding upstream advisories.
