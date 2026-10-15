# Review follow-up — October 14, 2026

The second review found five defects in 0.5.0. The 0.5.1 (4) update resolves them without changing the six primary destinations, direct Text 911 composer access or the visible tool answers.

| Finding | Correction | Regression evidence |
| --- | --- | --- |
| P1: preview native initialization survived production prebuild on reused projects | Remove generated native blocks before selecting the channel; refresh permitted stages; fail malformed/unrecognized production initialization | Actual Expo mods, both platforms, legacy blocks, idempotence, channel transitions; production mod compiler on a temporary generated iOS project |
| P2: browser Back lost plan edits; Profile lost edits on navigation | Shared Expo Router 58 removal prevention and app navigation guard; Keep editing/Discard; durable save permits replacement | Browser Back, tabs, discard/reopen, save without warning and subsequent unsaved edit |
| P2: date shortcuts used device zone and lost midnight rollover | Format shortcuts in the selected trip zone; round the instant and update both date/time | Cross-zone browser fixture, midnight/year rollover and DST domain cases |
| P2: Hiking started a GPS watcher | Request GPS only for Daylight and Compass | Fresh Hiking visit starts zero watches; switching to Compass starts one and returning releases it |
| P2: first check got a false previous-trip warning | Bind genuinely empty checklist progress to the latest Current trip; retain older nonempty progress identity | Domain identity cases plus browser check/persistence/reload |

103 unit tests and all 23 browser checks passed. TypeScript and all-platform export passed; lint has zero errors and nine pre-existing warnings. Initial browser attempts used incorrect profile-entry selectors; corrected tests pass without an app change. Browser fixtures remain isolated and transports inert. See VALIDATION.md for final native and delivery evidence and outstanding physical/store acceptance checks.

Optional later polish from this review: common named trip time-zone choices instead of typing an IANA identifier, and stable names for regional/seasonal add-on checklist IDs. Neither requires a new mode or subsystem.
