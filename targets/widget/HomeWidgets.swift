import SwiftUI
import WidgetKit

private func link(_ path: String) -> URL { URL(string: "innerglow://\(path)")! }

/// Your day, in light (`6848:8298`): score with its week line, mood, sleep and stress, and the next practice.
struct DayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "day", provider: SnapshotProvider()) { entry in
      DayView(snap: entry.snap)
        .containerBackground(for: .widget) { ZStack { Glow.bg; GlowLight(color: Glow.mustard.opacity(0.45), size: 200).offset(x: 90, y: -60) } }
        .widgetURL(link("home"))
    }
    .configurationDisplayName("Your day, in light")
    .description("Your Glow score, mood, sleep, stress and what’s next.")
    .supportedFamilies([.systemLarge, .systemMedium])
  }
}

struct DayView: View {
  @Environment(\.widgetFamily) var family
  let snap: GlowSnapshot
  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text(snap.label("dayEyebrow", "YOUR DAY, IN LIGHT")).font(Glow.font(11, semibold: true)).foregroundStyle(Glow.lavender)
      HStack(alignment: .bottom) {
        VStack(alignment: .leading, spacing: 2) {
          Text(snap.score.map(String.init) ?? "–").font(Glow.font(family == .systemLarge ? 56 : 40)).foregroundStyle(Glow.ink)
          Text("\(snap.label("glowScore", "Glow score")) · \(snap.label("trend.\(snap.scoreTrend ?? "stable")", snap.scoreTrend ?? "stable"))")
            .font(Glow.font(13)).foregroundStyle(Glow.plumDeep)
        }
        Spacer()
        Sparkline(values: snap.scoreSeries ?? []).stroke(Glow.plum, lineWidth: 1.5).frame(width: 92, height: 30)
      }
      if family == .systemLarge {
        HStack(spacing: 8) {
          Tile(symbol: "heart", value: snap.mood ?? "–", label: snap.label("mood", "Mood"), tint: Glow.rose)
          Tile(symbol: "moon", value: snap.sleep ?? "–", label: snap.label("sleep", "Sleep"), tint: Glow.lavenderSoft)
          Tile(symbol: "waveform.path.ecg", value: snap.stress ?? "–", label: snap.label("stress", "Stress"), tint: Glow.sky)
        }
        Spacer(minLength: 0)
        Link(destination: URL(string: snap.nextPracticeURL ?? "innerglow://mindful")!) {
          HStack {
            VStack(alignment: .leading, spacing: 2) {
              Text(snap.label("nextForYou", "NEXT FOR YOU")).font(Glow.font(10, semibold: true)).foregroundStyle(.white.opacity(0.75))
              Text(snap.nextPractice ?? snap.label("nextFallback", "A calm minute")).font(Glow.font(15, semibold: true)).foregroundStyle(.white)
            }
            Spacer()
            Image(systemName: "play.fill").font(.system(size: 13)).foregroundStyle(Glow.plum)
              .frame(width: 38, height: 38).background(Circle().fill(.white))
          }
          .padding(14)
          .background(RoundedRectangle(cornerRadius: 20).fill(LinearGradient(colors: [Glow.plum, Glow.plum.opacity(0.8), Glow.mustard.opacity(0.55)], startPoint: .leading, endPoint: .trailing)))
        }
      }
    }
  }
}

struct Tile: View {
  let symbol: String
  let value: String
  let label: String
  let tint: Color
  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Image(systemName: symbol).font(.system(size: 12)).foregroundStyle(Glow.plum)
      Text(value).font(Glow.font(14, semibold: true)).foregroundStyle(Glow.ink).lineLimit(1).minimumScaleFactor(0.7)
      Text(label).font(Glow.font(11)).foregroundStyle(Glow.muted)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(10)
    .background(ZStack { RoundedRectangle(cornerRadius: 16).fill(.white.opacity(0.8)); GlowLight(color: tint.opacity(0.5), size: 50).offset(x: 24, y: 14) }.clipShape(RoundedRectangle(cornerRadius: 16)))
  }
}

