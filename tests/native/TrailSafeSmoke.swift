import XCTest

/// Runs only against an isolated simulator with a synthetic GPS fix.
/// Never tap phone, SMS, or external-resource transport controls here.
final class TrailSafeSmoke: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testFourDestinationsAndBundledGuide() {
        let app = launch()
        XCTAssertTrue(app.staticTexts["Before You Go"].waitForExistence(timeout: 20))
        for tab in ["Prepare", "Help", "Guide", "Tools"] {
            XCTAssertTrue(app.buttons[tab].isHittable, "Missing tab: \(tab)")
        }
        capture("ios-prepare", app)
        app.buttons["Guide"].tap()
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
        app.buttons["Prepare"].tap()
        XCTAssertTrue(app.staticTexts["Before You Go"].waitForExistence(timeout: 10))
    }

    func testNativeDatePickerAndWaterGuidance() {
        let app = launch()
        app.buttons["Tools"].tap()
        XCTAssertTrue(app.staticTexts["Simple estimates and offline guidance"].waitForExistence(timeout: 10))
        let date = app.buttons.matching(NSPredicate(format: "label MATCHES %@", "[0-9]{4}-[0-9]{2}-[0-9]{2}")).firstMatch
        scrollTo(date, app)
        date.tap()
        XCTAssertTrue(app.pickerWheels.firstMatch.waitForExistence(timeout: 10), "Native date spinner did not open")
        XCTAssertGreaterThanOrEqual(app.pickerWheels.count, 3)
        capture("ios-native-daylight-date-picker", app)
        scrollTo(app.buttons["Done"], app)
        app.buttons["Done"].tap()
        XCTAssertFalse(app.pickerWheels.firstMatch.exists)
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
        app.buttons["Help"].tap()
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
        XCTAssertTrue(app.buttons["Prepare"].waitForExistence(timeout: 20))
        return app
    }
    private func scrollTo(_ target: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<12 {
            if target.exists && target.isHittable { return }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTFail("Element did not become hittable: \(target)")
    }
    private func capture(_ name: String, _ app: XCUIApplication) {
        // Allow the native modal dismissal to finish before recording visual evidence.
        RunLoop.current.run(until: Date().addingTimeInterval(1))
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        let hierarchy = XCTAttachment(string: app.debugDescription)
        hierarchy.name = "\(name)-hierarchy"
        hierarchy.lifetime = .keepAlways
        add(hierarchy)
    }
}
