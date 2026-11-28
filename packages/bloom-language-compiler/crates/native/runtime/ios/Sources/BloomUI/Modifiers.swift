// The universal modifiers (`spec/language.json` `universal`), as `.bloom<Name>` on any view:
// the Swift backend writes `.padding(.horizontal, .lg)` as `.bloomPadding(.horizontal, .lg)`,
// out of SwiftUI's own overloads (docs/native-runtime-api.mdx, "Modifiers"). The inherited
// ones (`foreground`, `font`, `weight`, `lines`) are environment values the nodes read; the
// layout ones are layout values Bloom's stacks read (Layout/FlexLayout.swift).
#if canImport(SwiftUI)
import SwiftUI

// ---- inherited: what a subtree's text and glyphs draw with ---------------------------

/// The text and glyph style a subtree inherits.
public struct BloomInk: Sendable, Equatable {
  public var font: Tokens.Font? = nil
  public var weight: Tokens.Weight? = nil
  public var foreground: BloomColor? = nil
  public var opacity: Double? = nil
  public init() {}
}

struct InkKey: EnvironmentKey {
  static let defaultValue = BloomInk()
}

extension EnvironmentValues {
  public var bloomInk: BloomInk {
    get { self[InkKey.self] }
    set { self[InkKey.self] = newValue }
  }
}

extension Tokens.Weight {
  var number: Int {
    switch self {
    case .light: 300
    case .regular: 400
    case .medium: 500
    case .semibold: 600
    case .bold: 700
    case .extrabold: 800
    }
  }
}

extension View {
  public func bloomFont(_ font: Tokens.Font) -> some View {
    transformEnvironment(\.bloomInk) { $0.font = font }
  }

  public func bloomWeight(_ weight: Tokens.Weight) -> some View {
    transformEnvironment(\.bloomInk) { $0.weight = weight }
  }

  /// The ink of the subtree's text and glyphs: a colour role (`.foregroundStyle(.muted)`),
  /// at an opacity (`.primary.opacity(0.5)`).
  public func bloomForeground(_ color: BloomColor) -> some View {
    transformEnvironment(\.bloomInk) { $0.foreground = color }
  }

  /// `.label("Likes")`: what VoiceOver reads.
  public func bloomLabel(_ text: String) -> some View { accessibilityLabel(text) }

  /// `.controlSize(.sm)`: the size the subtree's controls take.
  public func bloomControlSize(_ size: Tokens.ControlSize) -> some View {
    environment(\.bloomControlSize, size)
  }

  /// `.disabled(true)`.
  public func bloomDisabled(_ disabled: Bool = true) -> some View {
    self.disabled(disabled)
  }
}

// ---- layout -------------------------------------------------------------------------

extension Tokens.Padding {
  var points: CGFloat {
    if let space = Tokens.Space(rawValue: rawValue) { return CGFloat(space.value) }
    return 0
  }
}

extension Tokens.Edge {
  var set: SwiftUI.Edge.Set {
    switch self {
    case .all: .all
    case .horizontal: .horizontal
    case .vertical: .vertical
    case .top: .top
    case .bottom: .bottom
    case .leading, .left: .leading
    case .trailing, .right: .trailing
    }
  }
}

extension View {
  /// `.padding(.lg)`, `.padding(.horizontal, .lg)`.
  public func bloomPadding(_ edge: Tokens.Edge = .all, _ space: Tokens.Padding) -> some View {
    padding(edge.set, space.points)
  }

  public func bloomPadding(_ space: Tokens.Padding) -> some View { padding(.all, space.points) }

  /// `.padding(12)`: points.
  public func bloomPadding(_ edge: Tokens.Edge = .all, _ points: Double) -> some View {
    padding(edge.set, CGFloat(points))
  }

  /// `.grow()`: `flex: 1` in a Bloom stack (grow 1, shrink 1, basis 0).
  public func bloomGrow() -> some View {
    transformFlex { $0.grow = 1; $0.shrink = 1; $0.zeroBasis = true }
  }

  /// `.shrink(.normal)`: `flexShrink`.
  public func bloomShrink(_ shrink: Tokens.Shrink = .normal) -> some View {
    transformFlex { $0.shrink = shrink.value }
  }

  /// `.frame(width: .full)`, `.frame(width: .lg)`, `.frame(height: …)`.
  public func bloomFrame(width: Tokens.Length? = nil, height: Tokens.Length? = nil) -> some View {
    FrameHost(width: width, height: height, content: self)
  }

