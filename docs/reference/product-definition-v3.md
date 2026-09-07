# KCESAR TrailReady
## Comprehensive Product Definition
**Status:** Draft for product, operational, medical, and public-information review  
**Date:** September 4, 2026  
**Working name:** *KCESAR TrailReady* (name not final)  
**Primary implementation assumption:** iPhone-first, native SwiftUI, no backend services
**Revision:** v3 — resolves emergency taxonomy and KCESAR/KCSARA relationship; introduces a true v0.9 field-beta scope, organizational continuity requirements, practice mode, plan-state/sunset/reminder refinements, and governance conflict resolution.

---

## 1. Executive summary

KCESAR TrailReady is a small, self-contained wilderness-safety application published by King County Explorer Search & Rescue (KCESAR/ESAR). It is intended primarily for hikers and other nontechnical backcountry recreationists in King County and the surrounding Washington Cascades.

The application is **not** a hiking-discovery, trail-condition, mapping, navigation, tracking, weather, or social product. It deliberately does not compete with Washington Trails Association (WTA), AllTrails, Gaia GPS, onX Backcountry, CalTopo, Apple Maps, Garmin, or Northwest Avalanche Center (NWAC).

Its purpose is narrower:

> **Help people prepare for ordinary outdoor trips, know when and how to ask for help, give responders useful information, and make better decisions while waiting for rescue.**

The application should work essentially completely without Internet service after installation. There are no required accounts, servers, cloud databases, push services, AI features, remote tracking, or ESAR monitoring. User information and trip plans remain on the device unless the user explicitly shares them through the operating system.

The product has four jobs:

1. **Prepare** — help the user carry the essentials, make a useful trip plan, and prepare their phone and communications.
2. **Get Help** — make it easy to call or text 911, determine and communicate an accurate location, and know what information dispatchers and rescuers need.
3. **Handle the First Minutes** — provide concise, offline, situation-specific guidance when the user is lost, injured, stranded, separated from a party, or facing an unexpected overnight.
4. **Learn** — provide a compact, authoritative KCESAR/KCSAR wilderness-safety guide derived from the real lessons local search-and-rescue volunteers repeatedly encounter.

The product's strongest differentiator is not technology. It is **credible local SAR judgment packaged into an extremely simple offline utility**.

---

## 2. Product thesis

The outdoor-app market is already crowded with products that answer:

- Where should I hike?
- What is the route?
- What do recent trip reports say?
- What is the elevation profile?
- Where am I on the map?
- What is the weather?
- What is the avalanche forecast?

KCESAR should not attempt to answer those questions better.

KCESAR has unusual authority and experience answering a different set of questions:

- What mistakes repeatedly turn normal outings into SAR incidents?
- What should I take even on a simple day hike?
- What information should I leave with someone before I go?
- When is a problem serious enough to call 911?
- Should I keep moving or stay where I am?
- What information will 911 and SAR need from me?
- What should my family member do if I do not return?
- What should I do while rescuers are trying to reach me?
- How can I make myself easier to find?
- How should I use my phone without destroying my remaining battery?
- What should I understand about satellite communicators, PLBs, and backcountry radios?
- What does search and rescue actually do after I call?

That is the product boundary.

### 2.1 Organizational context: KCESAR, KCSARA, KCSO, and the publisher

This product must be precise about the organizations whose names and guidance it uses.

- **King County Explorer Search & Rescue (KCESAR/ESAR)** is an operational search-and-rescue unit and a separate 501(c)(3) nonprofit. KCESAR describes itself as the largest member unit of King County Search & Rescue and King County's primary ground search-and-rescue team. [S2][S36]
- **King County Search & Rescue Association (KCSARA; often shortened publicly to KCSAR)** is the umbrella association that represents, supports, and promotes cooperation among the specialized King County SAR member units. KCSARA describes itself as non-operational; its member units retain their own organizational identities. [S36][S37]
- **King County Sheriff's Office (KCSO)** is the public-safety authority through which King County SAR resources are deployed. The app does not create an alternate dispatch path.

This specification assumes **KCESAR is the product sponsor and intended publisher**, subject to KCESAR Board authorization and Apple Developer enrollment under the KCESAR legal entity. KCSARA's public wilderness-safety pages are valuable local source material, but they are not automatically KCESAR-owned content. Using, adapting, endorsing, or co-branding KCSARA material should be explicitly agreed with KCSARA where appropriate.

The distinction matters for three reasons:

1. **Branding:** an official KCESAR app does not automatically become an official KCSARA or KCSO app.
2. **Content authority:** KCESAR can author its own operational/public-education guidance while citing KCSARA, King County 911, and other authorities for their domains.
3. **Governance:** app approval, source approval, and emergency-service approval are different decisions and should not be conflated.

---

## 3. Research summary

### 3.1 KCESAR and the King County SAR system

KCESAR's stated mission explicitly includes **promoting wilderness safety**, in addition to assisting people through search and rescue operations. KCESAR identifies itself as King County's primary ground search-and-rescue resource and as a member unit within the broader King County Search & Rescue system. [S1][S2][S36]

KCSARA's public safety material strongly supports the proposed app. In this document, **KCESAR** refers to the Explorer Search & Rescue operational unit; **KCSARA/KCSAR** refers to the association and its public resources unless a source uses a different official abbreviation. Its guidance emphasizes:

- Call 911 when hurt or genuinely lost.
- Do not wait until a situation deteriorates.
- Use STOP: Stop, Think, Observe, Plan.
- Stay in a safe location when lost.
- Tell someone where you are going and when you plan to return.
- Preserve phone battery.
- Carry a portable charger.
- Carry a dedicated light rather than relying on a phone.
- Carry the Ten Essential systems even on day hikes.
- Text 911 if a voice call cannot be completed.
- Carry a long-range communications option such as a phone or satellite device. [S4][S5]

KCSAR's winter-safety material adds recurring regional failure modes:

- Slips and falls into terrain from which the subject cannot return.
- Following tracks rather than independently confirming one's route.
- Trails disappearing under snow, in darkness, or in poor visibility.
- Deep snow, tree wells, avalanche terrain, slick footing, changing weather, and hypothermia risk.
- The need to be able to remain warm and dry for hours because SAR still takes time to reach the subject. [S6]

KCSAR also publishes a Snoqualmie Pass backcountry-radio program. The important product lesson is not to make the app a radio manual; it is to clearly distinguish **party-to-party situational communication** from emergency alerting. KCSAR explicitly warns that those FRS channels are not monitored by SAR and should not be relied on to summon rescue. [S7]

King County 911 guidance reinforces several emergency-screen requirements:

- "Call if you can, text if you can't."
- A 911 call taker will verify the caller's location even if some location data is available from the phone.
- A text-to-911 message should provide location and the type of emergency first, remain concise, and avoid pictures/video/emoji.
- The user should stay with the phone and answer follow-up questions. [S9][S10]

### 3.2 KCESAR social-media and outreach themes

Direct anonymous access to Meta pages is inconsistently available, but KCESAR's official website, official Linktree, search-indexed Facebook/Instagram posts, and public event listings reveal a consistent public-education pattern. [S19]

The social/outreach material repeatedly emphasizes:

- **Real mission storytelling**, rather than abstract safety lectures.
- Ordinary mistakes cascading into emergencies: wrong turns, forgotten headlamps, rolled ankles, insufficient preparation, heat, winter conditions.
- High mission volume, including multiple missions in a day and many missions in a single week. [S21][S22]
- Rescue activity on popular local trails, not merely technical mountaineering objectives. A discoverable Snow Lake post, for example, involved a heat-related response. [S23]
- Seasonal readiness, including KCESAR's Rapid Alpine Deployment period. [S24]
- Interagency cooperation and the reality that rescue commonly involves multiple SAR units, fire/EMS, law enforcement, and aircraft. [S25]
- Public education with a friendly, approachable tone, including KCESAR's "How Not to Die" presentations and social media education content. [S20]

The *How Not to Die* program is particularly relevant. It is built around true rescue stories and asks the audience to identify the preventable decisions that turned an ordinary outing into an incident. It explicitly covers what to carry for an unexpected night outdoors, how to contact SAR, and what information SAR needs. [S20]

**Product implication:** the app should not become a static digital textbook. Its educational material should be short, scenario-driven, and grounded in the kinds of problems KCESAR actually sees.

### 3.3 Other SAR and outdoor-safety models

Several external resources provide useful patterns without changing the product boundary.

**AdventureSmart** organizes outdoor prevention around the "Three Ts": Trip Planning, Training, and Taking the Essentials. Its trip-plan material explains that a trusted contact needs enough information to initiate a useful search if the traveler does not return. Its sample plan includes who is going, route, timing, equipment, vehicle, communications devices, and distress-alerting devices. [S12][S13]

AdventureSmart also maintains *Hug-a-Tree and Survive*, an established child-safety program teaching children to tell an adult where they are going, stay put if lost, keep warm and dry, and help searchers find them. It is potentially valuable for a family-hiking section, but the program has its own copyright and usage requirements; KCESAR should link to it or obtain permission rather than casually copying it. [S14]

**Washington Trails Association** provides unusually SAR-specific trip-plan advice. WTA recommends an explicit "panic time" and details such as trailhead/county, route and backup plan, party information, experience, relevant medical issues, outerwear color, tent color, vehicle description, and even boot size/type. [S11]

**National Park Service** material similarly recommends leaving a written trip plan with a trusted contact who is not on the trip. NPS's emergency-planning material prioritizes route review, the Ten Essentials, signaling tools, and clear actions after becoming lost. [S15][S16][S17]

**Northwest Avalanche Center** should remain the authoritative live source for avalanche forecasts and winter education. The KCESAR app should point to NWAC rather than attempting to reproduce forecasts or become an avalanche decision-support application. [S18]

**Plan My Walk** from the New Zealand Mountain Safety Council is a useful product-design benchmark: trip planning, emergency contacts, gear lists, weather, alerts, and safety education. Importantly, its creators explicitly state that it is not a navigation system and does not contact emergency services on the user's behalf. KCESAR should borrow the clarity of that boundary while omitting Plan My Walk's track database, map, account, backend, notifications service, and live alert system. [S26]

**Emergency+** in Australia demonstrates the value of an extremely simple emergency interface centered around GPS location information for emergency callers. [S27]

**Beacon by HOSAR** is a recent SAR-branded outdoor safety app with GPS awareness, emergency contacts, first-aid guidance, weather, and preparedness tools. It validates the concept of a local SAR organization publishing a public safety utility, but KCESAR should be more tightly scoped and more explicit about offline/no-backend behavior. [S28]

### 3.4 Research conclusion

The strongest product is not "KCESAR's version of AllTrails."

It is:

> **An official, offline, local-SAR safety companion that turns KCESAR/KCSAR public-safety guidance and operational experience into a few high-value tools and very short decision guides.**

---

## 4. Goals and non-goals

### 4.1 Product goals

#### G1 — Be useful with zero connectivity
Every safety-critical feature must work in airplane mode or with no cellular/Wi-Fi data connection, except the external act of calling/texting or opening a web resource.

#### G2 — Reduce preventable SAR incidents
The app should change behavior before a trip: leave a plan, take essentials, preserve communication capability, understand likely hazards, and know when to turn around.

