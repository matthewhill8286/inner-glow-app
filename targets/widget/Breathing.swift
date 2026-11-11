import ActivityKit
import SwiftUI
import WidgetKit

/// Must match `modules/live-activity/ios/BreathingAttributes.swift` field for field: ActivityKit
/// matches the two by type name.
struct BreathingAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var phase: String
    var count: Int
    var endsAt: Date
  }
  var practice: String
  var startedAt: Date
}

/// Box breathing Live Activity (`6852:8322`): the practice, the phase and its count, the time left.
struct BreathingLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: BreathingAttributes.self) { context in
      HStack(alignment: .center, spacing: 14) {
        GlowLight(color: Glow.mustard, size: 34)
        VStack(alignment: .leading, spacing: 6) {
          Text(context.attributes.practice.uppercased()).font(Glow.font(11, semibold: true)).foregroundStyle(.white.opacity(0.7))
          Text(context.state.phase).font(Glow.font(20, semibold: true)).foregroundStyle(.white)
          ProgressView(timerInterval: context.attributes.startedAt...context.state.endsAt, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }
            .tint(Glow.mustard)
        }
        VStack(alignment: .trailing, spacing: 6) {
          Text("\(context.state.count)").font(Glow.font(30)).foregroundStyle(Glow.mustard)
          Text(timerInterval: Date.now...context.state.endsAt, countsDown: true).font(Glow.font(12)).foregroundStyle(.white.opacity(0.8))
            .multilineTextAlignment(.trailing).frame(width: 52)
        }
      }
      .padding(16)
      .activityBackgroundTint(Glow.night.opacity(0.85))
      .activitySystemActionForegroundColor(.white)
      .widgetURL(URL(string: "innerglow://mindful"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) { GlowLight(color: Glow.mustard, size: 26) }
        DynamicIslandExpandedRegion(.center) {
          Text("\(context.attributes.practice) · \(context.state.phase)").font(Glow.font(14, semibold: true))
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(timerInterval: Date.now...context.state.endsAt, countsDown: true).font(Glow.font(13)).frame(width: 48)
        }
      } compactLeading: {
        Circle().fill(Glow.mustard).frame(width: 12, height: 12)
      } compactTrailing: {
        Text(timerInterval: Date.now...context.state.endsAt, countsDown: true).font(Glow.font(12)).frame(width: 40)
      } minimal: {
        Circle().fill(Glow.mustard).frame(width: 12, height: 12)
      }
      .widgetURL(URL(string: "innerglow://mindful"))
    }
  }
}

@main
struct InnerGlowWidgets: WidgetBundle {
  var body: some Widget {
    DayWidget()
    StreakWidget()
    BreatheWidget()
    CheckInWidget()
    AskGlowWidget()
    ScoreWidget()
    SleepWidget()
    LockScoreWidget()
    LockStreakWidget()
    LockWindDownWidget()
    LockLastNightWidget()
    LockWeekWidget()
    BreathingLiveActivity()
  }
}