  /// `.frame(width: 120)`: points.
  public func bloomFrame(width: Double? = nil, height: Double? = nil) -> some View {
    frame(width: width.map { CGFloat($0) }, height: height.map { CGFloat($0) })
  }

  /// `.aspectRatio(r)`: the height is the width over `r` (React Native's `aspectRatio`).
  public func bloomAspectRatio(_ ratio: Double) -> some View {
    BloomAspectRatioLayout(ratio: ratio) { self }
  }

  /// `.corner(.lg)`: a radius, circular as React Native draws it (`.cornerCurve(.smooth)`
  /// is continuous).
  public func bloomCorner(_ corner: Tokens.Corner) -> some View {
    clipShape(RoundedRectangle(cornerRadius: CGFloat(corner.value ?? 0), style: .circular))
  }

  public func bloomOpacity(_ opacity: Double) -> some View { self.opacity(opacity) }

  public func bloomOpacity(_ opacity: Tokens.Opacity) -> some View { self.opacity(opacity.value) }

  /// `.background(.card)`: a colour role behind the view.
  public func bloomBackground(_ color: BloomColor) -> some View {
    modifier(RoleBackground(color: color))
  }

  /// `.onPress { … }` on a view that is not a control: a plain press (no paint, no haptic).
  public func bloomOnPress(_ action: @escaping @MainActor () -> Void) -> some View {
    bloomPress(.flat, in: Rectangle(), action: action)
  }

  func transformFlex(_ change: (inout BloomFlex) -> Void) -> some View {
    var flex = BloomFlex()
    change(&flex)
    return FlexHost(flex: flex, content: self)
  }
}

/// Merges a child's flex factors (`.grow().shrink(.normal)`), outermost wins per field.
struct FlexHost<Content: View>: View {
  let flex: BloomFlex
  let content: Content
  var body: some View {
    content.layoutValue(key: BloomFlexKey.self, value: flex)
  }
}

struct FrameHost<Content: View>: View {
  let width: Tokens.Length?
  let height: Tokens.Length?
  let content: Content

  var body: some View {
    var flex = BloomFlex()
    flex.fullWidth = width == .full
    flex.fullHeight = height == .full
    return content
      .frame(
        width: points(width), height: points(height))
      .frame(
        maxWidth: width == .full ? .infinity : nil,
        maxHeight: height == .full ? .infinity : nil)
      .layoutValue(key: BloomFlexKey.self, value: flex)
  }

  private func points(_ l: Tokens.Length?) -> CGFloat? {
    guard let l, let space = Tokens.Space(rawValue: l.rawValue) else { return nil }
    return CGFloat(space.value)
  }
}

struct RoleBackground: ViewModifier {
  let color: BloomColor
  @Environment(\.bloomPalette) private var palette
  func body(content: Content) -> some View {
    content.background(palette.color(color))
  }
}

struct ControlSizeKey: EnvironmentKey {
  static let defaultValue: Tokens.ControlSize = .md
}

struct ButtonStyleKey: EnvironmentKey {
  static let defaultValue: Tokens.ButtonStyle = .solid
}

extension EnvironmentValues {
  /// Bloom's built-in `\.controlSize` (SwiftUI's own is another type).
  public var bloomControlSize: Tokens.ControlSize {
    get { self[ControlSizeKey.self] }
    set { self[ControlSizeKey.self] = newValue }
  }

  /// Bloom's built-in `\.buttonStyle`.
  public var bloomButtonStyle: Tokens.ButtonStyle {
    get { self[ButtonStyleKey.self] }
    set { self[ButtonStyleKey.self] = newValue }
  }

  /// Bloom's built-in `\.disabled`.
  public var bloomDisabled: Bool { !isEnabled }
}

/// React Native's `aspectRatio`: given a width, the height is `width / ratio`; given only a
/// height, the width is `height × ratio`; given neither, nothing (0 × 0, as an unsized
/// image is in React Native).
public struct BloomAspectRatioLayout: Layout {
  public let ratio: Double

  public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let r = CGFloat(ratio > 0 ? ratio : 1)
    if let w = proposal.width, w.isFinite { return CGSize(width: w, height: w / r) }
    if let h = proposal.height, h.isFinite { return CGSize(width: h * r, height: h) }
    return .zero
  }

  public func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    for child in subviews {
      child.place(at: CGPoint(x: bounds.minX, y: bounds.minY), anchor: .topLeading, proposal: ProposedViewSize(bounds.size))
    }
  }
}
#endif