#### G3 — Encourage earlier calls for help
The app should counter the common instinct to wait until darkness, worsening weather, exhaustion, or injury makes rescue harder.

#### G4 — Make emergency communication better
A stressed user should be able to determine and communicate their coordinates, location accuracy, situation, and relevant trip information with minimal cognitive load.

#### G5 — Help trusted contacts act correctly
A trip-plan recipient should know exactly what "overdue" means and what to do without installing the app.

#### G6 — Teach from the responder perspective
The content should focus on what experienced search-and-rescue volunteers wish subjects and families had known.

#### G7 — Be maintainable by one technical volunteer
Routine content changes should be edits to Markdown/JSON, not application code or server infrastructure.

### 4.2 Explicit non-goals

The app will not:

- Discover or recommend hikes.
- Maintain a trail database.
- Replace WTA trip reports.
- Provide turn-by-turn navigation.
- Provide an offline topo-map system.
- Record hikes or workouts.
- Track users in the background.
- Share continuous live location.
- Monitor trips from an ESAR command center.
- Automatically alert an emergency contact.
- Automatically dispatch SAR.
- Claim that tapping a button "contacts ESAR."
- Provide live weather forecasts itself.
- Provide avalanche forecasts itself.
- Provide live road/trail closures itself.
- Provide social networking, reviews, leaderboards, badges, or safety scores.
- Use AI to answer emergency or medical questions.
- Require an account.
- Require a cloud database.
- Require push notifications.
- Require an ESAR backend.
- Become a comprehensive wilderness-medicine textbook.

---

## 5. Product principles

### 5.1 Offline first, not offline capable
The default assumption is **no network**. Network access adds convenience; it is never required for core safety functionality.

### 5.2 No false monitoring
The app must never imply that KCESAR, KCSAR, a trusted contact, or anyone else is monitoring the trip.

### 5.3 No false delivery
The app must never state that a message was delivered unless the operating system provides a delivery result that actually means that. A compose screen is not delivery.

For Text-to-911, users must also be told that **a carrier bounce-back means the text was not delivered to 911** and that they must try another way to contact emergency services. FCC rules require covered text providers to return such a message when Text-to-911 cannot be delivered because the service is unavailable or unsupported in the user's location. [S33]

### 5.4 Emergency actions must be obvious
"Call 911" and location information must not be buried in navigation or educational prose.

### 5.5 Fewer features, better emergency behavior
Every added capability must justify the additional code, permissions, maintenance, UI, testing, and chance of failure.

### 5.6 Defer to authoritative specialists
KCESAR should teach SAR-related preparedness and response. It should send users to:

- WTA for trail conditions and trip reports.
- NWS for weather.
- NWAC for avalanche forecasts and education.
- WDFW for wildlife guidance.
- WSDOT for road conditions.
- The user's preferred navigation application for maps and route finding.

### 5.7 Calm, nonjudgmental language
A user in trouble does not need blame, jokes, or a lecture. Educational stories can be lively; emergency-mode copy should be calm and imperative.

### 5.8 Explicit uncertainty
GPS accuracy, message delivery, satellite availability, and rescue timelines are uncertain. Show that uncertainty instead of hiding it.

### 5.9 Privacy by architecture
If the app does not collect data, there is much less data to secure, disclose, govern, or accidentally expose.

---

## 6. Target users

### Primary persona A — Casual day hiker
- Hikes popular I-90 corridor, Issaquah Alps, North Bend, and Snoqualmie Pass trails.
- Uses WTA or AllTrails to choose routes.
- May carry only a phone for navigation/communications.
- Has not thought deeply about an unexpected night out.
- High value from preparation checklist, trip plan, and "when to call" guidance.

### Primary persona B — Experienced hiker/backpacker
- Already uses Gaia/onX/CalTopo/Garmin.
- Does not need another map.
- Appreciates a compact SAR-oriented trip plan and emergency reference.
- May carry inReach/PLB/radio.
- High value from responder-specific guidance and coordinate tools.

### Primary persona C — Family/group leader
- Responsible for children, scouts, youth, friends, or an informal group.
- Needs a preparation checklist, party information, and separation guidance.
- May use child-specific "stay put and be found" material.

### Secondary persona D — Trusted contact at home
- Does **not** need the app.
- Receives a plain-text or PDF trip plan.
- Needs an unambiguous "if you have not heard from me by..." instruction.
- Needs to know when and how to call 911.

### Secondary persona E — Person who encounters another injured/lost hiker
- Has no preexisting trip plan.
- Can still use the Emergency screen, location card, and incident guide.

---

## 7. Jobs to be done

### Before leaving
- "Help me quickly check that I have not forgotten something important."
- "Help me tell someone enough that SAR can find me if I do not come back."
- "Remind me what communication assumptions are dangerous."
- "Point me to the authoritative current sources without becoming one of them."

### When something goes wrong
- "Tell me what to do first."
- "Tell me whether I should call 911 now."
- "Tell me exactly where I am in a format I can read or send."
- "Help me give 911 useful information."
- "Help me avoid making the problem worse."

### While waiting for rescue
- "Tell me what matters now: safety, warmth, visibility, battery, staying put, and following dispatcher instructions."
- "Help me understand what rescuers may ask me to do."

### When someone is overdue
- "Tell me what I should do and what information to give authorities."

### When learning
- "Teach me the common mistakes SAR sees without making me sit through a course."

---

## 8. Information architecture

The app should have four top-level destinations:

1. **Home**
2. **Prepare**
3. **Safety**
4. **About**

**Emergency** is not merely another tab. It is a persistent high-visibility action available from Home and from a consistent toolbar/button throughout the app.

### Home
- Emergency / Need Help
- Leave a Trip Plan
- Be Prepared
- Safety Guide
- Current active reminder, if one exists

### Prepare
- Trip Plan
- Ten Essentials
- Phone & Communications
- Before You Leave
- Winter Add-On
- Family/Group Add-On
- Trusted Contact Instructions

### Emergency
- Call 911
- Text 911
- My Location
- What happened? — **five top-level choices total, including the generic fallback**
  - I'm lost / off route
  - Someone is hurt or sick
  - I/we cannot continue / are stranded
  - Someone is missing or overdue
  - Other emergency
- Waiting for rescue
- Share/copy emergency information

**Taxonomy rule:** *Unexpected overnight* and *winter emergency* are not top-level choices. They are conditions that can arise from several incidents and should be surfaced contextually inside Lost, Cannot Continue, Waiting for Rescue, and the Safety library. This reduces decision load during a stressful event and keeps the Emergency screen internally consistent.

**Missing/overdue branch:** selecting **Someone is missing or overdue** asks one simple follow-up:
- "They were with me and are now separated/missing" → Party Member Missing guidance.
- "They were expected back and did not return" → Overdue Person guidance.

**Other emergency fallback:** this is never a dead end. It immediately retains Call/Text 911 and the location card, then prompts the user to briefly describe what is happening and reminds them to remain available for dispatcher questions and follow dispatcher instructions.

### Safety
- Getting lost
- Calling for help
- Helping rescuers find you
- Ten Essentials
- Phones, satellite devices, PLBs
- Unexpected overnight
- Cold & hypothermia
- Heat
- Winter travel
- Party separation
- Children outdoors
- Signaling
- Backcountry radio
- Wildlife
- What happens after you call SAR?
- Lessons from real rescues
- External authoritative resources

### About
- About KCESAR
- About King County SAR
- This app is not monitored
- Privacy
- Content sources/review date
- Follow KCESAR
- Donate
- Volunteer
- Send feedback

---

## 9. Home-screen product specification

### 9.1 Home hierarchy

The first screen should communicate the app's purpose in seconds.

Suggested structure:

```
KCESAR TrailReady

[ NEED HELP? ]
Call/text 911 • Find my location

[ LEAVE A TRIP PLAN ]
Give someone the information SAR would need

[ BEFORE YOU GO ]
Essentials • phone • communications • trip prep

[ SAFETY GUIDE ]
What to do if you're lost, hurt, stranded, or overdue
```

A small footer can state:

> King County Explorer Search & Rescue  
> This app is not monitored. Emergencies: call 911.

### 9.2 Emergency prominence

The Emergency action must:

- Be visible without scrolling on Home.
- Be reachable in one tap.
- Remain reachable from other screens.
- Use a large touch target.
- Use both text and iconography; never rely on color alone.
- Not require login, profile setup, or acceptance of a new disclaimer at time of emergency.

---

## 10. Feature specification — Trip Plan

### 10.1 Purpose

Produce a useful SAR-oriented trip plan that a user can give to a trusted contact using ordinary device sharing. No server is involved.

### 10.2 Design rule

The recipient must **not need the app**.

The canonical output is human-readable plain text. PDF/print is optional.

### 10.3 Trip-plan fields

#### Expected return vs. overdue-action time
These are deliberately separate concepts and the UI must teach the difference.

- **Expected return** — when the user reasonably expects to be back or in contact.
- **If you have not heard from me by** — when the trusted contact should treat the trip as genuinely overdue and begin the escalation instructions.

The app should suggest, but not force, a buffer after expected return. For ordinary day hikes, a starting suggestion such as **2 hours** is reasonable, with explanatory copy such as:

> Add enough time for an ordinary delay—slow travel, photos, traffic, or a minor route change—without waiting so long that darkness, weather, cold, or medical problems could become much worse.

Do **not** hard-code a universal 2–3 hour rule. Appropriate buffer depends on trip length, season, daylight, weather, group, and communications. The UI should make the user choose the final time intentionally.

#### Sunset-awareness nudge — P1, offline calculation
A later release may add an **offline astronomical sunset estimate** for the trip date when the app has a usable trip-area coordinate (for example, the user sets the trailhead from current location). This is a calculation, not a weather or trail-condition service.

If the user's expected-return or overdue-action time is after the estimated local sunset, the app may show a neutral prompt such as:

> Your overdue time is after estimated sunset. Make sure that is intentional and that your party is equipped for travel or waiting after dark.

Requirements:
- No network dependency.
- Clearly label the value as an **estimated astronomical sunset**, not a guarantee of usable daylight.
- Do not attempt to model terrain horizon, tree cover, weather, or route-specific light.
- Do not block plan creation.
- Do not use the estimate as a safety score.

#### Required or strongly prompted
- Trip title / destination
- Date
- Starting location or trailhead
- Planned route / destination
- Start time
- Expected return time
- **"If you have not heard from me by" time**
- Party size
- Trusted-contact instruction

#### Recommended
- Alternate/backup route or plan
- Vehicle make
- Vehicle model
- Vehicle color
- License plate
- Communication equipment:
  - phone
  - satellite messenger
  - PLB
  - radio
  - other

#### Optional "Additional SAR details"
- Party member names
- Ages or age ranges
- Allergies & medications
- Relevant medical conditions
- Experience level
- Outerwear colors
- Tent/shelter color
- Boot/shoe description
- Additional vehicles
- Other notes

The additional section should be collapsed by default so a normal user is not presented with a giant form.

### 10.4 User profile reuse

A local profile may store reusable fields:

- User name
- Phone number
- Vehicle(s)
- Allergies & medications (optional)
- Relevant medical conditions (optional)
- Typical communication devices
- Optional outerwear/shelter descriptions

The user can disable or delete all saved profile data.

### 10.5 Trusted-contact language

