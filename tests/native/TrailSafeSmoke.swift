import XCTest

/// Runs only against an isolated simulator with a synthetic GPS fix and fictional
/// current/upcoming/past plan fixtures. Never seed or run against a personal device.
/// Never tap phone, SMS, or external-resource transport controls here.
final class TrailSafeSmoke: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testFiveBottomDestinationsHeaderNavigationAndBundledGuide() {
        let app = launch()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 20))
        assertBottomDestinations(app)
        assertHeaderNavigation("TrailSafe", app)
        for (tab, title) in [("Plan", "Trip Plans"), ("Prepare", "Prepare"), ("Help", "Need Help?"), ("Guide", "Safety Guide"), ("Tools", "Tools")] {
            element(tab, app).tap()
            XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 10))
            assertBottomDestinations(app)
            assertHeaderNavigation(title, app)
            capture("ios-root-\(tab.lowercased())-header", app)
            app.buttons["Home"].tap()
            XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
            element(tab, app).tap()
            XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 10))
            app.buttons["About"].tap()
            XCTAssertTrue(app.staticTexts["About TrailSafe"].waitForExistence(timeout: 10))
            assertHeaderNavigation("About", app)
            capture("ios-about-from-\(tab.lowercased())", app)
            app.buttons["Home"].tap()
            XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
        }
        XCTAssertTrue(app.buttons["Open current trip"].waitForExistence(timeout: 10))
        capture("ios-home-current-trip", app)
        app.buttons["Open current trip"].tap()
        XCTAssertTrue(app.staticTexts["Smoke current hike"].waitForExistence(timeout: 10))
        capture("ios-home-open-current-trip", app)
        element("Home", app).tap()
        app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "All trip plans")).firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Current, upcoming and past trip plans"].waitForExistence(timeout: 10))
        for group in ["Current", "Upcoming", "Past"] {
            XCTAssertTrue(app.staticTexts[group].exists, "Missing trip group: \(group)")
        }
        capture("ios-trips", app)
        scrollTo(element("Smoke upcoming hike", app), app)
        XCTAssertTrue(element("Smoke upcoming hike", app).isHittable)
        capture("ios-trips-upcoming", app)
        scrollTo(element("Smoke past hike", app), app)
        XCTAssertTrue(element("Smoke past hike", app).isHittable)
        capture("ios-trips-past", app)
        element("Prepare", app).tap()
        XCTAssertTrue(app.staticTexts["Ten Essentials and the gear to bring"].waitForExistence(timeout: 10))
        capture("ios-prepare", app)
        element("Guide", app).tap()
        XCTAssertTrue(app.staticTexts["Safety Guide"].waitForExistence(timeout: 10))
        let search = app.textFields["Search safety topics"]
        XCTAssertTrue(search.waitForExistence(timeout: 10))
        search.tap()
        search.typeText("cold")
        capture("ios-guide-search", app)
        let article = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cold & hypothermia")).firstMatch
        XCTAssertTrue(article.waitForExistence(timeout: 10))
        article.tap()
        XCTAssertTrue(app.staticTexts["Cold & Hypothermia"].waitForExistence(timeout: 10))
        capture("ios-bundled-cold-guide", app)
        element("Home", app).tap()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
    }

    func testAnswersAboveFoldAndNativeHikingSliders() {
        let app = launch()
        element("Tools", app).tap()
        XCTAssertTrue(app.staticTexts["Useful answers, right at hand"].waitForExistence(timeout: 10))
        let headlamp = result("headlamp-result", app)
        waitForLocationResult(headlamp)
        assertAboveFold(headlamp, app)
        capture("ios-daylight-above-fold", app)
        app.buttons["Compass"].tap()
        let declination = result("declination-result", app)
        waitForLocationResult(declination)
        assertAboveFold(declination, app)
        capture("ios-compass-above-fold", app)
        app.buttons["Hiking"].tap()
        let estimate = result("hiking-result", app)
        XCTAssertTrue(estimate.waitForExistence(timeout: 10))
        assertAboveFold(estimate, app)
        let initialEstimate = estimate.label
        capture("ios-hiking-initial", app)
        let distance = element("Total distance", app)
        let gain = element("Elevation gain", app)
        XCTAssertTrue(distance.isHittable)
        XCTAssertTrue(gain.isHittable)
        XCTAssertEqual(distance.value as? String, "6 miles")
        XCTAssertEqual(gain.value as? String, "2,000 ft")
        for label in ["3 mi", "6 mi", "10 mi", "15 mi", "0 ft", "1,000 ft", "2,000 ft", "4,000 ft"] {
            XCTAssertTrue(app.buttons[label].exists, "Missing quick input: \(label)")
        }
        dragSlider(distance, minimum: 0.5, maximum: 30, to: 0.35)
        XCTAssertNotEqual(estimate.label, initialEstimate)
        let distanceEstimate = estimate.label
        dragSlider(gain, minimum: 0, maximum: 8000, to: 0.5)
        XCTAssertNotEqual(estimate.label, distanceEstimate)
        XCTAssertEqual(app.keyboards.count, 0)
        capture("ios-hiking-native-sliders", app)
        app.buttons["3 mi"].tap()
        app.buttons["1,000 ft"].tap()
        XCTAssertTrue(app.staticTexts["Total distance: 3 miles"].exists)
        XCTAssertTrue(app.staticTexts["Elevation gain: 1,000 ft"].exists)
        XCTAssertEqual(app.keyboards.count, 0)
        capture("ios-hiking-quick-inputs", app)
    }

    func testNativeDatePickerAndWaterGuidance() {
        let app = launch()
        element("Tools", app).tap()
        XCTAssertTrue(app.staticTexts["Useful answers, right at hand"].waitForExistence(timeout: 10))
        scrollTo(app.buttons["Date & daylight details"], app)
        app.buttons["Date & daylight details"].tap()
        let date = app.buttons.matching(NSPredicate(format: "label MATCHES %@", "[0-9]{4}-[0-9]{2}-[0-9]{2}")).firstMatch
        scrollTo(date, app)
        let initialDate = date.label
        date.tap()
        XCTAssertTrue(app.pickerWheels.firstMatch.waitForExistence(timeout: 10), "Native date spinner did not open")
        XCTAssertGreaterThanOrEqual(app.pickerWheels.count, 3)
        scrollTo(app.buttons["Done"], app)
        // The isolated simulator uses the default English month/day/year spinner.
        let nextDay = initialDate.hasSuffix("-13") ? "14" : "13"
        app.pickerWheels.element(boundBy: 1).adjust(toPickerWheelValue: nextDay)
        let selectedDate = String(initialDate.dropLast(2)) + nextDay
        XCTAssertTrue(app.buttons[selectedDate].waitForExistence(timeout: 10))
        capture("ios-native-daylight-date-picker", app)
        app.buttons["Done"].tap()
        XCTAssertFalse(app.pickerWheels.firstMatch.exists)
        XCTAssertTrue(app.buttons[selectedDate].exists, "Done should retain the selected date")
        app.buttons["More"].tap()
        let guidance = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "phone’s Clock timer")).firstMatch
        scrollTo(guidance, app)
        XCTAssertTrue(guidance.isHittable)
        XCTAssertFalse(app.buttons["Start timer"].exists)
        XCTAssertFalse(app.buttons["Practice Emergency Mode"].exists)
        capture("ios-water-guidance", app)
    }

    func testAutomaticLocationFormats() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["Cancel"].exists { springboard.buttons["Cancel"].tap() }
        let app = launch()
        element("Help", app).tap()
        let coordinates = app.descendants(matching: .any).matching(identifier: "coordinates").firstMatch
        XCTAssertTrue(coordinates.waitForExistence(timeout: 20))
        app.buttons["DD"].tap()
        XCTAssertTrue(coordinates.label.contains("47.42537"), coordinates.label)
        capture("ios-emergency-dd", app)
        app.buttons["DDM"].tap()
        XCTAssertTrue(coordinates.label.contains("25.522"), coordinates.label)
        app.buttons["UTM"].tap()
        XCTAssertTrue(coordinates.label.contains("10T"), coordinates.label)
        capture("ios-emergency-utm", app)

        // Never tap call/text transports in a native smoke test. Domain tests inject inert handlers.
        XCTAssertFalse(app.buttons["Practice Emergency Mode"].exists)
    }

    func testUnsavedPlanNavigationAndDurableSave() {
        let app = launch()
        openCurrentEditor(app)
        let title = app.textFields["Trip title / destination"]
        enter("Smoke current hike UNSAVED", in: title, app)
        element("Guide", app).tap()
        XCTAssertTrue(app.buttons["Keep editing"].waitForExistence(timeout: 10))
        capture("ios-plan-unsaved-tab-guard", app)
        app.buttons["Keep editing"].tap()
        XCTAssertTrue(app.staticTexts["Edit Trip Plan"].waitForExistence(timeout: 10))
        XCTAssertEqual(title.value as? String, "Smoke current hike UNSAVED")
        for destination in ["Home", "About"] {
            app.buttons[destination].tap()
            XCTAssertTrue(app.buttons["Keep editing"].waitForExistence(timeout: 10))
            capture("ios-plan-unsaved-\(destination.lowercased())-guard", app)
            app.buttons["Keep editing"].tap()
            XCTAssertEqual(title.value as? String, "Smoke current hike UNSAVED")
        }

        app.buttons["Back"].tap()
        XCTAssertTrue(app.buttons["Discard changes"].waitForExistence(timeout: 10))
        capture("ios-plan-unsaved-back-guard", app)
        app.buttons["Discard changes"].tap()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
        openCurrentEditor(app)
        XCTAssertEqual(title.value as? String, "Smoke current hike")
        enter("Simulator saved hiker", in: app.textFields["Your name"], app)
        scrollTo(app.buttons["Save and preview"], app)
        app.buttons["Save and preview"].tap()
        XCTAssertTrue(app.staticTexts["Your plan, ready to share"].waitForExistence(timeout: 10))
        element("Plan", app).tap()
        XCTAssertTrue(app.staticTexts["Current, upcoming and past trip plans"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Keep editing"].exists, "Durably saved edits must not warn on navigation")
        element("Home", app).tap()
        openCurrentEditor(app)
        XCTAssertEqual(app.textFields["Your name"].value as? String, "Simulator saved hiker")
        app.buttons["Back"].tap()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Keep editing"].exists)
        capture("ios-plan-saved-navigation", app)
    }

    func testUnsavedProfileNavigationAndDurableSave() {
        let app = launch()
        openProfile(app)
        let name = app.textFields["Your name"]
        let original = name.value as? String ?? ""
        enter("Simulator unsaved profile", in: name, app)
        element("Home", app).tap()
        XCTAssertTrue(app.buttons["Keep editing"].waitForExistence(timeout: 10))
        capture("ios-profile-unsaved-home-guard", app)
        app.buttons["Keep editing"].tap()
        XCTAssertTrue(app.staticTexts["My Profile"].waitForExistence(timeout: 10))
        XCTAssertEqual(name.value as? String, "Simulator unsaved profile")
        app.buttons["About"].tap()
        XCTAssertTrue(app.buttons["Keep editing"].waitForExistence(timeout: 10))
        capture("ios-profile-unsaved-about-guard", app)
        app.buttons["Keep editing"].tap()
        XCTAssertEqual(name.value as? String, "Simulator unsaved profile")
        app.buttons["Back"].tap()
        XCTAssertTrue(app.buttons["Discard changes"].waitForExistence(timeout: 10))
        capture("ios-profile-unsaved-back-guard", app)
        app.buttons["Discard changes"].tap()
        XCTAssertTrue(app.staticTexts["Current, upcoming and past trip plans"].waitForExistence(timeout: 10))
        openProfile(app)
        XCTAssertEqual(name.value as? String, original)
        enter("Simulator saved profile", in: name, app)
        scrollTo(app.buttons["Save Profile"], app)
        app.buttons["Save Profile"].tap()
        XCTAssertTrue(app.staticTexts["Profile saved on this device"].waitForExistence(timeout: 10))
        element("Home", app).tap()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Keep editing"].exists, "Saved profile must not warn on navigation")
        openProfile(app)
        XCTAssertEqual(name.value as? String, "Simulator saved profile")
        app.buttons["Back"].tap()
        XCTAssertTrue(app.staticTexts["Current, upcoming and past trip plans"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Keep editing"].exists)
        capture("ios-profile-saved-navigation", app)
    }

    func testTripDateShortcutsUseTripTimeZone() {
        let app = launch()
        element("Plan", app).tap()
        app.buttons["New Trip Plan"].tap()
        XCTAssertTrue(app.staticTexts["New Trip Plan"].waitForExistence(timeout: 10))
        let zone = "Pacific/Kiritimati"
        enter(zone, in: app.textFields["Trip time zone"], app)
        scrollTo(app.buttons["Today"], app)
        app.buttons["Today"].tap()
        let date = app.buttons.matching(NSPredicate(format: "label MATCHES %@", "[0-9]{4}-[0-9]{2}-[0-9]{2}")).firstMatch
        XCTAssertEqual(date.label, dateString(Date(), in: zone))
        app.buttons.matching(NSPredicate(format: "label == %@", "Tomorrow")).firstMatch.tap()
        XCTAssertEqual(date.label, dateString(Date().addingTimeInterval(86400), in: zone))
        let before = roundedStamp(in: zone)
        app.buttons["Now"].tap()
        let after = roundedStamp(in: zone)
        XCTAssertTrue([before.date, after.date].contains(date.label))
        let time = app.buttons.matching(NSPredicate(format: "label MATCHES %@", "[0-9]{2}:[0-9]{2}")).firstMatch
        XCTAssertTrue([before.time, after.time].contains(time.label), "Now must use the trip zone, not the simulator zone")
        capture("ios-trip-zoned-shortcuts", app)
        element("Home", app).tap()
        XCTAssertTrue(app.buttons["Discard changes"].waitForExistence(timeout: 10))
        app.buttons["Discard changes"].tap()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
    }

    func testChecklistAssociatesOnFirstCheck() {
        let app = launch()
        element("Prepare", app).tap()
        XCTAssertFalse(app.staticTexts["Checklist may be from a previous trip"].exists)
        let water = element("Water", app)
        scrollTo(water, app)
        water.tap()
        let progress = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "1/10")).firstMatch
        XCTAssertTrue(progress.waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Checklist may be from a previous trip"].exists, "First check must associate with the current trip")
        capture("ios-checklist-first-check", app)
        app.terminate()
        app.launch()
        XCTAssertTrue(element("Prepare", app).waitForExistence(timeout: 20))
        element("Prepare", app).tap()
        XCTAssertTrue(progress.waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Checklist may be from a previous trip"].exists, "Checklist association must persist across launch")
        capture("ios-checklist-persisted-association", app)
    }

    private func openCurrentEditor(_ app: XCUIApplication) {
        XCTAssertTrue(app.buttons["Open current trip"].waitForExistence(timeout: 10))
        app.buttons["Open current trip"].tap()
        scrollTo(app.buttons["Edit Details"], app)
        app.buttons["Edit Details"].tap()
        XCTAssertTrue(app.textFields["Trip title / destination"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.textFields["Trip title / destination"].isHittable, "Edit must open at the top of the form")
        capture("ios-plan-editor-opens-at-top", app)
    }
    private func openProfile(_ app: XCUIApplication) {
        if !app.staticTexts["Current, upcoming and past trip plans"].exists { element("Plan", app).tap() }
        let profile = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "My reusable profile")).firstMatch
        scrollTo(profile, app)
        profile.tap()
        XCTAssertTrue(app.textFields["Your name"].waitForExistence(timeout: 10))
    }
    private func enter(_ value: String, in field: XCUIElement, _ app: XCUIApplication) {
        scrollTo(field, app)
        field.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        let existing = field.value as? String ?? ""
        if !existing.isEmpty { field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: existing.count)) }
        // Feed native key events at human speed so controlled TextInput updates
        // finish between characters instead of racing XCTest's bulk injection.
        for character in value { field.typeText(String(character)) }
        field.typeText("\n")
        XCTAssertEqual(field.value as? String, value)
    }
    private func dateString(_ date: Date, in zone: String) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: zone)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    private func roundedStamp(in zone: String) -> (date: String, time: String) {
        let rounded = Date(timeIntervalSince1970: ceil(Date().timeIntervalSince1970 / 300) * 300)
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: zone)
        formatter.dateFormat = "HH:mm"
        return (dateString(rounded, in: zone), formatter.string(from: rounded))
    }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication(bundleIdentifier: "com.appliedinteractions.trailsafe")
        app.launch()
        XCTAssertTrue(app.buttons["Home"].waitForExistence(timeout: 20))
        app.buttons["Home"].tap()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 10))
        return app
    }
    private func assertBottomDestinations(_ app: XCUIApplication) {
        let labels = ["Plan", "Prepare", "Help", "Guide", "Tools"]
        let baseline = app.otherElements.matching(NSPredicate(format: "label == %@", "Plan")).firstMatch.frame.minY
        XCTAssertGreaterThan(baseline, app.frame.height * 0.75, "Plan belongs in the bottom bar")
        for label in labels {
            // Root headings repeat Prepare/Tools labels; native tab wrappers are Other.
            let tab = app.otherElements.matching(NSPredicate(format: "label == %@", label)).firstMatch
            XCTAssertTrue(tab.isHittable, "Missing bottom tab: \(label)")
            XCTAssertEqual(tab.frame.minY, baseline, accuracy: 2, "Tabs must share the bottom bar")
        }
        XCTAssertFalse(element("Trips", app).exists)
        XCTAssertLessThan(app.buttons["Home"].frame.maxY, baseline, "Home belongs in the header")
    }
    private func assertHeaderNavigation(_ title: String, _ app: XCUIApplication) {
        let home = app.buttons["Home"]
        let about = app.buttons["About"]
        let heading = app.staticTexts[title].firstMatch
        XCTAssertTrue(home.isHittable)
        XCTAssertTrue(about.isHittable)
        for button in [home, about] {
            XCTAssertGreaterThanOrEqual(button.frame.width, 44)
            XCTAssertGreaterThanOrEqual(button.frame.height, 44)
        }
        XCTAssertLessThanOrEqual(home.frame.maxX, heading.frame.minX)
        XCTAssertLessThanOrEqual(heading.frame.maxX, about.frame.minX)
        XCTAssertEqual(home.frame.midY, about.frame.midY, accuracy: 2)
    }
    private func element(_ label: String, _ app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }
    private func result(_ identifier: String, _ app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
    private func waitForLocationResult(_ target: XCUIElement) {
        XCTAssertTrue(target.waitForExistence(timeout: 20))
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label != %@", "Waiting for location"), object: target)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 20), .completed)
    }
    private func assertAboveFold(_ target: XCUIElement, _ app: XCUIApplication) {
        XCTAssertTrue(target.isHittable, "Result must be visible without scrolling")
        XCTAssertGreaterThan(target.frame.height, 0)
        XCTAssertLessThanOrEqual(target.frame.maxY, element("Plan", app).frame.minY, "Result must fit above the bottom tabs")
    }
    private func dragSlider(_ control: XCUIElement, minimum: Double, maximum: Double, to target: Double) {
        // Fabric exposes the named adjustable wrapper as Other in XCTest. Derive
        // thumb coordinates from its live AX frame/value and verify a real drag.
        let initial = control.value as? String ?? ""
        let numeric = initial.filter { "0123456789.".contains($0) }
        guard let value = Double(numeric) else { return XCTFail("Missing slider value: \(initial)") }
        let inset = min(control.frame.height / 2, control.frame.width / 4) / control.frame.width
        let current = CGFloat((value - minimum) / (maximum - minimum))
        let start = control.coordinate(withNormalizedOffset: CGVector(dx: inset + (1 - 2 * inset) * current, dy: 0.5))
        let end = control.coordinate(withNormalizedOffset: CGVector(dx: inset + (1 - 2 * inset) * CGFloat(target), dy: 0.5))
        start.press(forDuration: 0.1, thenDragTo: end)
        let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value != %@", initial), object: control)
        XCTAssertEqual(XCTWaiter.wait(for: [changed], timeout: 10), .completed, "Dragging must change the live slider value")
    }
    private func scrollTo(_ target: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<12 {
            if target.exists && target.isHittable { return }
            let viewport = app.scrollViews.firstMatch
            if target.exists && target.frame.maxY < viewport.frame.minY {
                viewport.swipeDown()
            } else {
                viewport.swipeUp()
            }
        }
        capture("ios-scroll-target-missing", app)
        print(app.debugDescription)
        XCTFail("Element did not become hittable: \(target)")
    }
    private func capture(_ name: String, _ app: XCUIApplication) {
        // Allow the native modal dismissal to finish before recording visual evidence.
        RunLoop.current.run(until: Date().addingTimeInterval(1))
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        let hierarchy = XCTAttachment(string: app.debugDescription)
        hierarchy.name = "\(name)-hierarchy"
        hierarchy.lifetime = .keepAlways
        add(hierarchy)
        // Keep independent evidence when Xcode result-bundle finalization stalls.
        let evidence = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!.appendingPathComponent("TrailSafeSmoke", isDirectory: true)
        try? FileManager.default.createDirectory(at: evidence, withIntermediateDirectories: true)
        try? screenshot.pngRepresentation.write(to: evidence.appendingPathComponent("\(name).png"))
        try? app.debugDescription.write(to: evidence.appendingPathComponent("\(name)-hierarchy.txt"), atomically: true, encoding: .utf8)
        print("Native evidence: \(evidence.path)/\(name)")
    }
}
