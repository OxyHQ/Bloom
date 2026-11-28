// The theme BloomUI paints from: Bloom's resolved theme (BloomTheme, generated from the TS
// source and its engine, byte-identical to the TS goldens), read through the environment.
// No colour is written here: a node names a role (`Tokens.Color.muted`), the role names its
// theme key (generated from the spec's `colors`), and the theme answers.
#if canImport(SwiftUI)
import SwiftUI

/// An sRGB colour, as the theme resolves it.
public struct BloomRGBA: Sendable, Hashable {
  public var red: Double, green: Double, blue: Double, alpha: Double
  public init(red: Double, green: Double, blue: Double, alpha: Double = 1) {
    self.red = red; self.green = green; self.blue = blue; self.alpha = alpha
  }
  public var color: SwiftUI.Color { SwiftUI.Color(red: red, green: green, blue: blue, opacity: alpha) }

  /// `a` mixed toward `b` by `amount` (0…1), as `mix()` in the TS paint does.
  public func mixed(with b: BloomRGBA, _ amount: Double) -> BloomRGBA {
    BloomRGBA(
      red: red + (b.red - red) * amount, green: green + (b.green - green) * amount,
      blue: blue + (b.blue - blue) * amount, alpha: alpha + (b.alpha - alpha) * amount)
  }
}

/// The colours of the theme in effect, by `ThemeColors` key (`text`, `textSecondary`,
/// `primary`…), with its scheme. BloomTheme's resolved theme is adapted to this in one place
/// (`BloomPalette.init(theme:)`, where BloomTheme lands); until then an unresolved key draws
/// magenta, visibly, rather than a colour copied by hand.
public struct BloomPalette: Sendable {
  public var scheme: SwiftUI.ColorScheme
  private let lookup: @Sendable (String) -> BloomRGBA?

  public init(scheme: SwiftUI.ColorScheme, lookup: @escaping @Sendable (String) -> BloomRGBA?) {
    self.scheme = scheme
    self.lookup = lookup
  }

  public static let unresolved = BloomPalette(scheme: .light) { _ in nil }

  /// The theme colour `key`.
  public func rgba(_ key: String) -> BloomRGBA {
    lookup(key) ?? BloomRGBA(red: 1, green: 0, blue: 1)
  }

  /// A role's colour (`Tokens.Color.muted` is `textSecondary`).
  public func rgba(_ role: Tokens.Color) -> BloomRGBA { rgba(role.themeKey ?? "text") }

  public func color(_ c: BloomColor) -> SwiftUI.Color {
    var v = rgba(c.role)
    if let o = c.opacity { v.alpha *= o }
    return v.color
  }
  public func color(_ key: String) -> SwiftUI.Color { rgba(key).color }
}

struct PaletteKey: EnvironmentKey {
  static let defaultValue = BloomPalette.unresolved
}

extension EnvironmentValues {
  /// The theme in effect (`BloomThemeProvider` and `ColorScope` set it).
  public var bloomPalette: BloomPalette {
    get { self[PaletteKey.self] }
    set { self[PaletteKey.self] = newValue }
  }
}
#endif
