// `ActionBar` and `Action`: a post's engagement bar, as src/engagement-bar draws it today: a
// row with no gap that bleeds 6 pt each side; each action a pill (padding 6 × 2) of a glyph and
// its count 4 pt apart; at rest `textSecondary`, active the tone's `<tone>SubtleForeground`
// (count at 600); pressed, the tone's `<tone>Subtle` behind it; a light impact on press;
// counts compact past 999 (`1.2K`), 0 hidden; a hit area 8 pt wider each side.
#if canImport(SwiftUI)
import SwiftUI
import Foundation

public struct ActionBar<Content: View>: View {
  let content: Content
  public init(@ViewBuilder content: () -> Content) { self.content = content() }

  public var body: some View {
    BloomFlexLayout(axis: .horizontal, gap: 0, align: .center) { content }
      .padding(.horizontal, -6)
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

  public init(_ glyph: Glyph, _ label: String, _ value: Int? = nil) {
    self.glyph = glyph
    self.label = label
    self.number = value
  }

  public var body: some View {
    let ink = isActive ? palette.color("\(tone.rawValue)SubtleForeground") : palette.color(.muted)
    let content = SwiftUI.HStack(spacing: 4) {
      Icon(glyph).size(.md)
      if let number, number != 0 {
        SwiftUI.Text(verbatim: Self.compact(number))
          .font(.custom("Inter", size: 13).weight(isActive ? .semibold : .regular).monospacedDigit())
      }
    }
    .foregroundStyle(ink)
    .transformEnvironment(\.bloomInk) { $0.foreground = isActive ? nil : BloomColor(.muted) }
    .padding(.horizontal, 6)
    .padding(.vertical, 2)
    return content
      .bloomPress(.flat, in: Capsule(), haptic: .tap, pressedFill: "\(tone.rawValue)Subtle") { press?() }
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
#endif