The generated plan should include operational instructions, for example:

> **If you have not heard from me by 7:00 PM:**  
> 1. Try to call or text me.  
> 2. If you cannot reach me and I remain overdue, call 911.  
> 3. Tell the 911 call taker I am overdue from an outdoor trip and provide this trip plan.

The exact wording must be reviewed by KCSAR/KCSO/King County 911 before publication.

### 10.6 Example output

```
KCESAR TRIP PLAN

Trip: Granite Mountain
Date: Sep 20, 2026
Party: 2 people

Start:
Granite Mountain Trailhead
7:00 AM

Planned route:
Granite Mountain Trail to summit and return by same route.

Backup plan:
Turn around by 1:00 PM if not at summit.

Expected return:
4:30 PM

IF YOU HAVE NOT HEARD FROM ME BY:
6:30 PM

Vehicle:
Blue Rivian R1S
Washington ABC123

Communications:
iPhone
Garmin inReach Mini 2

Outerwear:
Blue jacket / black pants

If I remain overdue and you cannot contact me:
Call 911 and report an overdue backcountry party.
Provide this entire trip plan.

Created with KCESAR TrailReady.
This plan is not monitored by KCESAR.
```

### 10.7 Share mechanisms

P0:
- iOS share sheet
- Copy to clipboard

P1:
- "Share as PDF"
- Print

Do not implement proprietary plan links.

After the plan is complete, the primary call to action should be **Share Trip Plan Now** with short guidance:

> Share this before you leave reliable communications coverage. A plan stored only on your phone cannot help the person waiting for you at home.

The app does not need to determine whether the device currently has cellular service; this is a behavioral nudge, not a connectivity guarantee.

### 10.8 Edit/update behavior

The user may duplicate, edit, or delete stored plans.

If the plan changes in the field, the app can generate an updated message:

> **UPDATED TRIP PLAN — route/timing changed**

It cannot update the recipient automatically.

### 10.9 Local reminder

Optional P1 feature:

After creating/sharing a plan, the user may tap **Remind Me to Check In**.

Schedule local notifications:
- 30 minutes before expected return — normal/active interruption level.
- At expected return — normal/active interruption level.
- Optionally at the "if you have not heard from me by" time — may use iOS **Time Sensitive** interruption level if the user explicitly enabled this reminder behavior. Apple's Time Sensitive notifications can break through Focus/Notification Summary when the user allows them, but the user can disable that behavior. [S39]

Do **not** request or use Apple's Critical Alerts entitlement for ordinary trip reminders.

Notification copy must never imply the trusted contact has been notified. Example:

> Your overdue-action time has arrived. If you're safe, contact the person holding your trip plan now.

Example:

> Expected return time reached. If you're safe but running late, contact the person holding your trip plan.

---

## 11. Feature specification — Preparation

### 11.1 Ten Essentials checklist

Use KCSAR's ten system categories as the primary local source. [S4]

- Hydration
- Navigation
- Insulation
- Illumination
- Combustion
- Communication
- Repair
- Sun protection
- Shelter
- First aid

Each row has:
- Checkbox
- One-sentence rationale
- Optional "learn more"

The checklist is local and resets on demand.

### 11.2 Trip-type add-ons

The checklist can optionally add a small set of trip-specific items.

#### Day hike
- Base ten systems; emphasize headlamp and emergency shelter.

#### Overnight
- Sleep system/shelter appropriate to conditions
- Additional food
- water treatment
- overnight-specific medications

#### Winter
- Appropriate traction
- insulation
- waterproof layers
- emergency shelter
- winter communications
- avalanche equipment **only when traveling in avalanche terrain and only with appropriate training**

Do not turn this into an exhaustive gear database.

### 11.3 Phone & communications readiness

Static checklist derived from KCSAR's "Be Phone Smart" theme. [S4]

Suggested items:

- Phone charged
- Portable battery carried
- Dedicated headlamp/flashlight carried
- Offline navigation/map downloaded in my normal navigation app
- Trusted person knows my plan
- I know how my satellite/PLB device works, if carrying one
- My device's emergency features are configured
- I understand that lack of cellular service is normal in the backcountry

### 11.4 "Know before you go" launcher

When online, provide clearly labeled links to authoritative external sources:

- WTA — trail reports/conditions
- NWS Seattle — weather
- NWAC — avalanche forecast/education
- WDFW — wildlife guidance
- WSDOT — passes/road conditions
- Trailhead Direct — transit where applicable
- KCSAR — wilderness and winter safety
- KCESAR — public education
- AdventureSmart/NPS — general trip planning

Do **not** scrape these sites, cache live data, or represent old data as current.

If offline, the app should say:

> Live conditions require Internet access. Use your previously downloaded navigation/forecast information and conservative judgment.

---

## 12. Feature specification — Emergency mode

### 12.1 Primary objective

Under stress, the app must help the user do three things:

1. Contact emergency services.
2. Communicate location and situation.
3. Avoid making the situation worse.

### 12.2 Emergency screen hierarchy

Suggested layout:

```
NEED HELP?

[ CALL 911 ]

[ TEXT 911 ]

YOUR LOCATION
47.42537° N
121.41382° W

Accuracy: ±8 m
Updated: 6 sec ago

[ COPY LOCATION ]   [ SHARE ]

What happened?
[ LOST / OFF ROUTE ]
[ INJURED / SICK ]
[ CAN'T CONTINUE / STRANDED ]
[ SOMEONE MISSING / OVERDUE ]
[ OTHER EMERGENCY ]
```

### 12.3 Calling 911

- Must require a deliberate user tap.
- Must hand off to the system telephone function.
- App copy should state that KCESAR is not directly contacted by the app.
- King County SAR resources are requested through the appropriate public-safety process; KCESAR's site itself instructs people to report emergencies through 911. [S3]

### 12.4 Texting 911

Within King County, text-to-911 is supported and county guidance is "Call if you can, text if you can't." [S9][S10]

Implementation:
- Use the system message composer if available.
- Prepopulate recipient `911`.
- Prepopulate a concise draft.
- User must review and explicitly press Send.
- Never claim delivery.
- Never send automatically.

Suggested draft:

```
WILDERNESS EMERGENCY - KING COUNTY WA
Need: Search/rescue assistance
Location: 47.42537, -121.41382
GPS accuracy: about 8 m
Situation: [user-selected short description]
People: [party count if known]
```

King County asks text users to provide location and type of assistance in the first message, remain concise, and stay available to answer follow-up questions. [S9]

#### Text-to-911 bounce-back handling
The app must include concise pre-send or post-handoff guidance:

> **Watch for a reply.** If you receive a message saying Text-to-911 is unavailable or could not be delivered, your text did **not** reach 911. Try a voice call, satellite emergency service, or another available way to reach emergency services.

Covered U.S. text providers are required by the FCC to send an automatic bounce-back when a 911 text cannot be delivered because Text-to-911 is unavailable or unsupported in the user's location. [S33]

The app cannot itself reliably know whether the user's message was delivered; therefore it must not infer success from opening or dismissing the message composer.

**Release requirement:** coordinate wording and test protocol with King County E911. Do not send uncoordinated test messages to 911.

### 12.5 GPS location card

#### Pre-build Operations decision: coordinate format
Before implementation of the production emergency screen, KCESAR Operations/KCSAR and, ideally, King County dispatch stakeholders must identify the coordinate format they most want a subject to read aloud. Candidate formats include:

- WGS84 decimal degrees (DD), e.g. `47.42537, -121.41382`
- Degrees and decimal minutes (DDM), e.g. `47° 25.522' N, 121° 24.829' W`
- UTM

The product team should **not assume** that the most developer-convenient format is the operationally preferred format. The selected format becomes the single prominent V1 display. A second format may be placed behind **Other coordinate formats** if Operations finds it useful.

Until that decision is made, this specification uses WGS84 decimal degrees as the working default because it is compact and broadly interoperable.

P0:
- Operations-approved primary coordinate format
- WGS84 location retained internally regardless of display format
- Horizontal accuracy
- Timestamp / age of location
- Copy
- Share

P1 or P0 if Operations requires it:
- Altitude plus vertical accuracy
- One secondary coordinate representation behind a disclosure

Do not show three coordinate formats simultaneously on the primary emergency screen.

### 12.6 GPS behavior

The app must:
- Request location permission only when needed or after a clear user explanation.
- Request precise location when emergency/location tools are used.
- Show "Locating..." while acquiring a current fix.
- Show a stale location only with a conspicuous timestamp/stale warning.
- Show accuracy as uncertainty, not as a promise.
- Gracefully handle denied permission or disabled Location Services.
- Never invent a location.

Apple's Core Location API exposes horizontal accuracy as a radius of uncertainty and may initially return less accurate values before improving. [S30]

### 12.7 No map requirement

The emergency screen does not need a map in V1.

The user needs a **communicable location**, not another navigation product.

P1 may offer:
- Open this coordinate in the user's preferred/system map application.

---

## 13. Situation guide — Lost or off-route

### Immediate screen

**STOP**

1. Stop moving and stay calm.
2. Think: when did you last know where you were?
3. Observe your surroundings, resources, weather, daylight, and hazards.
4. Plan: do not make the situation worse.

Then:

> **If you are genuinely lost, unsafe, injured, or do not know how to get back safely, call 911. Do not wait for darkness or worsening weather.**

If already in contact with 911/SAR:

> Stay where you are unless the dispatcher/rescuers tell you to move or you must move a short distance to reach immediate safety.

This is directly aligned with KCSAR's STOP and call-early guidance. [S4][S5]

### Additional actions
- Get out of immediate hazards.
- **Do not assume that following a creek or drainage downhill will lead safely to a road or town.** In Cascade terrain, drainages can lead into waterfalls, cliffs, canyons, dense brush, and other terrain traps. If you are genuinely lost, stop and use the 911/SAR guidance above rather than following this common survival myth.
- Keep party together.
- Put on insulation before becoming cold.
- Prepare shelter if conditions warrant.
- Make yourself visible.
- Preserve phone battery.
- Answer calls/messages from unknown numbers while rescue is active.
- Follow dispatcher/rescuer instructions over generic app guidance.

---

## 14. Situation guide — Injury or illness

This guide must be deliberately limited.

### Immediate screen

1. Make the scene safe so there are not more victims.
2. Address immediate life threats using the first-aid skills you actually have.
3. If the person cannot safely self-rescue, has a serious injury/illness, or you are unsure, call 911 early.
4. Provide exact location and describe the patient's condition.
5. Protect the person from cold, wet ground, wind, rain, or heat.
6. Stay available to 911 and follow instructions.

KCSAR lists inability to walk, inability to safely self-rescue, serious medical problems, and inability to make reasonable progress toward the trailhead as appropriate reasons to call 911. [S5]

### Medical scope

P0 should not attempt to diagnose or treat dozens of medical conditions.

Optional P1 first-aid cards may cover only immediately actionable, broadly accepted topics such as:
- Severe bleeding
- Hypothermia/cold exposure
- Heat illness
- Anaphylaxis awareness
- Basic scene safety

Every medical card requires review by KCESAR/KCSAR medical personnel or another designated clinical authority before release.

KCSAR's Resources page already points the public to Base Medical; the app can link to that resource for deeper education. [S8]

---

