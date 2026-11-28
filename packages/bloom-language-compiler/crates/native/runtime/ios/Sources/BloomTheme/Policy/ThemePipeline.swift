// Ports of src/theme/preset-vars.ts, token-registry.ts, color-scope/seed-scope.ts,
// color-scope/style-builder.ts, build-theme.ts, build-theme-from-seed.ts and
// color-scope/resolve-scope.ts: a preset or a seed to its token record and its `Theme`.
import Foundation

/// A resolved scheme (`'light' | 'dark'`).
public enum ColorMode: String, CaseIterable, Codable, Sendable, Hashable {
  case light
  case dark

  public var isDark: Bool { self == .dark }
}

/// `ExplicitAccents`: app-wide accent pins and the surface tint, threaded through the pipeline.
public struct ExplicitAccents: Sendable, Hashable, Codable {
  public var secondaryHex: String?
  public var tertiaryHex: String?
  /// Absent: `tinted`.
  public var surfaces: SurfaceTint?

  public init(secondaryHex: String? = nil, tertiaryHex: String? = nil, surfaces: SurfaceTint? = nil) {
    self.secondaryHex = secondaryHex
    self.tertiaryHex = tertiaryHex
    self.surfaces = surfaces
  }
}

// MARK: - preset-vars.ts

private let presetVarsCache = BoundedCache<String, TokenMap>(limit: 64)

/// `getPresetVars`: a preset's canonical tokens, every colour from the engine and the policy,
/// with the preset's authored values on top.
public func getPresetVars(_ colorName: AppColorName, _ mode: ColorMode, accents: ExplicitAccents? = nil) -> TokenMap {
  let key = [
    colorName.rawValue, mode.rawValue, accents?.secondaryHex ?? "\u{0}", accents?.tertiaryHex ?? "\u{0}",
    accents?.surfaces == .neutral ? "1" : "0",
  ].joined(separator: "\u{1}")
  return presetVarsCache.value(key) { solvePresetVars(colorName, mode, accents) }
}

private func solvePresetVars(_ colorName: AppColorName, _ mode: ColorMode, _ accents: ExplicitAccents?) -> TokenMap {
  let preset = colorName.preset
  let r = generateRoleColors(GenerateOptions(
    seed: preset.hex, variant: preset.variant, isDark: mode == .dark,
    secondarySeed: accents?.secondaryHex ?? preset.secondaryHex,
    tertiarySeed: accents?.tertiaryHex ?? preset.tertiaryHex))
  let base = roleColorsToPresetTokens(r)
  let policy = buildPolicyTokens(
    preset.hex, isDark: mode == .dark, roles: r,
    pinned: PinnedAccents(
      secondary: accents?.secondaryHex ?? preset.secondaryHex,
      tertiary: accents?.tertiaryHex ?? preset.tertiaryHex,
      neutralSurfaces: accents?.surfaces == .neutral))
  return base.merging(policy).merging(authoredTokens(preset.tokens?.tokens(for: mode), accents))
}

/// `getPresetBackground`: a preset's page background for one mode, for one tone solve.
public func getPresetBackground(_ colorName: AppColorName, _ mode: ColorMode) -> String {
  let preset = colorName.preset
  if let authored = preset.tokens?.tokens(for: mode)?.first(where: { $0.name == "--background" }) {
    return rgbFromHex(authored.value)
  }
  return policyBackground(preset.hex, isDark: mode == .dark)
}

private let authoredSurfaceTokens: Set<String> = [
  "--background", "--surface", "--popover", "--card", "--muted", "--accent", "--sidebar",
  "--sidebar-accent", "--sidebar-accent-foreground", "--content-area",
]

private func authoredTokens(_ authored: [TokenPair]?, _ accents: ExplicitAccents?) -> TokenMap {
  guard let authored else { return TokenMap() }
  var out = TokenMap()
  let neutral = accents?.surfaces == .neutral
  for pair in authored {
    if neutral && authoredSurfaceTokens.contains(pair.name) { continue }
    if accents?.secondaryHex != nil && pair.name.hasPrefix("--secondary") { continue }
    if accents?.tertiaryHex != nil && pair.name.hasPrefix("--tertiary") { continue }
    out[pair.name] = rgbFromHex(pair.value)
  }
  return out
}

