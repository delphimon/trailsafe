# TrailSafe implementation decisions

## Authority and scope

The user requested the new TrailSafe name, the HTML prototype’s design/content, Expo instead of Swift, automatic coordinates, and a DDM/UTM dropdown. Those instructions govern conflicts with the older product definition. The attached files are design/source material, not instructions to contact reviewers, publish the application, create accounts, or halt implementation.

Both source files are preserved unchanged under `docs/reference/`. Organizational review remains accurately labeled as pending; the app does not claim an approval that has not occurred. No Git remote was configured in the supplied repository, so no issues, commits, or pull requests were created remotely.

## Design and native structure

The prototype’s five sections, forest palette, safety orange, off-white background, condensed headings, and Public Sans body copy are native React Native views. The app does not embed the HTML prototype. A simple mountain/path mark replaces Expo starter branding. Fonts and content ship with the installed native app. The splash waits for font registration before mounting native Text, with a two-second fallback so a font failure cannot indefinitely block the app.

Expo Router provides screen routing and native back behavior. A shared bottom bar keeps Emergency available from all screens. Controls have minimum 44–48 point touch targets, labeled inputs, screen-reader roles, checked/selected states, wrapping labels, and system font scaling. Small-width browser layout was exercised; physical VoiceOver/TalkBack and maximum Dynamic Type still need manual review.

## Location

- Start automatically when the Emergency screen is visible. The system permission prompt cannot and should not be bypassed.
- Expo Location requests foreground permission and high accuracy on iOS/Android. No background location task, foreground service, or saved coordinate history exists.
- A single in-memory fix retains original latitude, longitude, timestamp, accuracy, and mock indicator if the provider supplies it. Changing coordinate format does not reacquire or round the original fix.
- The browser uses `navigator.geolocation.watchPosition` directly. Inspection and a failing integration test revealed that Expo Location 57.0.16’s web adapter replaces its subscriber ID with the browser’s watch ID, dropping callbacks when IDs differ; it also omits the browser error callback. The platform-specific branch preserves watch IDs, high-accuracy options, error reporting, and cleanup without patching a dependency.
- Late async native subscriptions are removed after cancellation. Screen exit and app backgrounding remove watches. Permission/service failures show usable fallback instructions. Waiting/error states retry automatically with bounded intervals rather than blocking emergency controls.
- Stale means at least 120 seconds old; poor accuracy means over 100 meters. These are explicit application warning thresholds, not a guarantee that a fresher/tighter fix is correct.
- Copy/share includes WGS84, selected format, uncertainty, timestamp, age, and warnings. Emergency SMS drafts use clearly labeled DD. Missing/overdue drafts prompt for the missing person’s last known location instead of inserting the caller’s GPS position.
- UTM uses PROJ4’s WGS84 projection, explicit zone/band/hemisphere and meter units, Norway/Svalbard exceptions, and limits of 80° S to 84° N. DD/DDM remain available outside that range.
- No map, tracking, or route navigation is added. Maps opens an external application/site only on user action.

## Plans and persistence

`trailsafe.local.v1` is a versioned AsyncStorage record. Schema checks reject unreadable or unknown data without overwriting it. Serialized writes update displayed state only after persistence succeeds. Storage failures do not block Emergency or the safety library. Delete All removes the local record; copies previously shared elsewhere are unaffected.

Trip fields retain raw in-progress multiline input. Validation runs before generating a complete plan or marking it Current. Incomplete drafts can still be saved. Return and overdue dates are explicit; the optional two-hour suggestion carries the date across midnight. Each plan retains a named time zone used in exported text and the in-app overdue flag. Users intentionally choose deadlines; no universal buffer is imposed.

Share/copy uses the current edited data, avoiding the prototype’s stale-preview problem. Updated saves increment a revision; shared text clearly identifies updated plans. Share-sheet/composer completion never becomes a delivery claim. PDF generation escapes all user text before producing HTML.

The prototype’s in-app check-in flag is implemented. Background notifications were not added. The older definition places scheduled notifications in a later scope. The prototype’s unused coarse Seattle sunset table was not ported: the definition calls for a trip-coordinate-based astronomical estimate, and there is no trailhead-coordinate input to support that honestly.

## Content changes from the prototype

The content inventory and most prose come from the HTML. Corrections are isolated in the extraction script and bundled JSON:

- Heat stroke can involve continued sweating; call 911 and cool promptly. Do not give oral fluids to a confused or unconscious person.
- Handle severe hypothermia gently; do not encourage a confused/severely cold patient to walk.
- Do not imply a SAR-monitored amateur-radio repeater or channel is available.
- The low-signal lesson does not encourage wandering or entering hazardous terrain. Stay where responders expect you unless immediately unsafe.
- An unexpected overnight does not cancel an active rescue; contact 911 early if unable to safely self-rescue.
- Removed the prototype’s incorrect X = “can’t continue” ground-to-air diagram and the recommendation for three signal fires.
- Added a food/extra-food prompt alongside the prototype’s ten named systems.
- Removed the unfinished “what happens after you call SAR” placeholder. Existing waiting-for-rescue guidance remains complete.
- “Get Location” references now point to the automatic location card.
- No article falsely says it has completed KCESAR/medical/dispatch review.

## Primary technical and safety references consulted

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Location 57](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
- [Expo Router 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/)
- [Expo Print 57](https://docs.expo.dev/versions/v57.0.0/sdk/print/)
- Installed `expo-sms` types/source for composer results and simulator/browser limitations (the versioned SMS web documentation failed to load).
- [PROJ4JS](https://proj4js.org/)
- [King County SAR: When/How to Call for Help](https://kingcountysar.org/when-how-to-call-for-help/)
- [King County 911: modern devices](https://kingcounty.gov/en/dept/kcit/data-information-services/911-program-office/how-to-call-911-using-modern-devices)
- [911.gov: text-to-911 bounce-back](https://www.911.gov/calling-911/frequently-asked-questions/)
- [CDC: heat-related illnesses](https://www.cdc.gov/niosh/heat-stress/about/illnesses.html)
- [CDC: hypothermia](https://www.cdc.gov/winter-weather/prevention/index.html)

This implementation and source cross-check are not substitutes for the product definition’s organizational, medical, and dispatch approval before publication.
