import SwiftUI
import WidgetKit

/// Lock Screen widgets (`6852:8322`, `6852:8397`): score and streak circles, wind down, last night
/// and this week's moods.
struct LockScoreWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "lock-score", provider: SnapshotProvider()) { entry in
      Gauge(value: Double(entry.snap.score ?? 0), in: 0...100) {
        EmptyView()
      } currentValueLabel: {
        Text(entry.snap.score.map(String.init) ?? "–").font(Glow.font(16, semibold: true))
      }
      .gaugeStyle(.accessoryCircularCapacity)
      .containerBackground(for: .widget) { AccessoryWidgetBackground() }
      .widgetURL(URL(string: "innerglow://freud-score"))
    }
    .configurationDisplayName("Glow score")
    .description("Your Glow score on the Lock Screen.")
    .supportedFamilies([.accessoryCircular, .accessoryInline])
  }
}

struct LockStreakWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "lock-streak", provider: SnapshotProvider()) { entry in
      VStack(spacing: 0) {
        Image(systemName: "flame").font(.system(size: 13))
        Text("\(entry.snap.streak ?? 0)").font(Glow.font(16, semibold: true))
      }
      .containerBackground(for: .widget) { AccessoryWidgetBackground() }
      .widgetURL(URL(string: "innerglow://profile/streak"))
    }
    .configurationDisplayName("Streak")
    .description("Days of showing up.")
    .supportedFamilies([.accessoryCircular])
  }
}

struct LockWindDownWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "lock-winddown", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading, spacing: 4) {
        Label(entry.snap.label("windDown", "Wind down"), systemImage: "moon").font(Glow.font(13, semibold: true))
        if let at = entry.snap.windDownAt.map({ Date(timeIntervalSince1970: $0) }), at > entry.date {
          Text(at, style: .time).font(Glow.font(11)) + Text(" · ").font(Glow.font(11)) + Text(at, style: .relative).font(Glow.font(11))
          ProgressView(timerInterval: entry.date...at, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
            .tint(Glow.mustard)
        } else {
          Text(entry.snap.label("windDownSet", "Set a wind-down time in Sleep")).font(Glow.font(11))
        }
      }
      .containerBackground(for: .widget) { AccessoryWidgetBackground() }
      .widgetURL(URL(string: "innerglow://sleep/schedule"))
    }
    .configurationDisplayName("Wind down")
    .description("When it’s time to start slowing down.")
    .supportedFamilies([.accessoryRectangular])
  }
}

struct LockLastNightWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "lock-lastnight", provider: SnapshotProvider()) { entry in
      HStack(alignment: .bottom) {
        VStack(alignment: .leading, spacing: 2) {
          Text(entry.snap.label("lastNight", "Last night")).font(Glow.font(11))
          Text(entry.snap.sleep ?? "–").font(Glow.font(16, semibold: true))
        }
        Spacer()
        Bars(values: entry.snap.sleepBars ?? [], height: 22)
      }
      .containerBackground(for: .widget) { AccessoryWidgetBackground() }
      .widgetURL(URL(string: "innerglow://sleep"))
    }
    .configurationDisplayName("Last night")
    .description("Your sleep at a glance.")
    .supportedFamilies([.accessoryRectangular])
  }
}

struct LockWeekWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "lock-week", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading, spacing: 6) {
        Text(entry.snap.label("thisWeekTitle", "This week")).font(Glow.font(11))
        HStack(spacing: 5) {
          ForEach(Array((entry.snap.weekMoods ?? Array(repeating: 0, count: 7)).suffix(7).enumerated()), id: \.offset) { _, v in
            Circle().fill(Glow.moodColor(v)).frame(width: 11, height: 11)
          }
        }
      }
      .containerBackground(for: .widget) { AccessoryWidgetBackground() }
      .widgetURL(URL(string: "innerglow://mood/history"))
    }
    .configurationDisplayName("This week")
    .description("Your moods this week.")
    .supportedFamilies([.accessoryRectangular])
  }
}