## 15. Situation guide — Cannot continue / stranded

Examples:
- Exhaustion
- Terrain is beyond ability
- Gear failure
- Darkness
- Impassable snow/water
- Non-life-threatening problem preventing safe progress

Guide:

1. Stop before exhaustion or darkness turns the situation into an injury.
2. Move only as necessary to reach a safe location.
3. Evaluate daylight, weather, clothing, shelter, food, water, and communications.
4. If you cannot safely self-rescue or are unsure, call 911.
5. Prepare to stay warm/dry and wait.

The app should explicitly normalize calling before the situation becomes catastrophic.

---

## 16. Situation guide — Party member missing/separated

### If separation just occurred
- Stop the rest of the group from scattering.
- Identify the last place/time everyone was together.
- Try normal contact methods.
- Do not send multiple uncoordinated people searching in different directions.

### Call 911 when
- The missing person cannot quickly be located/contacted.
- The person is a child, at-risk adult, injured, inadequately equipped, or conditions create meaningful risk.
- Darkness/weather/terrain increase urgency.

Prepare:
- Name and age
- Clothing
- Pack
- medical considerations
- phone/device number
- last known point
- intended route
- experience
- footwear where useful

This should receive direct Operations review because search strategy details should not be oversimplified for the public.

---

## 17. Situation guide — Overdue friend/family member

This is an important screen because the person using it may be at home.

### Suggested flow

**Is the person overdue and you cannot reach them?**

1. Try the phone/contact method listed on the trip plan.
2. Review the intended return time and the explicit "if you have not heard from me by" time.
3. Gather the complete trip plan.
4. If they remain overdue and cannot be contacted, call 911.
5. Tell 911 they are overdue from an outdoor trip and provide:
   - Names/party size
   - Planned route
   - trailhead
   - timing
   - vehicle
   - clothing
   - communications devices
   - medical/experience information if known
   - any messages or location information received

KCSAR explicitly identifies an overdue outdoor traveler who cannot be contacted as an appropriate SAR/911 situation. [S5]

### 17.1 Generic fallback — Other emergency

The **Other Emergency** branch exists for incidents that do not fit the predefined choices. It must remain deliberately simple:

1. Keep **Call 911**, **Text 911**, and **My Location** visible.
2. Ask: **What is happening?** with a short free-text field for a message draft or notes.
3. If contacting 911, provide location and the type of help needed first.
4. Stay available for questions.
5. Follow dispatcher/responder instructions over app guidance.
6. Move only as needed for immediate safety.

This branch should not attempt to infer, diagnose, or route the user using AI or a large decision tree.

---

## 18. Situation guide — Unexpected overnight

**Placement:** Safety library and contextual link from Lost / Cannot Continue / Waiting for Rescue; not a top-level Emergency choice.

The purpose is not to teach improvised survival from scratch.

Priorities:
- Stop unnecessary travel if continued travel is unsafe.
- Get out of wind/rain/snow and away from immediate hazards.
- Add insulation before becoming cold.
- Insulate from the ground.
- Use carried emergency shelter.
- Ration battery intelligently, not food to the point of impairment.
- Maintain hydration.
- Make yourself findable.
- If rescue has been requested, remain in the agreed location unless instructed otherwise or immediate safety requires movement.

This content should connect directly back to the Ten Essentials: illumination, insulation, shelter, fire, food/water, communication.

---

## 19. Situation guide — Winter incident

**Placement:** Safety library and contextual winter callout within relevant emergency guides; not a top-level Emergency choice.

The winter guide should summarize, not replace, avalanche or winter-travel training.

Key KC-specific points from KCSAR:
- Snow can erase unofficial routes and tracks.
- Following someone else's tracks is not navigation.
- Slips can move a subject into harder terrain and out of cellular coverage.
- Tree wells, deep snow, slick terrain, weather changes, avalanche terrain, and hypothermia are important hazards.
- Rescue takes time; carry what is necessary to remain warm and dry. [S6]

Online links:
- NWAC forecast
- NWAC Backcountry Basics
- WSDOT passes
- KCSAR Winter Safety
- KCSAR Snoqualmie backcountry radio

No avalanche forecast should be bundled and represented as current.

---

## 20. "Waiting for rescue" guide

This is a major opportunity for KCESAR-specific content.

Suggested content:

- Follow the 911 call taker/rescuer's instructions over anything in the app.
- Stay where rescuers expect you unless remaining there is immediately unsafe.
- Keep the party together.
- Prevent further injury.
- Get warm/dry early.
- Make yourself visible.
- Keep communication devices accessible.
- Preserve battery.
  - Turn on **Low Power Mode**. Apple states that it reduces power use while preserving essential functions such as calls and messages. [S34]
  - Reduce screen brightness and let the screen sleep when you are not actively using it.
  - Stop optional high-power activities such as recording video or unnecessary activity tracking.
  - **Do not force-close apps as a generic battery-saving step.**
  - Do **not** blindly disable cellular, Wi-Fi, or Bluetooth while a rescue is active. Those radios may be needed for 911 callbacks, messaging, satellite/device workflows, or communication with a paired satellite messenger. Follow dispatcher/rescuer instructions and disable only functions you know are unnecessary.
- Do not repeatedly call 911 for status unless instructed or the situation materially changes.
- Be ready to describe nearby landmarks, sounds, terrain, trail signs, water, roads, power lines, or other features.
- If you hear/see searchers or aircraft, signal in a controlled, obvious manner.
- Secure loose objects around helicopters and follow crew directions; never approach an aircraft unless directed.

Any helicopter-specific instructions should be reviewed with the agencies KCESAR actually works with before release.

---

## 21. "Help rescuers find me" guide

This should be one of the signature KCESAR content pages.

Topics:
- Stay where expected when safe.
- Exact coordinates + accuracy.
- Describe visible landmarks.
- Bright/contrasting clothing.
- Whistle/signaling.
- Light at night without wasting the only phone battery.
- Preserve tracks/clues where relevant.
- Keep the phone on/available according to dispatcher instructions.
- Answer incoming calls.
- Tell 911 before changing location if possible.

AdventureSmart recommends large, high-contrast signaling and groups of three; NPS similarly emphasizes whistles and mirrors. [S12][S16]

### 21.1 Optional phone signaling light (P1)
A simple **Signal Light** control may be useful when ground teams or aircraft are already nearby. This is not a general-purpose flashlight feature and should not encourage unnecessary battery consumption.

Requirements if implemented:
- Label it **Signal Light**, not "SOS to SAR" or anything implying a distress transmission.
- Show warning copy: **Use only when you can hear or see rescuers, or when a dispatcher/rescuer asks you to signal. It uses battery.**
- Use a simple conspicuous repeating flash pattern rather than claiming that a particular flash sequence will be recognized as a formal SOS unless Operations specifically requests that standard.
- Provide an immediate Stop control.
- Include an accessibility warning for users sensitive to flashing light.
- Operations/aviation reviewers must approve the feature before release.

---

## 22. Phone, satellite, PLB, and radio content

### 22.1 Phone

Teach:
- A phone is valuable but not sufficient preparation by itself.
- Carry a backup battery.
- Do not use the phone as the only light source.
- Do not assume cellular coverage.
- Tell someone your plan before losing service.
- Preserve battery.
- Call 911 early when needed.
- In King County, text 911 if calling is not possible. [S4][S9]

### 22.2 iPhone Emergency SOS via satellite

Do not attempt to implement satellite communications.

Explain that supported iPhones can use Emergency SOS via satellite when cellular/Wi-Fi emergency communication is unavailable. Apple's system handles the satellite emergency workflow. [S31]

The app must explicitly teach the physical requirement: **go outside and seek the clearest practical view of the sky and horizon.** Apple warns that dense foliage, hills/mountains, canyons, and tall structures can slow or block a satellite connection. The user should follow the iPhone's onscreen pointing instructions. [S31][S35]

App responsibility:
- Educate before the trip.
- Encourage the user to learn their device's emergency features.
- In an emergency, call 911 first; the operating system may offer satellite options when appropriate.
- Never suggest that KCESAR TrailReady itself is a satellite communicator.

### 22.3 Satellite messenger / PLB

Explain the distinction at a high level:
- Two-way satellite messenger: can typically exchange messages and location.
- PLB: dedicated distress alerting, generally without ordinary two-way messaging.
- Both require the user to know their specific device.

Do not maintain model-by-model instructions.

### 22.4 FRS/backcountry radio

Summarize:
- Useful for partner/group communication.
- In some Snoqualmie-area terrain, KCSAR/SPART publishes community channels.
- Those channels are **not monitored by SAR**.
- A radio is not a substitute for 911, a satellite messenger, or PLB. [S7]

Link to the live KCSAR backcountry-radio page when online rather than hard-coding channel assignments that could change.

---

## 23. Child/family content

There is a strong case for a small family section because lost children are a SAR problem and KCESAR historically has substantial youth involvement.

### P1 content
- Stay together.
- Establish what a child should do if separated.
- Teach the child to stay put rather than wander.
- Keep warm/dry.
- Make noise/respond to searchers.
- Teach children that rescuers are there to help.

AdventureSmart's established *Hug-a-Tree and Survive* program is the strongest external model. Because its use/alteration is governed, KCESAR should either:
1. Link to the official program;
2. Obtain permission to reproduce/adapt approved material; or
3. Create original KCESAR content reviewed for consistency but not presented as Hug-a-Tree. [S14]

---

## 24. Wildlife content

Wildlife should not become a major app subsystem.

KCESAR's official Linktree currently points users to WDFW black-bear guidance, demonstrating the right model: defer to the state wildlife authority. [S19][S29]

### P1
One small "Wildlife" page:
- Stay alert.
- Do not approach wildlife.
- Keep dogs controlled/leashed where appropriate.
- Link to WDFW's current bear/cougar/wildlife guidance.

If KCESAR wants offline bear guidance, it should be reviewed against current WDFW wording before every release because species-specific encounter advice matters.

---

## 25. Lessons from real rescues

### Purpose

Turn KCESAR's successful social-media/public-event style into compact in-app education.

### Format

Each lesson should take 30–90 seconds to read:

**The setup**  
A normal day hike. Good weather. No expectation of trouble.

**The small problem**  
Wrong turn / forgotten headlamp / rolled ankle / heat / fading daylight / snow covers route.

**The cascade**  
How one small problem became several.

**What would have changed the outcome?**
- Trip plan
- headlamp
- extra layer
- earlier turnaround
- earlier 911 call
- better navigation discipline
- more water
- emergency shelter

**SAR takeaway**
One short sentence from the responder perspective.

### Governance

- Use anonymized or composite scenarios unless PIO/Operations approves a specific mission story.
- Do not expose subject identity or unnecessary medical detail.
- Do not imply fault.
- Avoid sensationalism.
- If the KCESAR *How Not to Die* name is used inside the app, confirm organizational rights and desired branding first. [S20]

### Initial scenario set

1. The forgotten headlamp
2. The "quick" day hike
3. The wrong turn that kept getting worse
4. The rolled ankle several miles from the trailhead
5. Heat on a familiar popular trail
6. The trail disappeared under snow
7. Following footprints instead of navigating
8. Waiting too long to call
9. A party member separated from the group
10. The phone battery was already nearly dead

---

## 26. Safety content inventory

