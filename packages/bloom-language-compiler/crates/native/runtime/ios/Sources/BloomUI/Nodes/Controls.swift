// `Toggle`, `Button`, `ProgressView`/`Loading`: Bloom's controls as src/switch, src/button and
// src/loading draw them today on iOS.
#if canImport(SwiftUI)
import SwiftUI

// ---- Toggle ----------------------------------------------------------------------------

/// A switch: track 44 × 26 and thumb 22 (md), inset 2, fully round; on, the accent's solid
/// (`primary` track, `primaryForeground` thumb); off, the lightest mix of `text` over the
/// surface with 3:1 contrast, its thumb the surface (light) or `text` (dark). It moves on React
/// Native's spring (friction 8, tension 60: stiffness 302.6, damping 25) and plays a selection
/// haptic.
public struct Toggle: View {
  @Binding var isOn: Bool
  var title: String? = nil
  var accessibilityTitle: String? = nil
  var side: Tokens.ControlSize = .md
  @Environment(\.bloomPalette) private var palette
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(_ isOn: Binding<Bool>) { self._isOn = isOn }

  /// `Toggle("Likes", isOn: $on)`: the title, then the switch, as a row.
  public init(_ title: String, isOn: Binding<Bool>) {
    self._isOn = isOn
    self.title = title
  }

  struct Metrics { let width: CGFloat, height: CGFloat, thumb: CGFloat }
  var metrics: Metrics {
    switch side {
    case .xs: Metrics(width: 30, height: 18, thumb: 14)
    case .sm: Metrics(width: 36, height: 22, thumb: 18)
    case .md: Metrics(width: 44, height: 26, thumb: 22)
    case .lg: Metrics(width: 52, height: 30, thumb: 26)
    }
  }

  /// React Native's `Animated.spring` from its friction and tension (`fromOrigamiTensionAndFriction`).
  static let spring = Animation.interpolatingSpring(mass: 1, stiffness: (60 - 30) * 3.62 + 194, damping: (8 - 8) * 3 + 25)

  public var body: some View {
    let m = metrics
    let surface = palette.rgba(.card)
    let offTrack = Self.offTrack(text: palette.rgba(.foreground), surface: surface)
    let control = SwiftUI.ZStack(alignment: isOn ? .trailing : .leading) {
      Capsule().fill(isOn ? palette.color(.primary) : offTrack.color)
      Circle()
        .fill(isOn ? palette.color(.onPrimary) : (palette.scheme == .dark ? palette.color(.foreground) : surface.color))
        .frame(width: m.thumb, height: m.thumb)
        .shadow(color: .black.opacity(0.12), radius: 3, x: 0, y: 1)
        .padding(2)
    }
    .frame(width: m.width, height: m.height)
    .animation(reduceMotion ? nil : Self.spring, value: isOn)
    .contentShape(Rectangle().inset(by: -8))
    .onTapGesture { isOn.toggle() }
    .bloomHaptic(.selection, trigger: isOn)
    .accessibilityLabel(title ?? accessibilityTitle ?? "")
    .accessibilityValue(isOn ? "1" : "0")
    .accessibilityAddTraits(.isButton)
    return Group {
      if let title {
        SwiftUI.HStack(spacing: 0) {
          Text(title)
          SwiftUI.Spacer(minLength: 12)
          control
        }
      } else {
        control
      }
    }
  }

  /// `text` mixed over the surface, the least that gives 3:1 against it (paint.ts).
  static func offTrack(text: BloomRGBA, surface: BloomRGBA) -> BloomRGBA {
    var amount = 0.0
    while amount < 1 {
      let mixed = surface.mixed(with: text, amount)
      if contrast(mixed, surface) >= 3 { return mixed }
      amount += 0.01
    }
    return text
  }

  static func luminance(_ c: BloomRGBA) -> Double {
    func lin(_ v: Double) -> Double { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * lin(c.red) + 0.7152 * lin(c.green) + 0.0722 * lin(c.blue)
  }

  static func contrast(_ a: BloomRGBA, _ b: BloomRGBA) -> Double {
    let (la, lb) = (luminance(a), luminance(b))
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
  }

  /// `.label("Likes")`: what VoiceOver reads for a switch drawn without its title.
  public func label(_ text: String) -> Toggle { var t = self; t.accessibilityTitle = text; return t }
  public func size(_ size: Tokens.ControlSize) -> Toggle { var t = self; t.side = size; return t }
}

// ---- Button ------------------------------------------------------------------------------

/// A pill: xs 24 / sm 32 / md 36 / lg 44 tall, padding 8 (12 at lg); `solid` accent by default
/// (`primary` fill, `primaryForeground` label), `subtle` (`primarySubtle` and its foreground),
/// `outline` (the subtle tint, no border), `plain` (transparent, its tint when pressed); `glass`
/// and `glassProminent` on the material at lg. No scale on press: the paint changes.
public struct Button<Label: View>: View {
  let label: Label
  var action: (@MainActor () -> Void)?
  var side: Tokens.ControlSize = .md
  var appearance: Tokens.ButtonStyle = .solid
  var tone: Tokens.Tone? = nil

