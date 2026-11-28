// Bloom's one material: every glass, blur, tint, rim, shadow, press and haptic of BloomUI is
// drawn here, and nowhere else (docs/native-runtime-api.mdx, "Material"; the owner's rule: a
// glass button and the bottom bar are the same material). A component takes a `BloomMaterial`
// and hands it to `.bloomMaterial(_:in:)` / `BloomSurface` / `.bloomPress(_:action:)`.
//
// | material | iOS 26+ | iOS 17–25 (the spec's `iosFallback`) |
// |---|---|---|
// | `.glass(.regular)` | `glassEffect(.regular)` (interactive for a control) | `systemThinMaterial`, the tint at its opacity, Bloom's rim and sheen |
// | `.glass(.clear)` | `glassEffect(.clear)` | `systemUltraThinMaterial`, … |
// | `.glassProminent(tone)` | `glassEffect(.regular.tint(tone's role))` | the fallback, tinted at 0.8 (a control's fill) |
// | `.solid(fill)` | Bloom's paint: the fill, its press tint, no blur | the same |
// | `.flat` | nothing behind the content | the same |
//
// Bloom's accessibility rule wins over the system's: with reduce transparency or increased
// contrast every glass paints `.solid` with the composited fill and a 3:1 hairline. The
// material's scheme is Bloom's theme, never the window's.
#if canImport(SwiftUI)
import SwiftUI

public enum BloomGlassKind: Sendable, Equatable { case regular, clear }

/// What a surface is made of.
public enum BloomMaterial: Sendable, Equatable {
  /// Liquid Glass: `tint` a colour role at `opacity` (the spec's `glassOpacity`).
  case glass(BloomGlassKind = .regular, tint: Tokens.Color? = nil, opacity: Double? = nil, interactive: Bool = false, dimmed: Bool = false)
  /// Regular glass tinted with a tone's role (`buttonStyle(.glassProminent)`).
  case glassProminent(Tokens.Color = .primary)
  /// Bloom's opaque paint of a role.
  case solid(Tokens.Color)
  /// Bloom's opaque paint of a theme colour that is no role (`primarySubtle`).
  case fill(themeKey: String)
  /// Nothing behind the content.
  case flat
}

/// The spec's glass tokens (`spec/language.json` `glass`, `glassOpacity`): what the fallback
/// paints. Generated values are read from `Tokens`; these name which of them a material uses.
enum MaterialTokens {
  /// A tint's default opacity on glass (`glassOpacity.subtle` … `strong`).
  static func opacity(_ token: Tokens.GlassOpacity) -> Double { token.value }
  /// An opaque fill drawn on a floating surface (`SURFACE_TINT_OPACITY`, src/surface/shared.ts).
  static let floatingTint = 0.72
  /// A solid control on untinted glass (`CONTROL_FILL_OPACITY`, platform/lens-glass.ts).
  static let controlFill = 0.8
  /// The press: fill mixed 8% toward black (`shared.ts:462`), 100 ms `inOutQuad`.
  static let pressMix = 0.08
  static let press = Animation.timingCurve(0.455, 0.03, 0.515, 0.955, duration: 0.1)
  /// The rim and sheen of a floating surface on native (src/surface/shared.ts:52-87).
  static func rimOpacity(_ scheme: SwiftUI.ColorScheme) -> Double { scheme == .dark ? 0.4 : 0.7 }
  static let sheenOpacity = 0.14
}

struct MaterialPaint<S: Shape>: ViewModifier {
  let material: BloomMaterial
  let shape: S
  let pressed: Bool
  @Environment(\.bloomPalette) private var palette
  @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
  @Environment(\.colorSchemeContrast) private var contrast

  func body(content: Content) -> some View {
    content.background { background }
  }

  /// Glass reads as solid under reduce transparency or increased contrast (Bloom's rule).
  private var opaque: Bool { reduceTransparency || contrast == .increased }

  @ViewBuilder private var background: some View {
    switch material {
    case .flat:
      EmptyView()
    case .solid(let role):
      shape.fill(fill(palette.rgba(role)))
    case .fill(let key):
      shape.fill(fill(palette.rgba(key)))
    case .glass, .glassProminent:
      if opaque {
        shape.fill(fill(palette.rgba(.card))).overlay { shape.stroke(palette.color(.border), lineWidth: 1) }
      } else {
        glass
      }
    }
  }

  private func fill(_ base: BloomRGBA) -> SwiftUI.Color {
    return pressed ? base.mixed(with: BloomRGBA(red: 0, green: 0, blue: 0), MaterialTokens.pressMix).color : base.color
  }