private func rgbFromHex(_ hex: String) -> String { rgbString(argbFromHex(hex)) }

// MARK: - token-registry.ts

/// `getResolvedTokens`: THE runtime token source; HSL triples become `rgb(...)`, everything else
/// passes through.
public func getResolvedTokens(_ preset: AppColorName, _ mode: ColorMode, accents: ExplicitAccents? = nil) -> TokenMap {
  var resolved = TokenMap()
  for (key, value) in getPresetVars(preset, mode, accents: accents) {
    resolved[key] = isRawHslTriple(value) ? hslToSrgb(value) : value
  }
  return resolved
}

// MARK: - color-scope/seed-scope.ts

/// `withScopeAliases`: the `--color-x` alias layer, resolved against this record's own values.
public func withScopeAliases(_ tokens: TokenMap) -> TokenMap {
  var vars = tokens
  for (key, value) in tokens { vars["--color-" + key.dropFirst(2)] = value }
  for (alias, reference) in BloomTokenData.scopedAliases {
    guard reference.hasPrefix("var(--"), reference.hasSuffix(")"), reference.count > 7 else { continue }
    let canonical = reference.dropFirst(6).dropLast()
    if let resolved = tokens["--" + canonical] { vars["--color-" + alias] = resolved }
  }
  return vars
}

/// `roleColorsToPresetTokens`: the canonical role → token assignment (`getPresetVars`'s base).
public func roleColorsToPresetTokens(_ r: RoleColors) -> TokenMap {
  TokenMap([
    ("--background", r[.background]),
    ("--foreground", r[.onBackground]),
    ("--surface", r[.surfaceContainerLow]),
    ("--surface-foreground", r[.onSurface]),
    ("--popover", r[.surfaceContainer]),
    ("--popover-foreground", r[.onSurface]),
    ("--primary", r[.primary]),
    ("--primary-foreground", r[.onPrimary]),
    ("--secondary", r[.secondaryContainer]),
    ("--secondary-foreground", r[.onSecondaryContainer]),
    ("--tertiary", r[.tertiaryContainer]),
    ("--tertiary-foreground", r[.onTertiaryContainer]),
    ("--muted", r[.surfaceContainerHigh]),
    ("--muted-foreground", r[.onSurfaceVariant]),
    ("--accent", r[.secondaryContainer]),
    ("--accent-foreground", r[.onSecondaryContainer]),
    ("--destructive", r[.error]),
    ("--border", r[.outlineVariant]),
    ("--input", r[.outlineVariant]),
    ("--ring", r[.primary]),
    ("--sidebar", r[.surfaceContainerLow]),
    ("--card", r[.surfaceContainerLowest]),
    ("--card-foreground", r[.onSurface]),
    ("--chart-1", r[.primary]),
    ("--chart-2", r[.secondary]),
    ("--chart-3", r[.tertiary]),
    ("--chart-4", r[.primaryContainer]),
    ("--chart-5", r[.tertiaryContainer]),
    ("--content-area", r[.background]),
    ("--sidebar-foreground", r[.onSurface]),
    ("--sidebar-primary", r[.primary]),
    ("--sidebar-primary-foreground", r[.onPrimary]),
    ("--sidebar-accent", r[.secondaryContainer]),
    ("--sidebar-accent-foreground", r[.onSecondaryContainer]),
    ("--sidebar-border", r[.outlineVariant]),
    ("--sidebar-ring", r[.primary]),
  ])
}

/// `SeedScopeOptions`.
public struct SeedScopeOptions: Sendable, Hashable {
  /// `#rrggbb`.
  public var seed: String
  public var mode: ColorMode
  /// Absent: `vivid`, or `monochrome` for a colourless seed.
  public var variant: SchemeVariant?
  /// −1 … 1; absent is 0.
  public var contrastLevel: Double?
  public var secondarySeed: String?
  public var tertiarySeed: String?

  public init(
    seed: String, mode: ColorMode, variant: SchemeVariant? = nil, contrastLevel: Double? = nil,
    secondarySeed: String? = nil, tertiarySeed: String? = nil
  ) {
    self.seed = seed
    self.mode = mode
    self.variant = variant
    self.contrastLevel = contrastLevel
    self.secondarySeed = secondarySeed
    self.tertiarySeed = tertiarySeed
  }
}

