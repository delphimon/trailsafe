import XCTest

/// Runs only against the separately installed simulator app with a synthetic GPS fix.
final class TrailSafeSmoke: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testAutomaticLocationFormats() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["Cancel"].exists { springboard.buttons["Cancel"].tap() }
        let app = XCUIApplication(bundleIdentifier: "com.appliedinteractions.trailsafe")
        app.launch()
        XCTAssertTrue(app.buttons["NEED HELP?"].waitForExistence(timeout: 20))
        capture("ios-home", app)
        app.buttons["NEED HELP?"].tap()
        let coordinates = app.descendants(matching: .any).matching(identifier: "coordinates").firstMatch
        XCTAssertTrue(coordinates.waitForExistence(timeout: 20))
        app.buttons["DD"].tap()
        XCTAssertTrue(coordinates.label.contains("47.42537"), coordinates.label)
        capture("ios-emergency-dd", app)
        app.buttons["DDM"].tap()
        XCTAssertTrue(coordinates.label.contains("25.522"), coordinates.label)
        app.buttons["UTM"].tap()
        XCTAssertTrue(coordinates.label.contains("10T"), coordinates.label)
        for tab in ["Prepare", "Help", "Guide", "Tools"] {
            XCTAssertTrue(element(tab, app).isHittable, "Missing tab: \(tab)")
        }
        capture("ios-emergency-utm", app)

        // Never tap call/text transports in a native smoke test. Domain tests inject inert handlers.
        XCTAssertFalse(app.buttons["Practice Emergency Mode"].exists)
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
