// `ActionBar` and `Action`: a post's engagement bar, as src/engagement-bar draws it today: a
// row with no gap that bleeds 6 pt each side; each action a pill (padding 6 × 2) of a glyph and
// its count 4 pt apart; at rest `textSecondary`, active the tone's `<tone>SubtleForeground`
// (count at 600); pressed, the tone's `<tone>Subtle` behind it; a light impact on press;
// counts compact past 999 (`1.2K`), 0 hidden; a hit area 8 pt wider each side.
#if canImport(SwiftUI)
import SwiftUI
import Foundation

public struct ActionBar<Content: View, Trailing: View>: View {
  let content: Content
  let end: Trailing
  var format: ((Int) -> String)? = nil

  public init(@ViewBuilder content: () -> Content) where Trailing == EmptyView {
    self.content = content()
    self.end = EmptyView()
  }

  init(content: Content, end: Trailing, format: ((Int) -> String)?) {
    self.content = content
    self.end = end
    self.format = format
  }

  /// `.trailing { Action(.bookmark, "Save") }`: actions at the bar's far end (the save).
  public func trailing<T: View>(@ViewBuilder _ end: () -> T) -> ActionBar<Content, T> {
    ActionBar<Content, T>(content: content, end: end(), format: format)
  }

  /// `.countFormat(compactCount)`: how the bar's actions write their counts (the app's own).
  public func countFormat(_ format: @escaping (Int) -> String) -> Self { var b = self; b.format = format; return b }

  public var body: some View {
    BloomFlexLayout(axis: .horizontal, gap: 0, align: .center) {
      content
      Spacer(minLength: 0)
      end
    }
    .padding(.horizontal, -6)
    .environment(\.bloomCountFormat, format)
  }
}

struct CountFormatKey: EnvironmentKey {
  static var defaultValue: ((Int) -> String)? { nil }
}

extension EnvironmentValues {
  /// How an `Action` writes its count (`ActionBar.countFormat`); none: compact past 999.
  public var bloomCountFormat: ((Int) -> String)? {
    get { self[CountFormatKey.self] }
    set { self[CountFormatKey.self] = newValue }
  }
}

public struct Action: View {
  let glyph: Glyph
  let label: String
  var number: Int? = nil
  var isActive = false
  var tone: Tokens.EngagementTone = .primary
  var press: (@MainActor () -> Void)? = nil
  @Environment(\.bloomPalette) private var palette
  @Environment(\.bloomCountFormat) private var format
  /// The pop's progress (1 at rest): it plays when a press turns the action on.
  @State private var pop = 1.0
  @State private var pressedOn = false

  public init(_ glyph: Glyph, _ label: String, _ value: Int? = nil) {
    self.glyph = glyph
    self.label = label
    self.number = value
  }

  public var body: some View {
    let ink = isActive ? palette.color("\(tone.rawValue)SubtleForeground") : palette.color(.muted)
    let content = SwiftUI.HStack(spacing: 4) {
      Icon(glyph).size(.md)
        .modifier(PopEffect(t: pop, ring: ink))
      if let number, number != 0 {
        // The count rolls as it changes (the new value in, the old one out: motion's `roll`).
        SwiftUI.Text(verbatim: format?(number) ?? Self.compact(number))
          .font(.custom("Inter", size: 13).weight(isActive ? .semibold : .regular).monospacedDigit())
          .contentTransition(.numericText(value: Double(number)))
          .animation(.timingCurve(0.16, 1, 0.3, 1, duration: 0.4), value: number)
      }
    }
    .foregroundStyle(ink)
    .transformEnvironment(\.bloomInk) { $0.foreground = isActive ? nil : BloomColor(.muted) }
    .padding(.horizontal, 6)
    .padding(.vertical, 2)
    return content
      .bloomPress(.flat, in: Capsule(), haptic: .tap, pressedFill: "\(tone.rawValue)Subtle") {
        pressedOn = !isActive
        press?()
      }
      .onChange(of: isActive) { _, on in
        // The pop: a press that turned it on (not props arriving on).
        if on && pressedOn {
          var t = Transaction()
          t.disablesAnimations = true
          withTransaction(t) { pop = 0 }
          withAnimation(.timingCurve(0.16, 1, 0.3, 1, duration: 0.3)) { pop = 1 }
        }
        pressedOn = false
      }
      .contentShape(Rectangle().inset(by: -8))
      .accessibilityLabel(label)
      .accessibilityAddTraits(isActive ? [.isButton, .isSelected] : .isButton)
  }

  /// Below 1000 as an integer; above, compact with at most one decimal (`formatCompactNumber`).
  static func compact(_ n: Int) -> String {
    if abs(n) < 1000 { return String(n) }
    return n.formatted(.number.notation(.compactName).precision(.fractionLength(0...1)).locale(Locale(identifier: "en_US")))
  }

  public func count(_ n: Int) -> Action { var a = self; a.number = n; return a }
  public func active(_ on: Bool) -> Action { var a = self; a.isActive = on; return a }
  public func tint(_ tone: Tokens.EngagementTone) -> Action { var a = self; a.tone = tone; return a }
  /// `.onPress { … }` on an action: its press, with its paint and haptic.
  public func bloomOnPress(_ action: @escaping @MainActor () -> Void) -> Action { var a = self; a.press = action; return a }
}
/// The engagement pop at `t` (0…1, `outExpo` over 300 ms): the glyph dips to 0.7 by 1/10,
/// swells to 1.2 by 4/10 and settles, as a ring bursts from 0.4 to 1.6 of it, fading.
struct PopEffect: ViewModifier, Animatable {
  var t: Double
  let ring: SwiftUI.Color

  var animatableData: Double {
    get { t }
    set { t = newValue }
  }

  static func scale(_ t: Double) -> Double {
    if t < 0.1 {
      let u = t / 0.1
      let eased = u < 0.5 ? 2 * u * u : 1 - pow(-2 * u + 2, 2) / 2
      return 1 - 0.3 * eased
    }
    if t < 0.4 { return 0.7 + 0.5 * ((t - 0.1) / 0.3) }
    return 1.2 - 0.2 * ((t - 0.4) / 0.6)
  }

  func body(content: Content) -> some View {
    content
      .scaleEffect(CGFloat(t < 1 ? Self.scale(t) : 1))
      .background {
        if t < 1 {
          Circle().stroke(ring.opacity(0.6 * (1 - t)), lineWidth: 2).scaleEffect(CGFloat(0.4 + 1.2 * t))
        }
      }
  }
}
#endif
