import XCTest

/// Runs only against an isolated simulator with a synthetic GPS fix and fictional
/// current/upcoming/past plan fixtures. Never seed or run against a personal device.
/// Never tap phone, SMS, or external-resource transport controls here.
final class TrailSafeSmoke: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testSixDestinationsHomeTripsAndBundledGuide() {
        let app = launch()
        XCTAssertTrue(app.staticTexts["TrailSafe"].waitForExistence(timeout: 20))
        for tab in ["Home", "Trips", "Prepare", "Help", "Guide", "Tools"] {
            XCTAssertTrue(element(tab, app).isHittable, "Missing tab: \(tab)")
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
    private func launch() -> XCUIApplication {
        let app = XCUIApplication(bundleIdentifier: "com.appliedinteractions.trailsafe")
        app.launch()
        XCTAssertTrue(element("Home", app).waitForExistence(timeout: 20))
        return app
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
        XCTAssertLessThanOrEqual(target.frame.maxY, element("Home", app).frame.minY, "Result must fit above the bottom tabs")
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
            app.scrollViews.firstMatch.swipeUp()
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
