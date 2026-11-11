import ActivityKit
import ExpoModulesCore

public class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) { return ActivityAuthorizationInfo().areActivitiesEnabled }
      return false
    }

    AsyncFunction("start") { (practice: String, phase: String, count: Int, endsAtMs: Double) -> String? in
      guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else { return nil }
      for activity in Activity<BreathingAttributes>.activities { await activity.end(nil, dismissalPolicy: .immediate) }
      let endsAt = Date(timeIntervalSince1970: endsAtMs / 1000)
      let state = BreathingAttributes.ContentState(phase: phase, count: count, endsAt: endsAt)
      let activity = try Activity.request(
        attributes: BreathingAttributes(practice: practice, startedAt: Date()),
        content: ActivityContent(state: state, staleDate: endsAt)
      )
      return activity.id
    }

    AsyncFunction("update") { (phase: String, count: Int, endsAtMs: Double) in
      guard #available(iOS 16.2, *) else { return }
      let state = BreathingAttributes.ContentState(phase: phase, count: count, endsAt: Date(timeIntervalSince1970: endsAtMs / 1000))
      for activity in Activity<BreathingAttributes>.activities {
        await activity.update(ActivityContent(state: state, staleDate: state.endsAt))
      }
    }

    AsyncFunction("end") { () in
      guard #available(iOS 16.2, *) else { return }
      for activity in Activity<BreathingAttributes>.activities { await activity.end(nil, dismissalPolicy: .immediate) }
    }
  }
}
