import SwiftUI
import WidgetKit

/// The snapshot the app writes to the App Group (`lib/widget-snapshot.ts`). Every field is optional
/// so an older or empty snapshot still renders.
struct GlowSnapshot: Codable {
  var score: Int?
  var scoreTrend: String?        // "up", "down" or "stable"
  var scoreWeekDelta: Int?
  var scoreSeries: [Int]?
  var mood: String?
  var sleep: String?             // "6h 40m"
  var sleepNote: String?         // "rested"
  var sleepBars: [Double]?       // 0...1, oldest first
  var stress: String?
  var streak: Int?
  var nextPractice: String?      // "Box breathing · 4 min"
  var nextPracticeURL: String?
  var windDownAt: Double?        // epoch seconds
  var weekMoods: [Int]?          // 1...5 per day, 0 = none
  var glowPrompt: String?
  var labels: [String: String]?  // translated labels
}

enum SnapshotStore {
  static let group = "group.com.innerglowai.app"
  static func load() -> GlowSnapshot {
    guard
      let raw = UserDefaults(suiteName: group)?.string(forKey: "snapshot"),
      let data = raw.data(using: .utf8),
      let snap = try? JSONDecoder().decode(GlowSnapshot.self, from: data)
    else { return GlowSnapshot() }
    return snap
  }
}

extension GlowSnapshot {
  func label(_ key: String, _ fallback: String) -> String { labels?[key] ?? fallback }
}

enum Glow {
  static let bg = Color(red: 0.969, green: 0.957, blue: 0.949)        // #F7F4F2
  static let ink = Color(red: 0.141, green: 0.102, blue: 0.180)       // #241A2E
  static let plum = Color(red: 0.420, green: 0.322, blue: 0.475)      // #6B5279
  static let plumDeep = Color(red: 0.306, green: 0.227, blue: 0.369)  // #4E3A5E
  static let lavender = Color(red: 0.557, green: 0.498, blue: 0.651)  // #8E7FA6
  static let lavenderSoft = Color(red: 0.847, green: 0.706, blue: 0.847) // #D8B4D8
  static let mustard = Color(red: 0.886, green: 0.800, blue: 0.251)   // #E2CC40
  static let sky = Color(red: 0.533, green: 0.784, blue: 0.918)       // #88C8EA
  static let rose = Color(red: 1.0, green: 0.702, blue: 0.745)        // #FFB3BE
  static let muted = Color(red: 0.451, green: 0.420, blue: 0.400)     // #736B66
  static let night = Color(red: 0.149, green: 0.118, blue: 0.188)

  static func font(_ size: CGFloat, semibold: Bool = false) -> Font {
    .custom(semibold ? "Urbanist-SemiBold" : "Urbanist-Regular", size: size)
  }

  static func moodColor(_ v: Int) -> Color {
    switch v {
    case 1: return rose
    case 2: return lavenderSoft
    case 3: return mustard
    case 4: return mustard
    case 5: return sky
    default: return Color.white.opacity(0.25)
    }
  }
}

/// A soft blurred light, the brand's glow.
struct GlowLight: View {
  var color: Color
  var size: CGFloat
  var body: some View {
    Circle().fill(color).frame(width: size, height: size).blur(radius: size / 3)
  }
}

struct SnapshotEntry: TimelineEntry {
  let date: Date
  let snap: GlowSnapshot
}

struct SnapshotProvider: TimelineProvider {
  func placeholder(in context: Context) -> SnapshotEntry {
    SnapshotEntry(date: .now, snap: GlowSnapshot(score: 80, scoreTrend: "stable", scoreWeekDelta: 4, scoreSeries: [70, 74, 72, 76, 78, 77, 80], mood: "Good", sleep: "6h 40m", sleepNote: "rested", sleepBars: [0.6, 0.7, 0.5, 0.8, 0.75, 0.9, 1], stress: "Low", streak: 12, nextPractice: "Box breathing · 4 min", weekMoods: [2, 3, 4, 4, 5, 4, 5], glowPrompt: "What’s one thing you’d like to let go of tonight?"))
  }
  func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : SnapshotEntry(date: .now, snap: SnapshotStore.load()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
    // The app reloads timelines whenever it writes a new snapshot; this is a quiet hourly refresh.
    let entry = SnapshotEntry(date: .now, snap: SnapshotStore.load())
    completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(3600))))
  }
}
