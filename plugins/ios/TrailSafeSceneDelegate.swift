internal import Expo
import CoreSpotlight
import React

class TrailSafeSceneDelegate: ExpoAppSceneDelegate {
  private func spotlightURL(_ activities: Set<NSUserActivity>) -> URL? {
    guard let activity = activities.first(where: { $0.activityType == CSSearchableItemActionType }),
          let identifier = activity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
          let url = URL(string: identifier), url.scheme == "trailsafe" else { return nil }
    return url
  }

  override func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    // Expo forwards normal URL/universal links. Spotlight needs its identifier
    // inserted in RN launch options before the JS router starts listening.
    guard let url = spotlightURL(connectionOptions.userActivities),
          let windowScene = scene as? UIWindowScene,
          let provider = UIApplication.shared.delegate as? ExpoReactNativeFactoryProvider,
          let factory = provider.reactNativeFactory else {
      super.scene(scene, willConnectTo: session, options: connectionOptions)
      return
    }
    let window = UIWindow(windowScene: windowScene)
    self.window = window
    provider.window = window
    factory.startReactNative(withModuleName: provider.reactNativeFactoryModuleName, in: window, initialProperties: initialProperties, launchOptions: [UIApplication.LaunchOptionsKey.url: url])
    window.makeKeyAndVisible()
  }

  override func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let url = spotlightURL([userActivity]) else {
      super.scene(scene, continue: userActivity)
      return
    }
    let link = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
    link.webpageURL = url
    super.scene(scene, continue: link)
  }
}
