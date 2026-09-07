import XCTest

/// Runs only against the separately installed simulator app with a synthetic GPS fix.
final class TrailSafeSmoke: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testAutomaticLocationFormatsAndPracticeMode() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["Cancel"].exists { springboard.buttons["Cancel"].tap() }
        let app = XCUIApplication(bundleIdentifier: "com.appliedinteractions.trailsafe")
        app.launch()
        XCTAssertTrue(app.buttons["NEED HELP?"].waitForExistence(timeout: 20))
        capture("ios-home", app)
        app.buttons["NEED HELP?"].tap()
        let coordinates = app.descendants(matching: .any).matching(identifier: "coordinates").firstMatch
        XCTAssertTrue(coordinates.waitForExistence(timeout: 20))
        if !coordinates.label.contains("47.42537") {
            app.buttons["Coordinate format"].tap()
            element("Decimal degrees (DD)", app).tap()
        }
        XCTAssertTrue(coordinates.label.contains("47.42537"), coordinates.label)
        capture("ios-emergency-dd", app)
        app.buttons["Coordinate format"].tap()
        element("Degrees & decimal minutes (DDM)", app).tap()
        XCTAssertTrue(coordinates.label.contains("25.522"), coordinates.label)
        app.buttons["Coordinate format"].tap()
        capture("ios-coordinate-dropdown", app)
        element("Universal Transverse Mercator (UTM)", app).tap()
        XCTAssertTrue(coordinates.label.contains("10T"), coordinates.label)
        for tab in ["Home", "Prepare", "Emergency", "Guide", "About"] {
            XCTAssertTrue(element(tab, app).isHittable, "Missing tab: \(tab)")
        }
        capture("ios-emergency-utm", app)

        let practice = app.buttons["Practice Emergency Mode"]
        for _ in 0..<8 { if practice.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(practice.isHittable)
        practice.tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "PRACTICE MODE")).firstMatch.exists)
        let call = app.buttons["CALL 911"]
        for _ in 0..<8 { if call.isHittable { break }; app.swipeDown() }
        XCTAssertTrue(call.isHittable)
        call.tap() // The assertion above ensures this is the simulated action.
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Nothing was contacted")).firstMatch.waitForExistence(timeout: 5))
        capture("ios-practice", app)
        app.buttons["Got it"].tap()
        app.buttons["TEXT 911"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Nothing was contacted")).firstMatch.waitForExistence(timeout: 5))
        app.buttons["Got it"].tap()
    }
    private func element(_ label: String, _ app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }
    private func capture(_ name: String, _ app: XCUIApplication) {
        // Allow the native modal dismissal to finish before recording visual evidence.
        RunLoop.current.run(until: Date().addingTimeInterval(1))
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