| ID | Article/tool | Priority | Primary authority |
|---|---|---:|---|
| E01 | Need Help / Emergency home | P0 | King County 911, KCSAR |
| E02 | My GPS Location | P0 | Apple Core Location, KCSAR |
| E03 | When to call 911 | P0 | KCSAR, King County 911 |
| E04 | Text to 911 | P0 | King County 911 |
| E05 | Lost / off-route | P0 | KCSAR |
| E06 | Injured / sick | P0 | KCSAR + medical review |
| E07 | Cannot continue / stranded | P0 | KCSAR |
| E08 | Party member missing | P0 | KCSAR Ops review |
| E09 | Overdue person | P0 | KCSAR |
| E10 | Waiting for rescue | P0 | KCESAR Ops |
| P01 | Trip Plan | P0 | KCSAR/WTA/NPS/AdventureSmart |
| P02 | Ten Essentials | P0 | KCSAR |
| P03 | Phone Smart | P0 | KCSAR |
| P04 | Before You Leave | P0 | KCESAR/KCSAR |
| P05 | Trusted Contact Instructions | P0 | KCSAR/NPS |
| S01 | Unexpected overnight | P0 | KCESAR/KCSAR |
| S02 | Hypothermia/cold | P0 | medical review |
| S03 | Heat | P1 | medical review |
| S04 | Winter safety | P1 | KCSAR/NWAC |
| S05 | Signaling / being found | P1 | KCESAR/NPS/AdventureSmart |
| S06 | Satellite/PLB overview | P1 | manufacturer-neutral |
| S07 | Backcountry radio | P1 | KCSAR/SPART |
| S08 | Children outdoors | P1 | KCESAR + AdventureSmart |
| S09 | Wildlife | P1 | WDFW |
| S10 | How SAR works after 911 | P1 | KCSAR/KCESAR |
| L01-L10 | Lessons from rescues | P1 | KCESAR PIO/Ops |
| R01 | Authoritative online resources | P0 | KCSAR resource list |

---

## 27. Online resource directory

The app should contain a curated external-link directory rather than reproducing live data.

### Recommended resources

**Local**
- King County Explorer Search & Rescue
- King County Search & Rescue
- King County 911
- KCSAR Wilderness Safety
- KCSAR When/How to Call for Help
- KCSAR Winter Safety
- KCSAR Backcountry Radio

**Conditions**
- Washington Trails Association
- National Weather Service — Seattle
- Northwest Avalanche Center
- WSDOT mountain passes / road conditions

**Wildlife**
- Washington Department of Fish & Wildlife

**Education**
- AdventureSmart
- NPS Hike Smart / Trip Plan
- Base Medical (as currently linked by KCSAR)

Each item should show:
- What it is for
- Whether Internet is required
- External-site indicator

No embedded web browser is necessary; open the system browser.

---

## 28. Offline/online behavior matrix

| Capability | Offline | Connected |
|---|---|---|
| Safety articles | Full | Full |
| Trip-plan create/edit | Full | Full |
| Trip-plan copy | Full | Full |
| Trip-plan share | OS-dependent; can compose/queue where supported | Full |
| GPS coordinates | Yes, when device location can be acquired | Yes |
| Call 911 | Requires available voice/emergency transport | Available if network/device permits |
| Text 911 | Composer available if device supports messaging; delivery requires transport | Available if carrier/network permits |
| Satellite SOS | OS/device capability, not app service | OS/device capability |
| Local reminders | Full | Full |
| WTA/NWS/NWAC/WDFW | Show links only | Open current sites |
| KCESAR social | No live feed | Open external account |
| User account | None | None |
| Cloud sync | None | None |
| Remote tracking | None | None |

---

## 29. Data model

### 29.1 Local-only profile

```json
{
  "name": "string",
  "phone": "string?",
  "vehicles": [
    {
      "make": "string",
      "model": "string",
      "color": "string",
      "licensePlate": "string"
    }
  ],
  "communications": ["phone", "satelliteMessenger"],
  "allergiesAndMedications": "string?",
  "relevantMedicalConditions": "string?"
}
```

### 29.2 Trip plan

```json
{
  "id": "UUID",
  "status": "draft | current | completed",
  "title": "string",
  "date": "ISO-8601",
  "startingLocation": "string",
  "startingCoordinate": {"latitude": "double", "longitude": "double"} | null,
  "route": "string",
  "backupPlan": "string?",
  "startTime": "datetime",
  "expectedReturn": "datetime",
  "overdueActionTime": "datetime",
  "party": [
    {
      "name": "string?",
      "age": "string?",
      "allergiesAndMedications": "string?",
      "relevantMedicalConditions": "string?",
      "experience": "string?",
      "outerwear": "string?"
    }
  ],
  "vehicleIds": ["UUID"],
  "communications": ["string"],
  "shelterDescription": "string?",
  "footwearDescription": "string?",
  "notes": "string?",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "sharedAt": "datetime?",
  "completedAt": "datetime?"
}
```

`status` exists only to support local UI such as **Current Trip Plan** and reminder cleanup. **Current** does not mean monitored, tracked, or remotely active. Only one plan should normally be current at a time; marking it completed cancels its pending local reminders.

`startingCoordinate` is optional. It supports exact location metadata and future offline sunset estimation when the user explicitly supplies or captures a coordinate; the app must not geocode free-text trail names through a backend.

### 29.3 Content document

Keep content separate from application code.

Suggested Markdown front matter:

```yaml
---
id: lost
title: "I'm Lost or Off Route"
category: emergency
priority: 1
audience: public
offline: true
lastReviewed: 2026-09-01
reviewOwner: Operations
sources:
  - kcsar-when-to-call
  - kcsar-wilderness-safety
keywords:
  - lost
  - off route
  - navigation
  - stop
---
```

Then Markdown body.

This allows most future app updates to be content edits.

---

## 30. Technical architecture

### 30.1 Recommended V1 stack

**Platform:** iPhone  
**Language/UI:** Swift + SwiftUI  
**Minimum OS:** iOS 17 or later unless organizational device data suggests otherwise  
**Backend:** none  
**Authentication:** none  
**Networking layer:** unnecessary for core product  
**Content:** bundled Markdown + local manifest JSON/YAML  
**Persistence:** versioned `Codable` value types stored as JSON files; atomic writes; explicit migration functions and migration tests; no SwiftData/Core Data in V1 unless the data model later becomes materially more complex.  
**Location:** Core Location  
**Messaging:** MessageUI / system share sheet  
**Phone:** system telephone URL/action  
**Notifications:** local notifications only  
**Analytics:** none by default  
**Third-party SDKs:** ideally none

### 30.2 Persistence design
The V1 schema is small enough that SwiftData/Core Data adds more migration and framework complexity than value. Use explicit `Codable` structs and versioned JSON files stored in the application-support/documents area as appropriate.

Requirements:
- Atomic writes (write temporary file, then replace).
- A top-level schema version.
- Explicit migration functions when fields change.
- Defensive decode with recoverable error handling.
- Human-inspectable files during development.
- Unit tests that migrate representative older fixture files to the current schema.

Do not expose raw JSON as a user-facing backup format unless a later requirement justifies it.

### 30.3 Why native iPhone first

This application uses relatively little business logic and several platform services:

- Location
- Phone
- Messages
- Share sheet
- Local notifications
- Accessibility
- Local storage

A native SwiftUI implementation minimizes framework layers and should be particularly maintainable with AI-assisted development.

The content files and data schema should remain platform-neutral so a future Android implementation can reuse nearly all non-UI work.

#### Operational risk of iPhone-only launch
An iPhone-first release creates a real group-safety limitation: in a mixed-device party, the iPhone owner may be the person who is injured, separated, out of battery, or whose phone is lost/damaged. Other party members using Android would not have the KCESAR offline guides or tools.

This does **not** justify expanding V1 into simultaneous cross-platform development, but it should be recorded as an accepted launch risk and should raise Android to the first major platform follow-on once the iPhone product and content are validated. The Safety content and data schemas must therefore avoid Apple-specific assumptions except in clearly labeled device sections.

### 30.4 Practice / demo mode

The app must provide a safe way to demonstrate and rehearse Emergency mode during KCESAR classes, outreach events, internal training, and user self-practice.

**Practice Emergency Mode** requirements:
- Enter only through a clearly labeled **Practice Emergency Mode** action, not by an obscure gesture.
- Persistent, visually unmistakable banner: **PRACTICE — DOES NOT CONTACT 911**.
- Call/Text 911 controls are simulated and **must not** invoke the phone or message composer.
- Use sample coordinates by default at public demonstrations; optionally allow the user to practice reading their real current coordinates with an additional privacy notice.
- All incident-guide navigation behaves like production so the workflow can be rehearsed.
- Exiting Practice returns to normal mode explicitly.
- Automated UI tests should verify that no practice-mode control can reach a real emergency transport action.

Debug/test builds should also support configurable fake emergency recipients for development.

### 30.5 Localization architecture

All user-facing strings should use Apple's localization/String Catalog mechanisms from the first implementation even if v0.9 ships only in English.

A pragmatic early localization target is the **critical Emergency shell** rather than the entire content library:
- Call 911
- Text 911
- My Location
- location accuracy / updated time
- not-monitored language
- the five top-level incident choices
- the Text-to-911 bounce-back warning

Spanish is the first candidate. Emergency translations must receive competent human/native-speaker review; do not rely on unreviewed machine translation for life-safety strings. Partial localization must clearly fall back to English for guides that have not yet been translated.

### 30.6 Dependency policy

Prefer zero third-party runtime dependencies.

A dependency is justified only if:
- It substantially reduces safety risk or implementation complexity.
- It is actively maintained.
- It has a compatible license.
- Replacing it later is straightforward.

Do not add SDKs merely for analytics, remote configuration, crash dashboards, login, or UI components.

### 30.7 Bundled content; optional remote link manifest

Ship **all safety content** in the app bundle. No emergency or educational guidance should depend on a network fetch.

External resource URLs are a different problem: links can move even when the app's safety content has not changed. A small hybrid mechanism is acceptable because failure is non-safety-critical:

1. Ship a bundled `links.json` containing every external resource URL.
2. When connected, the app may fetch a tiny replacement `links.json` from a KCESAR-controlled static HTTPS host such as GitHub Pages.
3. Validate a strict schema and version number; accept URLs only for predefined resource IDs.
4. Cache the last valid manifest locally.
5. On any error, timeout, malformed response, or unavailable host, use the cached or bundled manifest.
6. Remote link data must never contain executable code, emergency instructions, Markdown article bodies, or arbitrary UI configuration.

This keeps V1 effectively backend-free while allowing link-rot repair without an App Store binary release. The feature can be deferred if even this maintenance path is not desired.

---

## 31. Permission strategy

### Location
Request **When In Use** only.

Prompt context:
> TrailReady uses your location to show coordinates you can give to 911 or rescuers. Your location is not sent to KCESAR or stored remotely.

Do not request Always/background location.

### Notifications
Request only if the user explicitly enables trip-return reminders.

### Contacts
Avoid requiring Contacts permission in V1. The OS share sheet already lets the user select recipients.

### Photos/camera
Not needed in V1.

### Tracking
Never request App Tracking Transparency because the app does not track users.

---

## 32. Privacy specification

### Privacy promise

