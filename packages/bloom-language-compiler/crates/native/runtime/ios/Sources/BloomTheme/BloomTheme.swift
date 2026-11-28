// Bloom's theming on Foundation (ADR 0003): the colour engine, roles, presets, the policy, scopes,
// the ambient accent and persistence, ported from src/theme and proven byte-identical against
// its goldens. Data is generated (Generated/, `bun run generate:swift-theme`); the engine is
// ported (Engine/, Policy/); the provider's state is modelled (Model/). BloomUI bridges it to
// SwiftUI. See docs/native-runtime-api.mdx, "Theme".
import Foundation

extension BloomTheme {
  /// A preset's theme for a scheme: `buildTheme(preset, mode, false, accents)`. `contrast` is
  /// accepted for the provider's sake and, as in the TypeScript, changes no colour (it reduces
  /// transparency and edges materials, which BloomUI reads from the selection).
  public static func resolve(
    preset: AppColorName, mode: ColorMode, contrast: Contrast = .standard, accents: ExplicitAccents? = nil
  ) -> BloomTheme {
    buildTheme(preset, mode, accents: accents)
  }

  /// Any seed's theme: `buildThemeFromSeed(seed, mode, variant, contrastLevel, accents)`.
  /// `contrastLevel` is Material's −1 (low) … 0 … 1 (high).
  public static func fromSeed(
    _ seed: String, mode: ColorMode, variant: SchemeVariant? = nil, contrastLevel: Double? = nil,
    accents: SeedAccents? = nil
  ) -> BloomTheme {
    buildThemeFromSeed(seed, mode, variant: variant, contrastLevel: contrastLevel, accents: accents)
  }

  /// The ambient accent's theme: an image's ranked seeds, the first as the seed and the next
  /// two pinned as the accents (what `seedsFromImagePixels` documents for artwork).
  public static func fromImage(
    rgbBytes: [UInt8], channels: Int = 3, mode: ColorMode
  ) -> (theme: BloomTheme, ambient: AmbientThemeState) {
    let seeds = seedsFromRgbBytes(rgbBytes, channels: channels).map(hexFromArgb)
    let ambient = AmbientThemeState(
      seed: seeds.first, secondary: seeds.count > 1 ? seeds[1] : nil, tertiary: seeds.count > 2 ? seeds[2] : nil)
    let theme = fromSeed(
      ambient.seed!, mode: mode,
      accents: SeedAccents(secondarySeed: ambient.secondary, tertiarySeed: ambient.tertiary))
    return (theme, ambient)
  }

  /// `resolveLabelColors(theme)`.
  public var labelColors: LabelColors { resolveLabelColors(colors) }

  /// `resolveThemeChartColors(theme)`.
  public var resolvedChartColors: [ThemeChartColor] { resolveThemeChartColors(self) }

  /// `resolveAccentColors(theme.colors, tone, fill)`.
  public func accentColors(_ tone: AccentTone, _ fill: AccentFill) -> AccentColors {
    resolveAccentColors(colors, tone: tone, fill: fill)
  }

  /// `pressedSurface(theme.colors, surface, layer)`.
  public func pressed(surface: String, layer: String) -> String {
    pressedSurface(colors, surface: surface, layer: layer)
  }
}
