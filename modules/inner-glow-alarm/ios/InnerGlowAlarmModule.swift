import ExpoModulesCore
import AlarmKit
import SwiftUI

@available(iOS 26.0, *)
private struct WakeMetadata: AlarmMetadata {}

public class InnerGlowAlarmModule: Module {
  // Stable IDs let a saved schedule replace its alarm, without leaving duplicates.
  private let wakeID = UUID(uuidString: "0934D931-BF2E-4B19-95A7-1D726E4C9001")!
  private let testID = UUID(uuidString: "0934D931-BF2E-4B19-95A7-1D726E4C9002")!

  public func definition() -> ModuleDefinition {
    Name("InnerGlowAlarm")

    Function("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    AsyncFunction("status") { () -> String in
      guard #available(iOS 26.0, *) else { return "unsupported" }
      switch AlarmManager.shared.authorizationState {
      case .authorized: return "authorized"
      case .denied: return "denied"
      default: return "notDetermined"
      }
    }

    AsyncFunction("schedule") { (hour: Int, minute: Int, days: [Int]) -> Void in
      guard #available(iOS 26.0, *) else { throw AlarmFailure("Ringing alarms require iOS 26 or later.") }
      guard (0...23).contains(hour), (0...59).contains(minute), !days.isEmpty,
        days.allSatisfy({ (1...7).contains($0) }) else { throw AlarmFailure("Choose a valid wake time and at least one day.") }
      try await self.authorize()
      let weekdays: [Locale.Weekday] = [.sunday, .monday, .tuesday, .wednesday, .thursday, .friday, .saturday]
      let schedule = Alarm.Schedule.relative(.init(
        time: .init(hour: hour, minute: minute),
        repeats: .weekly(Array(Set(days)).sorted().map { weekdays[$0 - 1] })
      ))
      // Scheduling an existing ID updates that alarm in place.
      _ = try await AlarmManager.shared.schedule(id: self.wakeID, configuration: self.configuration(schedule))
    }

    AsyncFunction("cancel") { () -> Void in
      guard #available(iOS 26.0, *) else { return }
      if try AlarmManager.shared.alarms.contains(where: { $0.id == self.wakeID }) {
        try AlarmManager.shared.cancel(id: self.wakeID)
      }
    }

    AsyncFunction("test") { () -> Void in
      guard #available(iOS 26.0, *) else { throw AlarmFailure("Ringing alarms require iOS 26 or later.") }
      try await self.authorize()
      _ = try await AlarmManager.shared.schedule(id: self.testID,
        configuration: self.configuration(.fixed(Date().addingTimeInterval(15))))
    }
  }

  @available(iOS 26.0, *)
  private func authorize() async throws {
    let state = try await AlarmManager.shared.requestAuthorization()
    guard state == .authorized else { throw AlarmFailure("Alarms are disabled. Allow Inner Glow alarms in iPhone Settings.") }
  }

  @available(iOS 26.0, *)
  private func configuration(_ schedule: Alarm.Schedule) -> AlarmManager.AlarmConfiguration<WakeMetadata> {
    // Alert-only alarms do not need a countdown Live Activity or widget extension.
    let alert = AlarmPresentation.Alert(title: "Time to wake up", stopButton:
      AlarmButton(text: "Stop", textColor: .white, systemImageName: "stop.fill"))
    let attributes = AlarmAttributes(presentation: AlarmPresentation(alert: alert),
      metadata: WakeMetadata(), tintColor: Color(red: 0.32, green: 0.40, blue: 0.32))
    return .alarm(schedule: schedule, attributes: attributes)
  }
}

private struct AlarmFailure: LocalizedError {
  let message: String
  init(_ message: String) { self.message = message }
  var errorDescription: String? { message }
}