> Your trip plans and profile stay on your device. KCESAR does not receive or monitor your location or trip information. Information leaves the app only when you explicitly share it using your phone.

### Requirements
- No account.
- No analytics SDK.
- No advertising.
- No cloud database.
- No device identifier.
- No background location.
- No automatic upload.
- No remote crash-log provider unless later explicitly approved and disclosed.
- Local trip plans removable individually or all at once.

If implemented exactly this way, the App Store privacy disclosure should be capable of stating that the developer does not collect user data, subject to final Apple definitions and any later services added.

---

## 33. Emergency UI and accessibility requirements

Emergency mode must support:

- Dynamic Type at very large sizes.
- VoiceOver.
- High contrast.
- Dark mode.
- Color-blind-safe communication.
- Touch targets at least platform-recommended size.
- Key actions that remain visible at large text sizes.
- Plain language.
- No animation necessary to understand state.
- No hidden gesture required for emergency action.
- Location values selectable/copyable.
- Do **not** disable Auto-Lock indefinitely by default. If testing shows a need, offer a clearly labeled temporary **Keep Screen Awake** control while the user is actively reading/copying location information, then automatically return to normal Auto-Lock behavior. This avoids undermining battery-preservation guidance.
- Haptic confirmation for Copy, not for "message sent" unless actual send result exists.

Critical information hierarchy:
1. Call/text
2. Location
3. Situation
4. Guidance

Not:
1. Logo
2. prose
3. legal disclaimer
4. emergency action

---

## 34. Tone and editorial style

### Emergency content
- Short sentences.
- Imperative verbs.
- One action per line.
- Avoid jargon.
- Avoid humor.
- Avoid blame.

Example:
> Put on insulation now. Do not wait until you feel very cold.

### Educational content
Can be more conversational and can use KCESAR's storytelling character.

Example:
> A forgotten headlamp is not usually a problem at noon. It becomes a problem when a minor delay turns a 4 PM return into a 7 PM descent.

### Avoid
- "Guaranteed safe"
- "SAR is on the way" unless the user tells the app they have contacted SAR, and even then prefer "If 911 has confirmed a response..."
- "Your message was delivered" without real confirmation
- "ESAR has your location"
- "Press for rescue"
- "Safe route"
- Numeric "safety scores"

---

## 35. Content governance

### 35.1 Roles

**Product/developer**
- App implementation
- UX
- content-system tooling
- release management

**KCESAR Operations**
- Lost-person/SAR operational guidance
- waiting-for-rescue guidance
- information responders need
- helicopter/responder interaction

**KCESAR Medical / designated medical reviewer**
- injury/illness
- bleeding
- hypothermia
- heat illness
- any patient-care content

**PIO/Public Education**
- tone
- mission-story use
- public claims
- branding

**KCSARA/KCSO/King County 911**
- KCSARA: association-owned guidance, endorsement/co-branding, and association relationship language
- KCSO/King County 911: 911 calling/texting wording and dispatch-process claims
- claim that rescue is free/no-charge if included

#### Approval domains and conflict resolution
Not every reviewer gates every page. Review is **domain-specific**:

| Domain | Final safety authority |
|---|---|
| SAR operational behavior | KCESAR Director of Operations or delegated Operations reviewer |
| Patient-care/medical guidance | Designated KCESAR/KCSAR medical reviewer |
| 911 call/text behavior and dispatch claims | King County 911/KCSO designated reviewer |
| KCESAR brand/public messaging | KCESAR President/Board-designated PIO authority |
| Product UX/engineering where no safety claim is changed | Product owner/developer |

If two domains conflict, the product owner convenes the relevant reviewers and attempts to produce wording acceptable to both. **No product or board decision should override the authoritative reviewer inside that reviewer's safety domain.** If agreement cannot be reached, the feature or disputed wording is deferred or simplified. The KCESAR Board sponsor is the tiebreaker only on whether to ship/defer the product or feature, not on substituting its own medical, dispatch, or operational guidance.

This model keeps a one-maintainer project from requiring five independent approvals for every change while still protecting safety-critical claims.

### 35.2 Review cadence

- Full content review every 6 months.
- Mandatory review before each major release.
- Immediate patch release for materially incorrect emergency guidance.
- Every article carries internal `lastReviewed`, `reviewOwner`, and source metadata.

### 35.3 Source policy

Use sources in this order:

1. King County 911/KCSO for emergency communications.
2. KCESAR for KCESAR-authored operational/public-education guidance; KCSARA for association-published SAR safety resources.
3. Washington agencies (NWAC, WDFW, WSDOT) for specialized Washington hazards.
4. NPS/AdventureSmart for general best practices.
5. Other educational organizations only when the above do not address the topic.

Do not copy third-party prose wholesale. Paraphrase, link, and obtain permission where necessary.

---

## 36. Legal and organizational review

Before publication:

- Confirm KCESAR Board authorization for an official app.
- **Enroll/publish through the KCESAR legal entity's Apple Developer Program organization membership if KCESAR is the publisher; do not publish the official app from a volunteer's individual developer account.** Apple organization enrollment requires a legal entity and organization verification; eligible nonprofits can request an Apple Developer Program fee waiver. [S38]
- Maintain organizational continuity: one designated Account Holder plus at least one additional Admin, preferably two; use organization-associated email addresses; document Account Holder transfer/recovery procedures. Apple organization teams can add Admins with broad App Store and certificates/identifiers access. [S38]
- Host the source repository under an organization-controlled GitHub organization or equivalent, with at least two KCESAR-authorized maintainers capable of recovering/administering it.
- Store release/runbook documentation, bundle identifiers, App Store metadata ownership, and signing/release procedures in an organization-controlled location rather than a volunteer's personal account.
- Confirm a succession process so a maintainer leaving KCESAR does not strand the app.
- Confirm right to use KCESAR name/logo/app icon.
- Confirm KCSARA name/logo/endorsement use if any; do not imply association endorsement without approval.
- Confirm emergency language with KCSO/KCSARA and King County 911.
- Obtain medical review.
- Draft a concise disclaimer.
- Draft a privacy policy even if no data is collected.
- Verify whether "How Not to Die" branding/content may be reused.
- Confirm external content licensing, particularly AdventureSmart/Hug-a-Tree assets and third-party images.

### Suggested concise disclaimer

> TrailReady provides general outdoor-safety information and is not monitored by KCESAR. It does not replace 911, professional medical care, appropriate training, navigation tools, weather/avalanche information, or personal judgment. In an emergency, call 911 and follow dispatcher/responder instructions.

Do not force the user to scroll through this during an emergency.

---

## 37. Competitive/adjacent product lessons

### Beacon by HOSAR
**Borrow:** Local SAR identity, GPS emergency utility, simple preparedness concept.  
**Avoid:** Broad "may include" feature sprawl; keep KCESAR's scope precise. [S28]

### Emergency+
**Borrow:** Location-first emergency UX. [S27]

### AdventureSmart
**Borrow:** Trip planning as a safety intervention, trusted-contact responsibility, concise preparation framework. [S12][S13]  
**Avoid:** Backend email/trip-plan infrastructure.

### Plan My Walk
**Borrow:** Explicitly defined planning-vs-navigation boundary, gear/trip-plan emphasis. [S26]  
**Avoid:** Trail database, accounts, map layers, weather integrations, live alerts, backend notifications, reviews.

### NPS Hike Smart / Outdoor Emergency Plan
**Borrow:** Clear trip-plan and emergency-action structure. [S15][S16]

### WTA
**Borrow:** Washington-specific SAR usefulness of route, backup plan, panic time, vehicle, clothing, footwear, and experience details. [S11]

---

## 38. MVP and release scope

The previous P0 definition was still too large for the stated single-maintainer/reviewer constraint. The product should separate **field validation** from the **first public release**.

### v0.9 — Fieldable TestFlight beta

Purpose: prove the highest-value safety workflows with a small internal/invited field population before requiring the entire content/governance surface.

#### Core
- Home
- Persistent Emergency action
- About / Privacy / Sources / Not Monitored
- Practice Emergency Mode

#### Emergency
- Call 911 handoff
- Text 911 composer + bounce-back guidance
- Current GPS coordinates in the Operations-approved format
- Accuracy + timestamp
- Copy/share location
- **Lost / off-route guide**
- **Injured / sick guide**
- **Overdue person guide**
- **Other Emergency generic fallback**

The v0.9 screen exposes only branches with approved content: Lost, Injured/Sick, Overdue Person, and Other Emergency. It does not expose Cannot Continue or Party Member Missing until those guides are ready for v1.0.

#### Preparation
- Trip Plan create/edit/save/delete
- Plain-text plan generation
- Share sheet / copy
- Expected-return vs overdue-action education
- Trusted-contact instructions
- Ten Essentials checklist
- Explicit "share before leaving coverage" nudge

#### Engineering/safety baseline
- Bundled Markdown content for the above flows
- Versioned Codable JSON persistence
- No account/backend/analytics/background location
- VoiceOver and large Dynamic Type support for **every screen that exists in v0.9**
- Offline/no-service field tests

### v1.0 — First public App Store release

Add the pieces needed for a coherent public product after v0.9 validates the core:

- Cannot Continue / Stranded guide
- Full Party Member Missing / Separated guide
- Waiting for Rescue guide
- Phone & Communications checklist
- compact Safety Guide index for approved content
- current-authority external resources
- finalized organizational/About relationship language
- practice/demo polish suitable for public outreach
- critical Emergency-shell Spanish localization **if** reviewed translation resources are available; do not delay a safe English release solely to achieve full-library localization

### v1.1 / v1.2 — Fast follow
- Local check-in reminders; Time Sensitive only for the opt-in overdue reminder
- Unexpected overnight guide
- Winter safety
- Heat/cold cards
- Signaling/help-rescuers-find-you
- Satellite/PLB education
- Backcountry radio summary
- Child/family section
- Wildlife page
- Lessons from real rescues
- PDF trip plan
- "Open coordinates in Maps"
- Optional responder-visible Signal Light after Operations/aviation review
- Optional static remote `links.json` override with bundled fallback
- Offline sunset-awareness nudge when a usable trip coordinate exists
- Local article search

### Next platform
- **Android** — preferred first major platform follow-on after iPhone workflows/content are validated. Mixed-device parties are an accepted iPhone-launch limitation, not a reason to duplicate the entire initial project before proving it.

### Later considerations
- Full Spanish content-library localization
- Widgets/lock-screen quick access
- Apple Watch companion shortcut
- Additional coordinate formats if Operations needs them
- More specialized activity modules

### Explicitly not planned
- Trail maps
- route recording
- continuous tracking
- account/cloud sync
- server-side trip monitoring
- live forecast ingestion
- AI
- social feed

---

## 39. Acceptance criteria

### App-level
- v0.9 contains only approved, testable workflows; v1.0 scope is not a prerequisite for beginning field validation.
- App remains useful with device in airplane mode.
- Every bundled safety article is accessible without network.
- No core workflow requires login.
- No network failure blocks launch or Emergency mode.
- No user location is transmitted to KCESAR.

### Trip Plan
- User can create a basic plan in under two minutes.
- User can share a human-readable plan without recipient app.
- Plan clearly distinguishes expected return from overdue-action time.
- Plan clearly says it is not monitored.
- Recipient instructions clearly direct an unresolved overdue situation to 911.
- User can delete all stored plan/profile data.