  public init(action: @escaping @MainActor () -> Void, @ViewBuilder label: () -> Label) {
    self.label = label()
    self.action = action
  }

  public init(@ViewBuilder label: () -> Label) {
    self.label = label()
    self.action = nil
  }

  struct Metrics { let height: CGFloat, padding: CGFloat, labelPadding: CGFloat, font: Tokens.Font, weight: Tokens.Weight }
  var metrics: Metrics {
    switch appearance == .glass || appearance == .glassProminent ? .lg : side {
    case .xs: Metrics(height: 24, padding: 8, labelPadding: 2, font: .caption1, weight: .semibold)
    case .sm: Metrics(height: 32, padding: 8, labelPadding: 2, font: .body, weight: .medium)
    case .md: Metrics(height: 36, padding: 8, labelPadding: 4, font: .body, weight: .medium)
    case .lg: Metrics(height: 44, padding: 12, labelPadding: 4, font: .headline, weight: .medium)
    }
  }

  var material: BloomMaterial {
    switch appearance {
    case .solid: .solid(.primary)
    case .subtle, .outline: .fill(themeKey: "primarySubtle")
    case .plain: .flat
    case .glass: .glass(.regular, interactive: true)
    case .glassProminent: .glassProminent(.primary)
    }
  }

  var ink: Tokens.Color {
    switch appearance {
    case .solid, .glassProminent: .onPrimary
    case .glass: .foreground
    default: .primaryText
    }
  }

  public var body: some View {
    let m = metrics
    return label
      .bloomFont(m.font)
      .bloomWeight(m.weight)
      .bloomForeground(BloomColor(ink))
      .padding(.horizontal, m.padding + m.labelPadding)
      .frame(minHeight: m.height)
      .bloomPress(material, in: Capsule(), pressedFill: appearance == .plain ? "primarySubtle" : nil) { action?() }
  }

  public func size(_ size: Tokens.ControlSize) -> Self { var b = self; b.side = size; return b }
  public func style(_ style: Tokens.ButtonStyle) -> Self { var b = self; b.appearance = style; return b }
  /// `.tint(.danger)`: the button's tone (its fill's role and its label's).
  public func tint(_ tone: Tokens.Tone) -> Self { var b = self; b.tone = tone; return b }
  public func bloomOnPress(_ action: @escaping @MainActor () -> Void) -> Self { var b = self; b.action = action; return b }
}

extension Button {
  /// `Button(Text("Like")).onPress { … }`: a label, then its press.
  public init(_ label: Label) {
    self.label = label
    self.action = nil
  }
}

extension Button where Label == Text {
  /// `Button("Save") { save() }`.
  public init(_ title: String, action: @escaping @MainActor () -> Void) {
    self.label = Text(title)
    self.action = action
  }
}

// ---- Loading -----------------------------------------------------------------------------

/// The spinner: xs 16 / sm 20 / md 24 / lg 44 in `primary`, padded 16; today's Bloom morphs
/// Material 3 shapes (650 ms each, a turn every 5 s); this first pass turns the first shape
/// (softBurst) on the same 5 s, and the morph is a follow-up.
public struct Loading: View {
  var explicitSide: Tokens.ControlSize? = nil
  @Environment(\.bloomControlSize) private var envSide
  var side: Tokens.ControlSize { explicitSide ?? envSide }
  @Environment(\.bloomPalette) private var palette
  @State private var turning = false

  public init() {}

  public var body: some View {
    let d: CGFloat = switch side {
    case .xs: 16
    case .sm: 20
    case .md: 24
    case .lg: 44
    }
    SoftBurst()
      .fill(palette.color(.primary))
      .frame(width: d, height: d)
      .rotationEffect(.degrees(turning ? 360 : 0))
      .animation(.linear(duration: 5).repeatForever(autoreverses: false), value: turning)
      .onAppear { turning = true }
      .padding(16)
      .accessibilityLabel("Loading")
  }

  public func controlSize(_ size: Tokens.ControlSize) -> Loading { var l = self; l.explicitSide = size; return l }
  public func size(_ size: Tokens.ControlSize) -> Loading { controlSize(size) }
}

/// `ProgressView()` is Bloom's `Loading()`.
public typealias ProgressView = Loading

/// A ten-lobed burst (Material 3's softBurst, approximated by a rounded star).
struct SoftBurst: Shape {
  nonisolated func path(in rect: CGRect) -> Path {
    var path = Path()
    let c = CGPoint(x: rect.midX, y: rect.midY)
    let outer = min(rect.width, rect.height) / 2
    let inner = outer * 0.8
    let n = 10
    for i in 0..<(n * 2) {
      let r = i % 2 == 0 ? outer : inner
      let a = Double(i) * .pi / Double(n) - .pi / 2
      let p = CGPoint(x: c.x + r * CGFloat(cos(a)), y: c.y + r * CGFloat(sin(a)))
      if i == 0 { path.move(to: p) } else { path.addLine(to: p) }
    }
    path.closeSubpath()
    return path
  }
}
#endif