private let seedScopeCache = BoundedCache<SeedScopeOptions, TokenMap>(limit: 128)

/// `buildSeedScopeVars`: an arbitrary seed's token record, with the alias layer.
public func buildSeedScopeVars(_ options: SeedScopeOptions) -> TokenMap {
  seedScopeCache.value(options) { withScopeAliases(seedTokens(options)) }
}

/// The seed path's tokens before the alias layer (what `solveSeedScopeVars` aliases).
func seedTokens(_ options: SeedScopeOptions) -> TokenMap {
  let roles = generateRoleColors(GenerateOptions(
    seed: options.seed,
    variant: options.variant ?? (isColourlessSeed(options.seed) ? .monochrome : .vivid),
    isDark: options.mode == .dark, contrastLevel: options.contrastLevel ?? 0,
    secondarySeed: options.secondarySeed, tertiarySeed: options.tertiarySeed))
  return roleColorsToPresetTokens(roles).merging(buildPolicyTokens(
    options.seed, isDark: options.mode == .dark, roles: roles,
    pinned: PinnedAccents(secondary: options.secondarySeed, tertiary: options.tertiarySeed)))
}

/// `buildScopeVars` (style-builder.ts): a preset's tokens with the alias layer.
public func buildScopeVars(_ colorPreset: AppColorName, _ mode: ColorMode, accents: ExplicitAccents? = nil) -> TokenMap {
  withScopeAliases(getResolvedTokens(colorPreset, mode, accents: accents))
}

// MARK: - build-theme.ts / build-theme-from-seed.ts

/// `BloomTheme` (the TypeScript `Theme`): what `useTheme()` returns — every colour role, the
/// chart pairs and the gradients. Labels, accents and presses derive from `colors`
/// (`resolveLabelColors`, `resolveAccentColors`, `pressedSurface`).
public struct BloomTheme: Sendable, Hashable {
  public var mode: ColorMode
  public var colors: ThemeColors
  /// The nine canonical chart pairs. Built themes always have them.
  public var chartColors: [ThemeChartColor]?
  public var gradients: [(name: String, gradient: ThemeGradient)] { BloomConstantData.themeGradients }
  public var isDark: Bool { mode == .dark }
  public var isLight: Bool { mode == .light }

  public init(mode: ColorMode, colors: ThemeColors, chartColors: [ThemeChartColor]?) {
    self.mode = mode
    self.colors = colors
    self.chartColors = chartColors
  }

  public static func == (lhs: BloomTheme, rhs: BloomTheme) -> Bool {
    lhs.mode == rhs.mode && lhs.colors == rhs.colors && lhs.chartColors == rhs.chartColors
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(mode)
    hasher.combine(colors)
    hasher.combine(chartColors)
  }
}

/// The TypeScript name of `BloomTheme`.
public typealias Theme = BloomTheme

/// `SeedAccents`.
public struct SeedAccents: Sendable, Hashable {
  public var secondarySeed: String?
  public var tertiarySeed: String?

  public init(secondarySeed: String? = nil, tertiarySeed: String? = nil) {
    self.secondarySeed = secondarySeed
    self.tertiarySeed = tertiarySeed
  }
}