### Emergency
- Emergency action reachable in one tap from Home.
- GPS screen clearly identifies stale or inaccurate positions.
- Emergency coordinate display uses the format approved by Operations/dispatch before release.
- Location copy works without network.
- 911 call/text is initiated only through explicit user action.
- Text composer can be prefilled but never auto-sent.
- Text-to-911 guidance tells the user that a carrier bounce-back means the message did not reach 911 and another contact method is required.
- UI never reports "delivered" based only on opening/sending from the compose UI.
- Emergency guides load instantly offline.
- Emergency UI works with VoiceOver and large Dynamic Type.
- Practice Emergency Mode cannot invoke a real phone call or real 911 message composer.
- Other Emergency is a functional fallback, not an empty branch.
- Unexpected Overnight and Winter Emergency do not appear as primary Emergency choices; they are contextual guidance.

### Content
- Every P0 content page has an assigned reviewer.
- Every P0 page has at least one documented authoritative source.
- Medical content has designated medical approval.
- 911 wording has public-safety approval.

---

## 40. Test plan

### 40.1 Functional
- Clean install
- App upgrade with existing trip plans
- Trip plan create/edit/delete/duplicate
- Trip-plan state transitions: draft → current → completed; reminder cleanup on completion
- Share through Messages, Mail, Notes, AirDrop
- Copy text
- Notification scheduling/cancellation
- Delete all local data

### 40.2 Connectivity
- Full Wi-Fi/cellular
- No Wi-Fi, cellular available
- Airplane mode with Location Services on
- No service in actual outdoor terrain
- Device without messaging configured
- Device without active SIM where emergency calling behavior can be safely observed

### 40.3 Location
- Precise location allowed
- Approximate/reduced location
- Permission denied
- Location Services disabled
- Poor GPS view
- Fresh high-quality fix
- stale fix
- moving user
- low battery

### 40.4 Accessibility
- VoiceOver
- Maximum Dynamic Type
- Increase Contrast
- Reduce Motion
- Dark mode
- grayscale/color differentiation
- one-handed use

### 40.5 Emergency testing safety
**Never send uncoordinated test messages or calls to 911.**

Coordinate any end-to-end emergency communications testing with King County E911/KCSO. For normal development, test:
- composer population,
- button handoff,
- copy/paste,
- mock recipients,
- mock emergency numbers in debug builds.

Production code should make it difficult for a developer test build to accidentally contact 911.

Practice-mode testing must include a negative assertion that tapping simulated Call/Text controls **cannot** invoke `tel:`/telephone APIs or `MFMessageComposeViewController`/messaging handoff.

### 40.6 Field beta
Recruit a small group:
- ESAR Operations members
- medical members
- casual hikers
- experienced hikers
- at least one person with low technical comfort
- accessibility tester

Give each offline scenarios:
1. Lost with no service.
2. Injured partner.
3. Overdue family member.
4. Need to read coordinates to a dispatcher.
5. Need to create a trip plan quickly at trailhead.

Observe rather than instruct.

---

## 41. Development plan

### Phase 0 — Organizational validation
- Board/leadership sponsorship and named product owner
- Clarify KCESAR publisher status and KCSARA relationship/endorsement boundary
- PIO/Ops/Medical reviewers identified, with domain-authority matrix accepted
- KCSARA/KCSO/King County 911 review path
- **Operations/dispatch decision on primary coordinate format**
- app name/logo decision
- Apple Developer Program organization membership owned by KCESAR legal entity (or explicit Board-approved alternative), with Account Holder + at least one Admin
- Organization-controlled source repository with at least two maintainers
- Written account/repository/release succession plan

### Phase 1 — Technical skeleton
- SwiftUI project
- navigation
- content rendering
- local persistence
- privacy/about
- automated tests

### Phase 2 — Emergency location
- Core Location
- accuracy/timestamp
- copy/share
- call/text handoff
- degraded states

This should be built and field-tested early because it is the highest-risk product functionality.

### Phase 3 — Trip Plan
- data model
- forms
- plain-text generator
- save/share
- trusted-contact language

### Phase 4 — v0.9 content
- convert approved safety material to Markdown
- operational/medical review
- emergency decision flows

### Phase 5 — Accessibility/polish
- VoiceOver
- Dynamic Type
- offline tests
- low-battery/no-service behavior
- visual identity

### Phase 6 — v0.9 TestFlight field beta
- ESAR internal
- invited public testers
- outdoor/no-service tests
- resolve wording confusion

### Phase 7 — v1.0 public launch
- App Store
- KCESAR website
- QR codes at outreach events
- social-media promotion
- "How Not to Die" classes
- partner outreach to WTA/REI where appropriate

---

## 42. Maintainability plan

The application should be designed around a single-maintainer reality.

### Changes that should require no Swift work
- Fixing article wording
- Adding a lesson-from-rescue card
- Updating resource links
- changing source attribution
- changing review dates
- adding checklist copy

### Changes that should require small, isolated code edits
- Adding a trip-plan field
- Adding a new local reminder
- Adding another emergency scenario

### Avoid long-term operational dependencies
- API keys
- paid map SDKs
- databases
- auth providers
- push providers
- serverless functions
- custom telemetry
- content management systems

### Source control
Use a conventional Git repository with:
- `/App`
- `/Content`
- `/Content/sources.json`
- `/Tests`
- `/Docs`

A simple CI build/test workflow is useful but not required for runtime operation.

---

## 43. Success measures without analytics

Because privacy and simplicity argue against behavioral telemetry, measure success through:

- App Store downloads
- App Store ratings/reviews
- Direct feedback email
- Short voluntary web survey linked from About
- Feedback gathered at KCESAR outreach events
- ESAR member observations about public familiarity with trip plans/911 guidance
- Questions received during "How Not to Die" or similar events
- Periodic qualitative survey of local outdoor partners
- **Dedicated Operations post-incident feedback loop:** when KCESAR learns that a subject, companion, or reporting party used TrailReady during a real incident, authorized members can submit an internal debrief note describing what the app clarified, confused, omitted, or got wrong. This should use mission identifiers/anonymized observations where possible and should not create a new repository of subject medical/location data.
- Quarterly or semiannual Product + Operations review of those debrief observations, with safety-content changes tracked as issues and routed to the appropriate domain reviewer.

For validating life-safety content, this operational feedback is more important than App Store ratings.

Do not claim that the app reduced rescue incidents without a defensible study.

---

## 44. Key risks and mitigations

### Risk: Users think KCESAR is monitoring them
**Mitigation:** "Not monitored" appears in onboarding, trip-plan output, About, and relevant emergency copy.

### Risk: User delays calling because they are reading the app
**Mitigation:** 911 action precedes guidance; "call early" is explicit.

### Risk: GPS position is poor/stale
**Mitigation:** always show accuracy + timestamp; never hide uncertainty.

### Risk: Text-to-911 behavior changes
**Mitigation:** wording reviewed with King County 911; app release review; no auto-send.

### Risk: Medical content becomes incorrect or too ambitious
**Mitigation:** keep scope tiny; clinical review; external links for deeper education.

### Risk: App becomes a second-rate map/trail product
**Mitigation:** product principle and non-goals explicitly prohibit it.

### Risk: Content goes stale
**Mitigation:** source metadata and semiannual review.

### Risk: External-resource link rot
**Mitigation:** link validation before release and during content review.

### Risk: Third-party copyright
**Mitigation:** paraphrase and attribute; obtain permission for program assets/stories; link rather than copy where appropriate.

### Risk: Official-brand confusion between KCESAR, KCSARA/KCSAR, and KCSO
**Mitigation:** relationship is defined near the beginning of this specification; About page repeats it; KCSARA/KCSO endorsement is never implied.

### Risk: App ownership depends on one volunteer
**Mitigation:** Apple Developer membership under the organization, Account Holder + Admin continuity, organization-owned repository, at least two maintainers, and documented succession/release recovery.

### Risk: Emergency choice overload
**Mitigation:** five top-level situation choices total, including the generic fallback; seasonal/overnight conditions are contextual rather than additional top-level branches.

---

## 45. Open decisions requiring KCESAR input

1. **Name:** KCESAR TrailReady, ESAR TrailSafe, or another name?
2. **Publisher/account ownership:** confirm KCESAR legal entity as Apple Developer/App Store publisher, or document the specific Board-approved alternative before code signing/distribution begins.
3. **Branding:** official KCESAR badge/logo vs a distinct public-safety app mark?
4. **KCSARA relationship:** KCESAR-only product citing KCSARA guidance, formally endorsed by KCSARA, or co-branded? Treat these as distinct approval levels.
5. **911 wording:** exact approved text and whether "Text 911" should appear as a primary button.
6. **Medical scope:** which, if any, first-aid cards belong in V1?
7. **Trip-plan advanced fields:** how much information does King County SAR actually find useful enough to justify collecting?
8. **Coordinate formats (pre-build gate):** what exact format should a subject read aloud to King County dispatch/SAR/aviation? Decide the single primary V1 display before Emergency UI implementation; determine whether one secondary format is operationally useful.
9. **Lessons from rescues:** can specific existing mission stories be adapted, or should all examples be composites?
10. **Hug-a-Tree:** link only, license/adopt the program, or create original child guidance?
11. **Android:** after validated iPhone launch or simultaneous?
12. **Localization:** English only initially; Spanish later?
13. **Feedback:** PIO email, general KCESAR email, or a dedicated app address?
14. **Donation/recruitment:** how prominent should these be without distracting from safety?
15. **Review cadence:** who signs off on each release?
16. **Product owner:** who is the named KCESAR decision owner responsible for scope, reviewer coordination, and ship/defer decisions outside the protected safety-authority domains?

---

## 46. Recommended product decision

Approve a **small v0.9 TestFlight field beta**, not a feature-complete public app, as the next milestone.

The beta is successful if it contains:

- one excellent Emergency location/call/text screen,
- three high-confidence incident paths: Lost, Injured/Sick, and Missing/Overdue,
- a generic Other Emergency fallback,
- one excellent SAR-grade Trip Plan generator,
- one Ten Essentials checklist,
- safe Practice Emergency Mode,
- organization-owned distribution/repository continuity,
- no backend, tracking, analytics, or mapping stack.

Field-test those workflows with ESAR members and invited hikers. Use the results to decide what changes are actually necessary before adding Cannot Continue, Waiting for Rescue, broader safety content, notifications, winter material, and educational stories for v1.0/1.1.

The standard for adding a feature remains:

> **Does this become meaningfully better because it comes from King County Search & Rescue experience, and can KCESAR maintain it safely with its actual volunteer capacity?**

If the answer is no, link to the organization that already does it well.

---

# Appendix A — Proposed v0.9 / v1.0 screen list

## v0.9 field beta
1. Home
2. Emergency
3. My Location
4. Lost / Off Route
5. Injured / Sick
6. Overdue Person
7. Other Emergency fallback
8. Trip Plans
9. Edit Trip Plan
10. Trip Plan Preview/Share
11. Ten Essentials
12. Practice Emergency Mode
13. About / Privacy / Not Monitored / Sources