  @ViewBuilder private var glass: some View {
    if #available(iOS 26.0, macOS 26.0, *) {
      SwiftUI.Color.clear.glassEffect(systemGlass, in: shape)
    } else {
      fallback
    }
  }

  @available(iOS 26.0, macOS 26.0, *)
  private var systemGlass: Glass {
    switch material {
    case .glass(let kind, let tint, let opacity, let interactive, _):
      var g: Glass = kind == .clear ? .clear : .regular
      if let tint { g = g.tint(palette.color(BloomColor(tint).opacity(opacity ?? MaterialTokens.opacity(.subtle)))) }
      return g.interactive(interactive)
    case .glassProminent(let role):
      return Glass.regular.tint(palette.color(BloomColor(role))).interactive(true)
    default:
      return .regular
    }
  }

  /// Before iOS 26: the system material the spec names, Bloom's tint over it, the rim.
  @ViewBuilder private var fallback: some View {
    let (system, tint, opacity): (Material, Tokens.Color?, Double) = switch material {
    case .glass(let kind, let tint, let opacity, _, _):
      (kind == .clear ? .ultraThinMaterial : .thinMaterial, tint, opacity ?? MaterialTokens.floatingTint)
    case .glassProminent(let role):
      (.thinMaterial, role, MaterialTokens.controlFill)
    default:
      (.thinMaterial, nil, 0)
    }
    shape.fill(system)
      .overlay {
        if let tint { shape.fill(palette.color(BloomColor(tint).opacity(opacity))) }
      }
      .overlay {
        shape.stroke(SwiftUI.Color.white.opacity(MaterialTokens.rimOpacity(palette.scheme)), lineWidth: 1)
      }
      .environment(\.colorScheme, palette.scheme)
  }
}

extension View {
  /// Draws `material` behind the view, in `shape`.
  public func bloomMaterial<S: Shape>(_ material: BloomMaterial, in shape: S) -> some View {
    modifier(MaterialPaint(material: material, shape: shape, pressed: false))
  }
}

/// Bloom's `Surface`: content on a material.
public struct BloomSurface<S: Shape, Content: View>: View {
  let material: BloomMaterial
  let shape: S
  let content: Content

  public init(_ material: BloomMaterial, in shape: S, @ViewBuilder content: () -> Content) {
    self.material = material
    self.shape = shape
    self.content = content()
  }

  public var body: some View {
    content.bloomMaterial(material, in: shape)
  }
}

/// A press on a material: its paint while pressed, its haptic, and the action. Glass presses
/// are the system's interactive glass on iOS 26 (its own bounce and stretch); a solid or flat
/// material's press is Bloom's paint change (no scale: Button.tsx), with `motion.press`.
struct PressStyle<S: Shape>: ButtonStyle {
  let material: BloomMaterial
  let shape: S
  let pressedOpacity: Double?
  /// A theme colour painted in the shape while pressed (an engagement action's tone tint).
  let pressedFill: String?
  @Environment(\.bloomPalette) private var palette

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .modifier(MaterialPaint(material: material, shape: shape, pressed: configuration.isPressed))
      .background {
        if let pressedFill, configuration.isPressed { shape.fill(palette.color(pressedFill)) }
      }
      .opacity(configuration.isPressed ? (pressedOpacity ?? 1) : 1)
      .contentShape(shape)
      .animation(MaterialTokens.press, value: configuration.isPressed)
  }
}

extension View {
  /// The view as a press on `material`: drawn on it, its press paint, `haptic` on each press.
  public func bloomPress<S: Shape>(
    _ material: BloomMaterial, in shape: S, haptic: BloomHaptic? = nil, pressedOpacity: Double? = nil,
    pressedFill: String? = nil, action: @escaping @MainActor () -> Void
  ) -> some View {
    PressHost(material: material, shape: shape, haptic: haptic, pressedOpacity: pressedOpacity, pressedFill: pressedFill, action: action, label: self)
  }
}

struct PressHost<S: Shape, Label: View>: View {
  let material: BloomMaterial
  let shape: S
  let haptic: BloomHaptic?
  let pressedOpacity: Double?
  let pressedFill: String?
  let action: @MainActor () -> Void
  let label: Label
  @State private var presses = 0

  var body: some View {
    SwiftUI.Button(action: {
      presses += 1
      action()
    }) {
      label
    }
    .buttonStyle(PressStyle(material: material, shape: shape, pressedOpacity: pressedOpacity, pressedFill: pressedFill))
    .bloomHaptic(haptic, trigger: presses)
  }
}
#endif