/// `buildColorsFromPreset` / `buildSeedThemeValues`' field mapping: token-backed fields read the
/// resolved token record; `negative*` reads the engine's error roles.
private func themeColors(_ t: TokenMap, _ r: RoleColors, isDark: Bool) -> ThemeColors {
  func g(_ k: String) -> String { t["--" + k] ?? "rgb(0 0 0)" }
  return ThemeColors(
    background: g("background"),
    backgroundSecondary: g("surface"),
    backgroundTertiary: g("popover"),
    text: g("foreground"),
    textSecondary: g("muted-foreground"),
    textTertiary: g("faint-foreground"),
    border: g("border"),
    borderLight: g("input"),
    primary: g("primary"),
    primaryForeground: g("primary-foreground"),
    primaryLight: g("surface"),
    primaryDark: g("background"),
    secondary: g("secondary"),
    secondaryForeground: g("secondary-foreground"),
    secondarySubtle: g("secondary-subtle"),
    secondarySubtleForeground: g("secondary-text"),
    tertiary: g("tertiary"),
    tertiaryForeground: g("tertiary-foreground"),
    tertiarySubtle: g("tertiary-subtle"),
    tertiarySubtleForeground: g("tertiary-text"),
    vivid: g("vivid"),
    vividForeground: g("vivid-foreground"),
    tint: g("primary"),
    icon: g("muted-foreground"),
    iconActive: g("primary"),
    success: g("success"),
    successForeground: g("success-foreground"),
    error: g("error"),
    errorForeground: g("error-foreground"),
    warning: g("warning"),
    warningForeground: g("warning-foreground"),
    info: g("info"),
    infoForeground: g("info-foreground"),
    successSubtle: g("success-subtle"),
    successSubtleForeground: g("success-text"),
    errorSubtle: g("error-subtle"),
    errorSubtleForeground: g("error-text"),
    warningSubtle: g("warning-subtle"),
    warningSubtleForeground: g("warning-text"),
    infoSubtle: g("info-subtle"),
    infoSubtleForeground: g("info-text"),
    primarySubtle: g("primary-subtle"),
    primarySubtleForeground: g("primary-text"),
    negative: r[.error],
    negativeForeground: r[.onError],
    negativeSubtle: g("error-subtle"),
    negativeSubtleForeground: g("error-text"),
    contrast50: g("muted"),
    card: g("card"),
    shadow: isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)",
    overlay: "rgba(0, 0, 0, 0.5)",
    destructive: g("destructive"),
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
    surfaceForeground: g("surface-foreground"),
    accent: g("accent"))
}

/// `buildTheme(preset, resolved, false, accents)`. An adaptive theme's platform palette is
/// overlaid by BloomUI (`withPlatformColors`), not here: Foundation has no platform palette.
public func buildTheme(_ preset: AppColorName, _ resolved: ColorMode, accents: ExplicitAccents? = nil) -> Theme {
  let t = getResolvedTokens(preset, resolved, accents: accents)
  let config = preset.preset
  let r = generateRoleColors(GenerateOptions(
    seed: config.hex, variant: config.variant, isDark: resolved == .dark,
    secondarySeed: accents?.secondaryHex ?? config.secondaryHex,
    tertiarySeed: accents?.tertiaryHex ?? config.tertiaryHex))
  return Theme(mode: resolved, colors: themeColors(t, r, isDark: resolved == .dark), chartColors: chartColorsFromTokens(t))
}

private struct SeedThemeKey: Hashable, Sendable {
  let seed: String
  let resolved: ColorMode
  let variant: SchemeVariant?
  let contrastLevel: Double?
  let accents: SeedAccents?
}

private let seedThemeCache = BoundedCache<SeedThemeKey, Theme>(limit: 128)

/// `buildThemeFromSeed`: a full `Theme` from any seed.
public func buildThemeFromSeed(
  _ seed: String, _ resolved: ColorMode, variant: SchemeVariant? = nil, contrastLevel: Double? = nil,
  accents: SeedAccents? = nil
) -> Theme {
  let key = SeedThemeKey(seed: seed, resolved: resolved, variant: variant, contrastLevel: contrastLevel, accents: accents)
  return seedThemeCache.value(key) {
    let t = buildSeedScopeVars(SeedScopeOptions(
      seed: seed, mode: resolved, variant: variant, contrastLevel: contrastLevel,
      secondarySeed: accents?.secondarySeed, tertiarySeed: accents?.tertiarySeed))
    // The TypeScript passes `variant` through unchanged here, so an absent one is the engine's
    // own default (`vibrant`) — only the error roles are read from this set.
    let r = generateRoleColors(GenerateOptions(
      seed: seed, variant: variant, isDark: resolved == .dark, contrastLevel: contrastLevel,
      secondarySeed: accents?.secondarySeed, tertiarySeed: accents?.tertiarySeed))
    return Theme(mode: resolved, colors: themeColors(t, r, isDark: resolved == .dark), chartColors: chartColorsFromTokens(t))
  }
}

/// `buildColorsFromSeed`.
public func buildColorsFromSeed(
  _ seed: String, _ resolved: ColorMode, variant: SchemeVariant? = nil, contrastLevel: Double? = nil,
  accents: SeedAccents? = nil
) -> ThemeColors {
  buildThemeFromSeed(seed, resolved, variant: variant, contrastLevel: contrastLevel, accents: accents).colors
}