## v1.0 additions
14. Cannot Continue / Stranded
15. Someone Missing / Overdue chooser
16. Party Member Missing / Separated
17. Waiting for Rescue
18. Phone & Communications
19. Safety Guide Index
20. Safety Article
21. Resources
22. About KCESAR / KCSARA relationship

The v0.9 surface is intentionally small enough for one developer and a narrow set of domain reviewers.

---

# Appendix B — Suggested content-source registry

The app repository should maintain a small machine-readable source registry so every article identifies its basis.

Example:

```json
[
  {
    "id": "kcsar-wilderness-safety",
    "name": "King County Search & Rescue — Wilderness Safety",
    "url": "https://kingcountysar.org/wilderness-safety/",
    "owner": "KCSARA",
    "reviewIntervalDays": 180
  },
  {
    "id": "king-county-911-basics",
    "name": "King County — Calling 911: the basics",
    "url": "https://kingcounty.gov/en/dept/kcit/data-information-services/911-program-office/911-the-basics",
    "owner": "King County",
    "reviewIntervalDays": 180
  }
]
```

A simple build-time script can warn when an article's review date is too old.

---

# Appendix C — Source list

**[S1] King County Explorer Search & Rescue — Home**  
https://www.kcesar.org/

**[S2] King County Explorer Search & Rescue — About / Mission**  
https://www.kcesar.org/about

**[S3] King County Explorer Search & Rescue — Contact / Emergency Direction**  
https://www.kcesar.org/contact-us

**[S4] King County Search & Rescue Association — Wilderness Safety**  
https://kingcountysar.org/wilderness-safety/

**[S5] King County Search & Rescue Association — When/How to Call for Help**  
https://kingcountysar.org/when-how-to-call-for-help/

**[S6] King County Search & Rescue Association — Winter Safety**  
https://kingcountysar.org/winter-safety/

**[S7] King County Search & Rescue Association — Backcountry Radio**  
https://kingcountysar.org/backcountry-radio/

**[S8] King County Search & Rescue Association — Resources**  
https://kingcountysar.org/resources/

**[S9] King County — Calling 911: the basics**  
https://kingcounty.gov/en/dept/kcit/data-information-services/911-program-office/911-the-basics

**[S10] King County — How to call 911 using modern devices**  
https://kingcounty.gov/en/dept/kcit/data-information-services/911-program-office/how-to-call-911-using-modern-devices

**[S11] Washington Trails Association — Help Search and Rescue Help You**  
https://www.wta.org/go-outside/trail-smarts/search-and-rescue/help-search-and-rescue-help-you

**[S12] AdventureSmart — The Three Ts**  
https://www.adventuresmart.ca/the-three-ts/

**[S13] AdventureSmart — Online Trip Plan**  
https://old.adventuresmart.ca/tripplan/tripplan.php

**[S14] AdventureSmart — Hug-a-Tree and Survive**  
https://www.adventuresmart.ca/programs/hug-a-tree-and-survive/

**[S15] National Park Service — Trip Plan**  
https://home.nps.gov/articles/gtgtripplan.htm/index.htm

**[S16] National Park Service — Outdoor Emergency Plan**  
https://www.nps.gov/articles/gtgemergencyplan.htm

**[S17] National Park Service — Hike Smart**  
https://www.nps.gov/articles/hiking-safety.htm

**[S18] Northwest Avalanche Center — Backcountry Basics**  
https://nwac.us/backcountry-basics/

**[S19] KCESAR official Linktree / social links**  
https://linktr.ee/kingcounty_esar

**[S20] KCESAR public education event — How Not to Die: Backcountry Mistakes and How to Avoid Them**  
https://www.eventbrite.com/e/how-not-to-die-backcountry-mistakes-and-how-to-avoid-them-tickets-1988657132015

**[S21] KCESAR Facebook — "4 SAR Missions in One Day" (search-indexed public post)**  
https://www.facebook.com/kingcountyesar/posts/-4-sar-missions-in-one-day-today-was-a-busy-one-for-king-county-explorer-search-/1312422680928698/

**[S22] KCESAR Facebook — "8 Missions in 7 Days" (search-indexed public post)**  
https://www.facebook.com/kingcountyesar/posts/-8-missions-in-7-days-in-just-one-week-93-of-our-esar-volunteers-responded-to-8-/1119276696909965/

**[S23] KCESAR Facebook — Snow Lake response (search-indexed public post)**  
https://www.facebook.com/kingcountyesar/posts/double-duty-at-snow-lake-at-1pm-today-esar-was-dispatched-to-assist-a-hiker-with/1153338646837103/

**[S24] KCESAR Facebook — Rapid Alpine Deployment season (search-indexed public post)**  
https://www.facebook.com/kingcountyesar/posts/its-the-start-of-rapid-alpine-deployment-or-rad-season-every-weekend-from-now-un/1095315889306046/

**[S25] KCESAR Facebook — NAS Whidbey SAR partnership (search-indexed public post)**  
https://www.facebook.com/kingcountyesar/posts/great-connecting-with-the-incredible-nas-whidbey-island-sar-team-during-a-recent/1367266308777668/

**[S26] New Zealand Mountain Safety Council — About Plan My Walk**  
https://www.mountainsafety.org.nz/about-plan-my-walk

**[S27] Emergency+**  
https://www.emergencyplus.com.au/

**[S28] Beacon by HOSAR — App Store**  
https://apps.apple.com/us/app/beacon-by-hosar/id6771264474

**[S29] Washington Department of Fish & Wildlife — Black Bear**  
https://wdfw.wa.gov/species-habitats/species/ursus-americanus

**[S30] Apple Developer — Core Location / location accuracy**  
https://developer.apple.com/documentation/corelocation

**[S31] Apple Support — Emergency SOS via satellite**  
https://support.apple.com/en-us/101573

**[S32] Apple Developer — MessageUI / MFMessageComposeViewController**  
https://developer.apple.com/documentation/messageui/mfmessagecomposeviewcontroller

**[S33] Federal Communications Commission — Text-to-911 Bounce-Back Requirements**  
https://docs.fcc.gov/public/attachments/FCC-13-64A1_Rcd.pdf

**[S34] Apple Support — Save battery life with Power Modes on iPhone**  
https://support.apple.com/guide/iphone/save-battery-life-with-power-modes-on-iphone-iphcab9aecd1/26/ios/26

**[S35] Apple Support — Connect to a satellite with your iPhone**  
https://support.apple.com/en-us/105097


**[S36] King County Search & Rescue Association — Home / Specialized Member Units**  
https://kingcountysar.org/

**[S37] King County Search & Rescue Association — History / Association Role**  
https://kingcountysar.org/history/

**[S38] Apple Developer — Organization Enrollment and Team Roles**  
https://developer.apple.com/programs/enroll/  
https://developer.apple.com/help/account/access/roles

**[S39] Apple Developer — `UNNotificationInterruptionLevel.timeSensitive`**  
https://developer.apple.com/documentation/usernotifications/unnotificationinterruptionlevel/timesensitive

---

# Appendix D — Research limitation note

KCESAR's official Instagram and Facebook accounts were identified through KCESAR's website and official Linktree. Meta intermittently blocks anonymous automated page retrieval, so the social-media review used the official account links plus publicly search-indexed post titles/snippets and public KCESAR event descriptions rather than claiming a complete chronological audit of every social post. The product conclusions drawn from social media are therefore thematic rather than quantitative.


---

# Appendix E — Review feedback disposition (September 2026, rounds 1–2)

The following external review recommendations were incorporated or refined in this revision:

| Feedback | Disposition | Rationale |
|---|---|---|
| Text-to-911 bounce-back | **Accepted** | FCC requirement verified; app now explains that bounce-back means failure and another contact method is required. [S33] |
| Teach overdue-time buffer | **Accepted with refinement** | UI suggests a buffer but does not prescribe a universal 2–3 hour rule because trip context matters. |
| Acknowledge iPhone-only group risk | **Accepted** | Recorded as an operational launch risk; Android promoted as first major follow-on, without expanding V1. |
| Decide coordinate format with Operations now | **Accepted** | Promoted from P1/open question to a pre-build gate for Emergency UI. |
| Explicit battery-preservation steps | **Accepted with correction** | Low Power Mode/brightness guidance added. Generic force-closing and indiscriminate radio shutdown were rejected as unsafe/poorly grounded. [S34] |
| Phone flash SOS strobe | **Accepted as optional P1, reframed** | Added as an Operations-reviewed nearby-rescuer signaling light, not as an SOS/transmission feature. |
| Structured medical fields | **Accepted** | Split into Allergies & Medications and Relevant Medical Conditions for easier dispatcher/responder scanning. |
| Codable JSON instead of SwiftData | **Accepted** | Better fit for the deliberately small schema and single-maintainer constraint. |
| Remote `links.json` | **Accepted as optional narrow mechanism** | Only external URLs may update remotely; all safety content remains bundled and offline. |
| Warn against following water downhill | **Accepted** | Added as a Cascade-specific terrain-trap warning. |
| Satellite needs open sky/horizon | **Accepted** | Explicit Apple guidance added, including foliage/canyon/mountain obstruction. [S31][S35] |

### Second review round

| Feedback | Disposition | Rationale |
|---|---|---|
| Emergency IA/mockup inconsistency; too many choices | **Accepted** | Reduced to five top-level choices total, including Other; overnight/winter moved to contextual guidance. |
| Define Other Emergency | **Accepted** | Added a generic location + 911 + brief-description + stay-available fallback. |
| Clarify KCESAR/KCSARA relationship near the front | **Accepted** | Added Section 2.1 using both organizations' current public descriptions. [S2][S36][S37] |
| P0 is too large for a single maintainer | **Accepted** | Split into v0.9 field beta, v1.0 public release, and v1.1/1.2 fast follow. |
| Add review tiebreaker/conflict path | **Accepted with safety-domain constraint** | Domain authorities control medical/dispatch/operations claims; Board/product owner can ship/defer but cannot overrule domain safety expertise. |
| Organization-owned Apple/App Store account and continuity | **Accepted** | Added organizational membership, Account Holder/Admin, repo ownership, multiple maintainers, and succession requirements. [S38] |
| Offline sunset-awareness nudge | **Accepted as P1** | Useful only when a real trip coordinate exists; explicitly an astronomical estimate, not weather/daylight guarantee. |
| Practice/demo Emergency mode | **Accepted** | Added as v0.9 so outreach/testing cannot accidentally contact 911. |
| Share plan before leaving coverage | **Accepted** | Added direct behavioral CTA after plan creation. |
| Time Sensitive local reminder | **Accepted selectively** | Only opt-in overdue-action reminder may be Time Sensitive; ordinary reminders remain active and Critical Alerts are not used. [S39] |
| Operations post-incident feedback channel | **Accepted** | Added anonymized/internal safety-content debrief loop to success measures. |
| Early Spanish critical-string localization | **Accepted with staged scope** | Localization architecture starts immediately; critical Emergency shell targeted for v1.0 if human review is available. |
| Indefinite screen-awake behavior conflicts with battery goals | **Accepted** | Default Auto-Lock preserved; any keep-awake behavior must be temporary and user-controlled. |
| Trip-plan status missing | **Accepted** | Added draft/current/completed state plus shared/completed timestamps. |
| Board-oriented 1–2 page summary | **Accepted** | Companion Board Decision Summary produced with this revision. |

