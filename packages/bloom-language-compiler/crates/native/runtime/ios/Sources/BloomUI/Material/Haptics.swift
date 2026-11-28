// Bloom's haptic intents (src/hooks/use-haptics.tsx), the only place BloomUI plays one. Each
// intent is what today's Bloom plays on iOS; a component names the intent, never a generator.
#if canImport(SwiftUI)
import SwiftUI

public enum BloomHaptic: Sendable, Equatable {
  /// A light impact (`tap`): an engagement action's press, a tab scrub's step.
  case tap
  /// A medium impact (`confirm`): an engagement action's long press.
  case confirm
  /// Selection feedback (`selection`, `toggle`): a switch, a segmented control, a slider detent.
  case selection
  case success
  case warning
  case error

  var feedback: SensoryFeedback {
    switch self {
    case .tap: .impact(weight: .light)
    case .confirm: .impact(weight: .medium)
    case .selection: .selection
    case .success: .success
    case .warning: .warning
    case .error: .error
    }
  }
}

struct HapticsEnabledKey: EnvironmentKey {
  static let defaultValue = true
}

extension EnvironmentValues {
  /// `BloomHapticsProvider` and the person's preference: off, nothing plays.
  public var bloomHapticsEnabled: Bool {
    get { self[HapticsEnabledKey.self] }
    set { self[HapticsEnabledKey.self] = newValue }
  }
}

struct HapticModifier<T: Equatable>: ViewModifier {
  let haptic: BloomHaptic?
  let trigger: T
  @Environment(\.bloomHapticsEnabled) private var enabled

  func body(content: Content) -> some View {
    if let haptic, enabled {
      content.sensoryFeedback(haptic.feedback, trigger: trigger)
    } else {
      content
    }
  }
}

extension View {
  /// Plays `haptic` each time `trigger` changes.
  public func bloomHaptic<T: Equatable>(_ haptic: BloomHaptic?, trigger: T) -> some View {
    modifier(HapticModifier(haptic: haptic, trigger: trigger))
  }
}
#endif