/// `STATUS_COLORS` by role.
public func statusColor(_ role: String) -> String? {
  BloomConstantData.statusColors.first { $0.role == role }?.hex
}

// MARK: - color-scope (context.ts, resolve-scope.ts)

/// `ScopePalette`: a theme and its token record, built together.
public struct ScopePalette: Sendable, Hashable {
  public var theme: Theme
  public var vars: TokenMap

  public init(theme: Theme, vars: TokenMap) {
    self.theme = theme
    self.vars = vars
  }
}

/// `buildPresetPalette(preset, resolved, false, accents)`.
public func buildPresetPalette(_ preset: AppColorName, _ resolved: ColorMode, accents: ExplicitAccents? = nil) -> ScopePalette {
  ScopePalette(theme: buildTheme(preset, resolved, accents: accents), vars: buildScopeVars(preset, resolved, accents: accents))
}

/// A seed's palette, as the provider and `BloomColorScope` build it.
public func buildSeedPalette(
  _ seed: String, _ resolved: ColorMode, variant: SchemeVariant? = nil, contrastLevel: Double? = nil,
  accents: SeedAccents? = nil
) -> ScopePalette {
  ScopePalette(
    theme: buildThemeFromSeed(seed, resolved, variant: variant, contrastLevel: contrastLevel, accents: accents),
    vars: buildSeedScopeVars(SeedScopeOptions(
      seed: seed, mode: resolved, variant: variant, contrastLevel: contrastLevel,
      secondarySeed: accents?.secondarySeed, tertiarySeed: accents?.tertiarySeed)))
}

private func withoutAliases(_ vars: TokenMap) -> TokenMap {
  vars.filter { key, _ in !key.hasPrefix("--color-") }
}

/// `withFieldColors`: each token takes the colour of its own `ThemeColors` field, aliases rebuilt.
/// BloomUI calls it with the platform palette in an adaptive theme.
public func withFieldColors(_ vars: TokenMap, _ colors: [ThemeColorField: String]) -> TokenMap {
  var next = withoutAliases(vars)
  for (token, fields) in BloomTokenData.colorFields {
    if let value = colors[fields[0]] { next[token] = value }
  }
  return withScopeAliases(next)
}

/// `BloomColorScopeTokens`: exact canonical colours, in the order they were written.
public typealias BloomColorScopeTokens = [(token: CanonicalToken, value: String)]

/// Why `applyScopeTokens` refused a value (the TypeScript throws).
public enum ScopeTokenError: Error, Equatable, Sendable {
  case notAColor(CanonicalToken)
}

/// `applyScopeTokens`: exact overrides over a palette; unspecified roles are kept and the alias
/// layer is rebuilt. A value must be a colour `parseRgba` reads (`processColor` in React Native
/// also accepts named colours, which a native scope has no use for).
public func applyScopeTokens(_ base: ScopePalette, _ overrides: BloomColorScopeTokens?) throws -> ScopePalette {
  guard let overrides, !overrides.isEmpty else { return base }
  var entries = overrides
  // `withFaintText`: the tertiary text follows an exact muted-foreground unless named.
  if let muted = overrides.last(where: { $0.token == .mutedForeground })?.value,
    !overrides.contains(where: { $0.token == .faintForeground })
  {
    entries.append((.faintForeground, muted))
  }
  var vars = base.vars
  var colors = base.theme.colors
  var changedCharts = false
  // A JS object holds each key once, at its first position, with its last value.
  var ordered: [(CanonicalToken, String)] = []
  for (token, value) in entries {
    if let at = ordered.firstIndex(where: { $0.0 == token }) { ordered[at].1 = value } else { ordered.append((token, value)) }
  }
  for (token, value) in ordered {
    guard !jsTrim(value).isEmpty, parseRgba(value) != nil else { throw ScopeTokenError.notAColor(token) }
    vars[token] = value
    if let fields = BloomTokenData.colorFields.first(where: { $0.token == token })?.fields {
      for field in fields { colors[field] = value }
    }
    if token.rawValue.hasPrefix("chart-") { changedCharts = true }
  }
  var theme = base.theme
  theme.colors = colors
  if changedCharts { theme.chartColors = chartColorsFromTokens(vars) }
  return ScopePalette(theme: theme, vars: withScopeAliases(withoutAliases(vars)))
}
