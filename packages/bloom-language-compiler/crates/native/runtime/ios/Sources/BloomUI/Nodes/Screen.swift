// A screen and its chrome: `struct Feeds: Screen` and the modifiers that set its header
// (`.title`, `.subtitle`, `.header(false)`). On iOS the header is the system's navigation bar,
// Liquid Glass on iOS 26, so a screen's title and visibility are SwiftUI's own preferences,
// read by the `NavigationStack` the screen is in; Bloom's scrim over it is `BloomHeaderScrim`
// (Material/HeaderScrim.swift). A modifier applied to the screen's root (`.modifier(Gate())`)
// that draws something else in its place drops the content's title, as on every backend.
#if canImport(SwiftUI)
import SwiftUI

/// A route's root view (Bloom's `Screen`): a `View` whose chrome the navigation draws.
@MainActor @preconcurrency
public protocol Screen: View {}

extension View {
  /// The screen's title in its header.
  public func bloomTitle(_ text: String) -> some View {
    navigationTitle(text)
  }

  /// Whether the screen's header is drawn (`.header(false)`: none, the content runs to the top).
  public func bloomHeader(_ visible: Bool) -> some View {
    toolbar(visible ? .automatic : .hidden, for: .navigationBar)
  }

  /// The view's identifier for UI tests (XCUITest's `accessibilityIdentifier`, React Native's
  /// `testID`).
  public func bloomTestID(_ id: String) -> some View {
    accessibilityIdentifier(id)
  }
}
#endif
