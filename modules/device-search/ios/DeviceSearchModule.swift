import ExpoModulesCore
import CoreSpotlight
import UniformTypeIdentifiers

public class DeviceSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeviceSearch")

    AsyncFunction("isAvailable") { () -> Bool in
      return CSSearchableIndex.isIndexingAvailable()
    }

    AsyncFunction("indexItems") { (items: [[String: Any]]) in
      guard CSSearchableIndex.isIndexingAvailable() else { return }

      var searchableItems: [CSSearchableItem] = []

      for item in items {
        guard let id = item["id"] as? String,
              let title = item["title"] as? String else {
          continue
        }

        let contentType = UTType.text
        let attributeSet = CSSearchableItemAttributeSet(contentType: contentType)
        attributeSet.title = title
        if let description = item["description"] as? String {
          attributeSet.contentDescription = description
        }
        if let keywords = item["keywords"] as? [String] {
          attributeSet.keywords = keywords
        }
        attributeSet.relatedUniqueIdentifier = id

        let uniqueId = (item["url"] as? String) ?? "trailsafe://article/\(id)"
        let searchableItem = CSSearchableItem(
          uniqueIdentifier: uniqueId,
          domainIdentifier: "com.appliedinteractions.trailsafe.guide",
          attributeSet: attributeSet
        )
        searchableItem.expirationDate = Date.distantFuture

        searchableItems.append(searchableItem)
      }

      return try await withCheckedThrowingContinuation { continuation in
        CSSearchableIndex.default().indexSearchableItems(searchableItems) { error in
          if let error = error {
            continuation.resume(throwing: error)
          } else {
            continuation.resume()
          }
        }
      }
    }

    AsyncFunction("clearItems") { () in
      guard CSSearchableIndex.isIndexingAvailable() else { return }
      return try await withCheckedThrowingContinuation { continuation in
        CSSearchableIndex.default().deleteSearchableItems(withDomainIdentifiers: ["com.appliedinteractions.trailsafe.guide"]) { error in
          if let error = error {
            continuation.resume(throwing: error)
          } else {
            continuation.resume()
          }
        }
      }
    }
  }
}