struct Sparkline: Shape {
  let values: [Int]
  func path(in rect: CGRect) -> Path {
    var p = Path()
    guard values.count > 1, let lo = values.min(), let hi = values.max() else { return p }
    let span = CGFloat(max(hi - lo, 1))
    for (i, v) in values.enumerated() {
      let pt = CGPoint(x: rect.width * CGFloat(i) / CGFloat(values.count - 1), y: rect.height * (1 - CGFloat(v - lo) / span))
      i == 0 ? p.move(to: pt) : p.addLine(to: pt)
    }
    return p
  }
}

/// Streak (`6848:8298`): the dark tile with the constellation and "N days of showing up".
struct StreakWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "streak", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading) {
        HStack(spacing: 14) {
          ForEach(0..<5, id: \.self) { i in Circle().fill(Glow.mustard).frame(width: i == 4 ? 9 : 6, height: i == 4 ? 9 : 6).offset(y: i % 2 == 0 ? 0 : 8) }
        }
        Spacer()
        Text("\(entry.snap.streak ?? 0)").font(Glow.font(46)).foregroundStyle(.white)
        Text(entry.snap.label("streakLine", "days of showing up")).font(Glow.font(12)).foregroundStyle(.white.opacity(0.85))
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(for: .widget) { ZStack { Glow.night; GlowLight(color: Glow.plum, size: 140).offset(x: 40, y: 20) } }
      .widgetURL(link("profile/streak"))
    }
    .configurationDisplayName("Streak")
    .description("How many days you’ve shown up for yourself.")
    .supportedFamilies([.systemSmall])
  }
}

/// Breathe in (`6848:8298`): a one-minute reset that opens breathing.
struct BreatheWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "breathe", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading) {
        ZStack {
          Circle().stroke(Glow.plum.opacity(0.3), lineWidth: 1).frame(width: 84)
          Circle().stroke(Glow.plum.opacity(0.5), lineWidth: 1).frame(width: 60)
          GlowLight(color: Glow.mustard, size: 34)
        }
        .frame(maxWidth: .infinity)
        Spacer()
        Text(entry.snap.label("breatheIn", "Breathe in")).font(Glow.font(15, semibold: true)).foregroundStyle(Glow.ink)
        Text(entry.snap.label("oneMinute", "1-min reset")).font(Glow.font(11)).foregroundStyle(Glow.muted)
      }
      .containerBackground(for: .widget) { Color.white }
      .widgetURL(link("mindful"))
    }
    .configurationDisplayName("Breathe")
    .description("A one-minute breathing reset.")
    .supportedFamilies([.systemSmall])
  }
}

/// Evening check-in (`6848:8409`): "How are you feeling?" with the mood bar; opens the check-in.
struct CheckInWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "checkin", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading, spacing: 10) {
        HStack {
          Text(entry.snap.label("checkInEyebrow", "CHECK-IN")).font(Glow.font(11, semibold: true)).foregroundStyle(Glow.lavender)
          Spacer()
          if let mood = entry.snap.mood {
            Text("✦ \(mood)").font(Glow.font(12, semibold: true)).foregroundStyle(Glow.plum)
              .padding(.horizontal, 10).padding(.vertical, 4).background(Capsule().fill(Glow.lavenderSoft.opacity(0.35)))
          }
        }
        Text(entry.snap.label("howFeeling", "How are you feeling?")).font(Glow.font(18, semibold: true)).foregroundStyle(Glow.ink)
        Capsule().fill(LinearGradient(colors: [Glow.rose, Glow.lavenderSoft, Glow.mustard, Glow.sky], startPoint: .leading, endPoint: .trailing)).frame(height: 8)
        HStack { Text(entry.snap.label("tense", "Tense")); Spacer(); Text(entry.snap.label("great", "Great")) }
          .font(Glow.font(11)).foregroundStyle(Glow.muted)
      }
      .containerBackground(for: .widget) { ZStack { Color.white; GlowLight(color: Glow.rose.opacity(0.4), size: 160).offset(x: 120, y: -10) } }
      .widgetURL(link("mood/check-in"))
    }
    .configurationDisplayName("Check-in")
    .description("Log how you feel in a tap.")
    .supportedFamilies([.systemMedium])
  }
}

