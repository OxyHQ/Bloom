// Reading the generated preset palettes (Generated/BloomThemeTokens.generated.swift): a preset's
// first frame from constants, which the tests hold equal to what the engine computes.
import Foundation

extension BloomThemeTokens {
  private static func row(_ preset: AppColorName, _ mode: ColorMode) -> Int {
    AppColorName.allCases.firstIndex(of: preset)! * 2 + (mode == .dark ? 1 : 0)
  }

  /// `getResolvedTokens(preset, mode)`, from the constants.
  public static func resolvedTokens(_ preset: AppColorName, _ mode: ColorMode) -> TokenMap {
    let start = row(preset, mode) * tokenNames.count
    var map = TokenMap()
    for (offset, name) in tokenNames.enumerated() { map[name] = tokenValues[start + offset] }
    return map
  }

  /// `buildTheme(preset, mode)`, from the constants.
  public static func theme(_ preset: AppColorName, _ mode: ColorMode) -> BloomTheme {
    let count = ThemeColorField.allCases.count
    let start = row(preset, mode) * count
    let tokens = resolvedTokens(preset, mode)
    return BloomTheme(
      mode: mode, colors: ThemeColors(orderedValues: colorValues[start..<(start + count)]),
      chartColors: chartColorsFromTokens(tokens))
  }

  /// `buildPresetPalette(preset, mode)` (`getPrepaintPalette`), from the constants.
  public static func palette(_ preset: AppColorName, _ mode: ColorMode) -> ScopePalette {
    ScopePalette(theme: theme(preset, mode), vars: withScopeAliases(resolvedTokens(preset, mode)))
  }
}
