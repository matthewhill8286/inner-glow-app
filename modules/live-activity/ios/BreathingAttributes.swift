import ActivityKit
import Foundation

/// Must match `targets/widget/Breathing.swift` field for field: ActivityKit matches the two by type name.
@available(iOS 16.1, *)
struct BreathingAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var phase: String
    var count: Int
    var endsAt: Date
  }
  var practice: String
  var startedAt: Date
}
