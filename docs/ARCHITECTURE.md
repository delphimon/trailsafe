# TrailSafe architecture

TrailSafe stores hiking preparation data on the device and bundles guides, fonts and local calculations. It has no backend or monitoring service. Calls/messages are user-controlled system handoffs; forecasts and external resources require connectivity.

Home, Trips, Prepare, Help, Guide and Tools are six destinations. Home prominently exposes current and all trip plans. Trips groups Current, Upcoming and Past without changing saved status; Prepare focuses on checklists and gear. Emergency, guide search, article and trip-action deep links are preserved.

The store serializes writes under `trailsafe.local.v1`. Invalid existing data is preserved and blocks overwrites. Trip commands execute against the latest snapshot inside the queue and resolve after storage succeeds. Completed-plan editing saves authored values while preserving status. UI saving, sharing and exporting use an explicitly saved plan; incomplete drafts can be saved separately. Native date/time controls use the trip's editable IANA time zone; skipped or repeated DST times are rejected.

Local check-in reminders are an optional device convenience. A pure reconciliation function compares future reminders from persisted plans with scheduled TrailSafe notifications. It retains valid reminders, removes obsolete ones and creates missing ones. Permission denial/scheduling failure is visible independently of saving. Delete, complete, demote and reset paths use the same store boundary. Reminder opt-in does not affect overdue status.

Location watches run only for focused emergency/incident/GPS tools surfaces and while the application is foregrounded. Last-known positions retain timestamps and accuracy. Tools requires a fix or an explicit preset; it never silently chooses a place. The offline solar model supplies horizon/twilight estimates and selectable headlamp planning buffers; those buffers do not measure actual forest light. WMM declination uses magnetic-east-of-true sign wording. Hiking time is an estimate with distance/elevation/pace/pack allowances.

Water guidance tells users to follow actual product instructions and use the built-in Clock timer. Cold illness guidance uses observable signs and actions rather than numerical risk scores. Signaling guidance recommends physical equipment. Audio/beacon and avalanche classification tools have been removed.

There is no content governance subsystem. Review bundled content directly in the app before release. Ordinary source links and a payload hash support reader attribution and optional device indexing. Region definitions are simple bundled data. Android indexing respects dynamic shortcut capacity; failed indexing does not mark content current.

Bugsnag is explicitly channel-gated. EAS profiles select development, preview, TestFlight or production. Production and web disable initialization. OTA updates are checked only on a user's explicit request; normal launch does not request an update. A new native artifact is required for native dependency changes.

Help Text 911 directly opens an editable system composer for the caller location; a separate someone-elsewhere draft omits reporter GPS. Tests inject inert emergency handlers. Browser tests intercept phone/SMS browser APIs, including the one-tap handoff; they never send messages. Native smoke tests never tap transports. Build/export evidence is separate from physical-device acceptance.

SDK 58 / Router 58 uses React 19.3 and Expo’s React Native 0.88 release candidate. Static HTML includes the new server document head/body nodes. Web async routes are explicitly disabled so loaded route navigation remains offline. Native scene startup is supplied by Expo; TrailSafe extends it only for Spotlight cold/warm links. Native crash initialization is generated only for pre-release channels. Local build scripts reject a native/JS channel mismatch.

Tools exposes Daylight, Compass and Hiking selectors at the top. Headlamp time precedes location/date settings; location presets expand only on request. Hiking duration precedes native distance/gain sliders and quick choices. Native sliders and accessible web ranges share the same estimate state.