/// Glow AI (`6848:8409`): today's prompt and the mic, which opens a talk.
struct AskGlowWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "askglow", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading, spacing: 8) {
        HStack(spacing: 8) { GlowLight(color: Glow.mustard, size: 18); Text("Glow AI").font(Glow.font(14, semibold: true)).foregroundStyle(.white) }
        Text("“\(entry.snap.glowPrompt ?? entry.snap.label("promptFallback", "What’s on your mind today?"))”")
          .font(Glow.font(16, semibold: true)).foregroundStyle(.white).lineLimit(3)
        Spacer(minLength: 0)
        HStack {
          Text(entry.snap.label("talkItThrough", "Tap to talk it through")).font(Glow.font(11)).foregroundStyle(.white.opacity(0.75))
          Spacer()
          Image(systemName: "mic").font(.system(size: 15)).foregroundStyle(Glow.plum).frame(width: 36, height: 36).background(Circle().fill(.white))
        }
      }
      .containerBackground(for: .widget) { LinearGradient(colors: [Glow.plum, Glow.plum.opacity(0.85), Glow.mustard.opacity(0.5)], startPoint: .topLeading, endPoint: .bottomTrailing) }
      .widgetURL(link("chat"))
    }
    .configurationDisplayName("Glow AI")
    .description("A gentle prompt to talk something through.")
    .supportedFamilies([.systemMedium])
  }
}

/// Score trend (`6848:8409`): the score and its change this week.
struct ScoreWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "score", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.snap.score.map(String.init) ?? "–").font(Glow.font(44)).foregroundStyle(Glow.ink)
        if let d = entry.snap.scoreWeekDelta {
          Text("\(d >= 0 ? "+" : "")\(d) \(entry.snap.label("thisWeek", "this week"))").font(Glow.font(13, semibold: true)).foregroundStyle(Glow.plum)
        }
        Spacer()
        Text(entry.snap.label("glowScore", "Glow score")).font(Glow.font(11)).foregroundStyle(Glow.muted)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(for: .widget) { ZStack { Color.white; GlowLight(color: Glow.mustard.opacity(0.6), size: 120).offset(x: 30, y: 10) } }
      .widgetURL(link("freud-score"))
    }
    .configurationDisplayName("Glow score")
    .description("Your score and how it moved this week.")
    .supportedFamilies([.systemSmall])
  }
}

/// Last night (`6848:8409`): sleep length and the week's bars.
struct SleepWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "sleep", provider: SnapshotProvider()) { entry in
      VStack(alignment: .leading) {
        HStack(alignment: .bottom) {
          Image(systemName: "moon").foregroundStyle(Glow.mustard)
          Spacer()
          Bars(values: entry.snap.sleepBars ?? [], height: 36)
        }
        Spacer()
        Text(entry.snap.sleep ?? "–").font(Glow.font(24, semibold: true)).foregroundStyle(.white)
        Text(entry.snap.label("lastNight", "Last night") + (entry.snap.sleepNote.map { " · \($0)" } ?? ""))
          .font(Glow.font(11)).foregroundStyle(.white.opacity(0.75))
      }
      .containerBackground(for: .widget) { LinearGradient(colors: [Glow.night, Glow.plumDeep], startPoint: .bottom, endPoint: .top) }
      .widgetURL(link("sleep"))
    }
    .configurationDisplayName("Sleep")
    .description("Last night’s sleep and your week.")
    .supportedFamilies([.systemSmall])
  }
}

struct Bars: View {
  let values: [Double]
  let height: CGFloat
  var body: some View {
    HStack(alignment: .bottom, spacing: 3) {
      ForEach(Array(values.suffix(7).enumerated()), id: \.offset) { i, v in
        RoundedRectangle(cornerRadius: 2)
          .fill(i == values.suffix(7).count - 1 ? Glow.mustard : Color.white.opacity(0.5))
          .frame(width: 5, height: max(4, height * v))
      }
    }
  }
}
