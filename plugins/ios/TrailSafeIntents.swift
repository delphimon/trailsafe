import AppIntents
import Foundation
import UIKit

// MARK: - Open Emergency Intent
@available(iOS 16.0, *)
struct OpenEmergencyIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Emergency"
  static var description = IntentDescription("Opens the TrailSafe Emergency screen to immediately acquire GPS coordinates.")
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    if let url = URL(string: "trailsafe://emergency") {
      await UIApplication.shared.open(url)
    }
    return .result()
  }
}

// MARK: - Complete Current Trip Intent
@available(iOS 16.0, *)
struct CompleteCurrentTripIntent: AppIntent {
  static var title: LocalizedStringResource = "Mark Trip Complete"
  static var description = IntentDescription("Marks your current active TrailSafe trip plan as completed to prevent false alarms.")
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    if let url = URL(string: "trailsafe://plan/current/complete") {
      await UIApplication.shared.open(url)
    }
    return .result()
  }
}

// MARK: - Search Safety Guide Intent
@available(iOS 17.2, *)
struct SearchGuideIntent: ShowInAppSearchResultsIntent {
  static var title: LocalizedStringResource = "Search in TrailSafe"
  static var searchScopes: [StringSearchScope] = [.general]

  @Parameter(title: "Search Term", requestValueDialog: IntentDialog("What would you like to search for?"))
  var criteria: StringSearchCriteria

  @MainActor
  func perform() async throws -> some IntentResult {
    let q = criteria.term
    let encoded = q.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? q
    let urlString = q.isEmpty ? "trailsafe://guide" : "trailsafe://guide?search=\(encoded)"
    if let url = URL(string: urlString) {
      await UIApplication.shared.open(url)
    }
    return .result()
  }
}

// MARK: - App Shortcuts Provider
@available(iOS 17.2, *)
struct TrailSafeShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: OpenEmergencyIntent(),
      phrases: [
        "Open Emergency in \(.applicationName)",
        "Emergency in \(.applicationName)",
        "I need help in \(.applicationName)"
      ],
      shortTitle: "Emergency",
      systemImageName: "cross.case.fill"
    )
    AppShortcut(
      intent: CompleteCurrentTripIntent(),
      phrases: [
        "Mark my trip complete in \(.applicationName)",
        "Complete my trip in \(.applicationName)",
        "Finish my hike in \(.applicationName)"
      ],
      shortTitle: "Complete Trip",
      systemImageName: "checkmark.circle.fill"
    )
    AppShortcut(
      intent: SearchGuideIntent(),
      phrases: [
        "Search in \(.applicationName)",
        "Search Guide in \(.applicationName)",
        "Search \(.applicationName)",
        "Safety Guide in \(.applicationName)"
      ],
      shortTitle: "Search Guide",
      systemImageName: "magnifyingglass"
    )
  }
}

