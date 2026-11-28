// Port of src/theme/color-policy.ts: how a seed becomes the visible token set. The reasons for
// every constant live beside it in the TypeScript; they are not repeated here, only the numbers,
// which the goldens hold to the TypeScript's output.
import Foundation

/// `PinnedAccents`.
public struct PinnedAccents: Sendable, Hashable {
  public var secondary: String?
  public var tertiary: String?
  /// Draw surfaces, text and boundaries in greys of no hue (`SurfaceTint.neutral`).
  public var neutralSurfaces: Bool

  public init(secondary: String? = nil, tertiary: String? = nil, neutralSurfaces: Bool = false) {
    self.secondary = secondary
    self.tertiary = tertiary
    self.neutralSurfaces = neutralSurfaces
  }
}

/// `SurfaceTint`: how a theme's surfaces take its seed.
public enum SurfaceTint: String, Codable, Sendable, Hashable {
  case tinted
  case neutral
}

private let aa = 4.5

/// `rgba(r, g, b, a)`, the legacy comma form React Native parses everywhere.
func rgbaString(_ argb: ARGB, _ alpha: Double) -> String {
  "rgba(\(redFromArgb(argb)), \(greenFromArgb(argb)), \(blueFromArgb(argb)), \(jsNumberString(alpha)))"
}

/// `contrastOf`: WCAG contrast of the QUANTIZED colour against white or black.
func contrastOf(_ argb: ARGB, onWhite: Bool) -> Double {
  func channel(_ v: Int) -> Double {
    let c = Double(v) / 255
    return c <= 0.03928 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
  }
  let luminance =
    0.2126 * channel(redFromArgb(argb)) + 0.7152 * channel(greenFromArgb(argb))
    + 0.0722 * channel(blueFromArgb(argb))
  return onWhite ? 1.05 / (luminance + 0.05) : (luminance + 0.05) / 0.05
}

private func foregroundFor(_ argb: ARGB) -> String {
  contrastOf(argb, onWhite: true) >= aa ? "rgb(255 255 255)" : "rgb(0 0 0)"
}

private func noLegibleForeground(_ argb: ARGB) -> Bool {
  contrastOf(argb, onWhite: true) < aa && contrastOf(argb, onWhite: false) < aa
}

private let fillToneFloor = 45.0
private let fillToneSearchCeiling = 56.0
private let lightDepthStep = 5.0
private let pinnedActionLightStep = 4.0
private let lightFillFloor = 40.0
private let toneBudget = 25.0
private let darkSeedFloor = 58.0
private let darkAccentFloor = 58.0
private let accentChroma = 80.0
private let textTone = (light: 40.0, dark: 80.0)
private let textChroma = 60.0
private let subtleSourceTone = 60.0
private let subtleAlpha = (light: 0.13, dark: 0.24)
private let surfaceRamp = (
  light: (surface: 92.0, popover: 88.0, muted: 84.0),
  dark: (surface: 10.0, popover: 14.0, muted: 18.0)
)
private let backgroundTone = (light: 96.0, dark: 4.0)
private let lightNeutralShift = -2.0
private let neutralChroma = 28.0
private let monochromeMaxChroma = 6.0
private let monochromeFillTone = (light: 12.0, dark: 94.0)
private let monochromeSecondaryTone = (light: 36.0, dark: 72.0)
private let splitRotations = (150.0, 210.0)
private let vividSnapWindow = 25
private let vividSnapMinGain = 15.0
private let minAccentSeparation = 25.0
private let destructiveProximity = 30.0

private func hueDistance(_ a: Double, _ b: Double) -> Double {
  let d = abs(a - b).truncatingRemainder(dividingBy: 360)
  return jsMin(d, 360 - d)
}

/// `isColourlessSeed`: the one authority for "this seed has no colour".
public func isColourlessSeed(_ seedHex: String) -> Bool {
  Hct.fromInt(argbFromHex(seedHex)).chroma <= monochromeMaxChroma
}

/// `policyBackground`: the page background a seed derives.
public func policyBackground(_ seedHex: String, isDark: Bool, neutralSurfaces: Bool = false) -> String {
  let seed = Hct.fromInt(argbFromHex(seedHex))
  let monochrome = seed.chroma <= monochromeMaxChroma
  let neutral = TonalPalette.fromHueAndChroma(seed.hue, monochrome || neutralSurfaces ? 0 : neutralChroma)
  let lightShift = !isDark && !monochrome ? lightNeutralShift : 0
  return rgbString(neutral.tone((isDark ? backgroundTone.dark : backgroundTone.light) + lightShift))
}

private struct HuePeak: Sendable {
  let tone: Double
  let chroma: Double
}

private let huePeakCache = BoundedCache<Double, HuePeak>(limit: 1024)

/// `huePeak`: where a hue reaches its highest chroma in sRGB, and that chroma.
private func huePeak(_ hue: Double) -> HuePeak {
  huePeakCache.value(hue) {
    let palette = TonalPalette.fromHueAndChroma(hue, 200)
    var bestTone = 50.0
    var bestChroma = -1.0
    var tone = 30.0
    while tone <= 92 {
      let chroma = Hct.fromInt(palette.tone(tone)).chroma
      if chroma > bestChroma {
        bestChroma = chroma
        bestTone = tone
      }
      tone += 1
    }
    return HuePeak(tone: bestTone, chroma: bestChroma)
  }
}

private func peakTone(_ hue: Double) -> Double { huePeak(hue).tone }
private func peakChroma(_ hue: Double) -> Double { huePeak(hue).chroma }

private func vividHueNear(_ hue: Double) -> Double {
  let baseChroma = peakChroma(hue)
  var bestHue = hue
  var bestChroma = baseChroma
  for delta in -vividSnapWindow...vividSnapWindow {
    let candidate = ((hue + Double(delta)).truncatingRemainder(dividingBy: 360) + 360)
      .truncatingRemainder(dividingBy: 360)
    let chroma = peakChroma(candidate)
    if chroma > bestChroma {
      bestChroma = chroma
      bestHue = candidate
    }
  }
  return bestChroma - baseChroma >= vividSnapMinGain ? bestHue : hue
}

private func declaresWhiteLabel(_ seedHex: String) -> Bool {
  guard let name = BloomThemeData.hexToAppColor[seedHex.lowercased()] else { return false }
  return name.preset.label == .white
}

private func vividLegibleTone(_ palette: TonalPalette) -> Double {
  var bestTone = fillToneFloor
  var bestChroma = -1.0
  var tone = fillToneFloor
  while tone <= fillToneSearchCeiling {
    defer { tone += 0.5 }
    let argb = palette.tone(tone)
    if contrastOf(argb, onWhite: true) < aa { continue }
    let chroma = Hct.fromInt(argb).chroma
    if chroma > bestChroma {
      bestChroma = chroma
      bestTone = tone
    }
  }
  return bestTone
}

private func brandTone(_ palette: TonalPalette, isDark: Bool, forceWhite: Bool) -> Double {
  if !isDark { return jsMax(lightFillFloor, vividLegibleTone(palette) - lightDepthStep) }
  return forceWhite ? vividLegibleTone(palette) : jsMax(peakTone(palette.hue), darkSeedFloor)
}

private func accentTone(_ hue: Double, isDark: Bool) -> Double {
  let palette = TonalPalette.fromHueAndChroma(hue, accentChroma)
  if !isDark { return jsMax(lightFillFloor, vividLegibleTone(palette) - lightDepthStep) }
  let peak = jsMax(peakTone(hue), darkAccentFloor)
  let candidate = jsMax(vividLegibleTone(palette), peak - toneBudget)
  return contrastOf(palette.tone(candidate), onWhite: true) >= aa ? candidate : peak
}

private func fillPair(_ palette: TonalPalette, _ startTone: Double) -> (fill: String, foreground: String) {
  var tone = startTone
  while noLegibleForeground(palette.tone(tone)) && tone > 1 && tone < 99 {
    tone += tone < 50 ? -1 : 1
  }
  return (rgbString(palette.tone(tone)), foregroundFor(palette.tone(tone)))
}

/// `deriveAccentHues`: which arm of the split-complement is the standout (`tertiary`).
public func deriveAccentHues(_ seedHue: Double) -> AccentHues {
  let geometricA = (seedHue + splitRotations.0).truncatingRemainder(dividingBy: 360)
  let geometricB = (seedHue + splitRotations.1).truncatingRemainder(dividingBy: 360)
  let geometricStandout = peakChroma(geometricA) >= peakChroma(geometricB) ? geometricA : geometricB
  let quiet = geometricStandout == geometricA ? geometricB : geometricA
  let snapped = vividHueNear(geometricStandout)
  let standout = hueDistance(snapped, quiet) >= minAccentSeparation ? snapped : geometricStandout
  let errorHue = Hct.fromInt(argbFromHex(statusSeed("error"))).hue
  return hueDistance(standout, errorHue) < destructiveProximity
    ? AccentHues(secondary: standout, tertiary: quiet)
    : AccentHues(secondary: quiet, tertiary: standout)
}

private let derivedAccentHueCache = BoundedCache<Double, AccentHues>(limit: 128)

private func accentHues(_ seedHex: String, _ seedHue: Double) -> AccentHues {
  BloomThemeData.presetAccentHues[seedHex.lowercased()]
    ?? derivedAccentHueCache.value(seedHue) { deriveAccentHues(seedHue) }
}

private func statusSeed(_ role: String) -> String {
  BloomConstantData.statusSeeds.first { $0.role == role }!.hex
}

/// `buildPolicyTokens`: the tokens the policy owns, for a seed and mode. `roles` is the
/// engine's role set for the same seed and mode.
public func buildPolicyTokens(
  _ seedHex: String, isDark: Bool, roles: RoleColors, pinned: PinnedAccents = PinnedAccents()
) -> TokenMap {
  let seed = Hct.fromInt(argbFromHex(seedHex))
  let monochrome = seed.chroma <= monochromeMaxChroma
  let brandPalette = monochrome
    ? TonalPalette.fromHueAndChroma(0, 0) : TonalPalette.fromInt(argbFromHex(seedHex))
  let primary = fillPair(
    brandPalette,
    monochrome
      ? (isDark ? monochromeFillTone.dark : monochromeFillTone.light)
      : brandTone(brandPalette, isDark: isDark, forceWhite: declaresWhiteLabel(seedHex)))

  let vividArgb: ARGB? = monochrome ? nil : brandPalette.tone(jsRound(seed.tone))
  let vivid = vividArgb.map { (fill: rgbString($0), foreground: foregroundFor($0)) } ?? primary

  let neutral = TonalPalette.fromHueAndChroma(
    seed.hue, monochrome || pinned.neutralSurfaces ? 0 : neutralChroma)
  let originalRamp = isDark ? surfaceRamp.dark : surfaceRamp.light
  let lightShift = !isDark && !monochrome ? lightNeutralShift : 0
  let rampSurface = originalRamp.surface + lightShift
  let rampPopover = originalRamp.popover + lightShift
  let rampMuted = originalRamp.muted + lightShift
  let foreground = rgbString(neutral.tone(isDark ? 94 : 10))
  let mutedForeground = rgbString(neutral.tone(isDark ? 80 : 30))
  let boundary = rgbString(neutral.tone(isDark ? 35 : 72))

  var tokens = TokenMap()
  tokens["--primary"] = primary.fill
  tokens["--primary-foreground"] = primary.foreground
  tokens["--vivid"] = vivid.fill
  tokens["--vivid-foreground"] = vivid.foreground
  tokens["--primary-text"] = roles[.primary]
  tokens["--primary-subtle"] = rgbaString(
    TonalPalette.fromHueAndChroma(seed.hue, monochrome ? 0 : 200).tone(subtleSourceTone),
    isDark ? subtleAlpha.dark : subtleAlpha.light)
  tokens["--ring"] = roles[.primary]
  tokens["--card"] = monochrome
    ? (isDark ? roles[.surfaceContainerHighest] : roles[.surfaceContainerLowest])
    : rgbString(neutral.tone(isDark ? 22 : 98))
  tokens["--background"] = policyBackground(seedHex, isDark: isDark, neutralSurfaces: pinned.neutralSurfaces)
  tokens["--content-area"] = monochrome ? roles[.background] : rgbString(neutral.tone(isDark ? 6 : 96))
  tokens["--foreground"] = monochrome ? roles[.onBackground] : foreground
  tokens["--surface-foreground"] = monochrome ? roles[.onSurface] : foreground
  tokens["--card-foreground"] = monochrome ? roles[.onSurface] : foreground
  tokens["--popover-foreground"] = monochrome ? roles[.onSurface] : foreground
  tokens["--sidebar-foreground"] = monochrome ? roles[.onSurface] : foreground
  tokens["--muted-foreground"] = monochrome ? roles[.onSurfaceVariant] : mutedForeground
  tokens["--faint-foreground"] = monochrome ? roles[.onSurfaceVariant] : mutedForeground
  tokens["--border"] = monochrome ? roles[.outlineVariant] : boundary
  tokens["--input"] = monochrome ? roles[.outlineVariant] : boundary
  tokens["--sidebar-border"] = monochrome ? roles[.outlineVariant] : boundary
  tokens["--surface"] = rgbString(neutral.tone(rampSurface))
  tokens["--sidebar"] = rgbString(neutral.tone(rampSurface))
  tokens["--popover"] = rgbString(neutral.tone(rampPopover))
  tokens["--muted"] = rgbString(neutral.tone(rampMuted))
  tokens["--accent"] = rgbString(neutral.tone(rampMuted))
  tokens["--accent-foreground"] = monochrome ? roles[.onSurfaceVariant] : mutedForeground
  tokens["--sidebar-accent"] = monochrome ? roles[.secondaryContainer] : rgbString(neutral.tone(rampMuted))
  tokens["--sidebar-accent-foreground"] = monochrome ? roles[.onSecondaryContainer] : mutedForeground

  for role in ["secondary", "tertiary"] {
    let pin = role == "secondary" ? pinned.secondary : pinned.tertiary
    let hue: Double
    if let pin {
      hue = Hct.fromInt(argbFromHex(pin)).hue
    } else {
      let hues = accentHues(seedHex, seed.hue)
      hue = role == "secondary" ? hues.secondary : hues.tertiary
    }
    let accentMonochrome = monochrome && pin == nil
    let fillPalette = TonalPalette.fromHueAndChroma(hue, accentMonochrome ? 0 : accentChroma)
    let textPalette = TonalPalette.fromHueAndChroma(hue, accentMonochrome ? 0 : textChroma)
    let vividPalette = TonalPalette.fromHueAndChroma(hue, accentMonochrome ? 0 : 200)
    let pinnedAction = role == "tertiary" && pin != nil
    let tone: Double
    if accentMonochrome {
      tone = role == "tertiary"
        ? (isDark ? monochromeFillTone.dark : monochromeFillTone.light)
        : (isDark ? monochromeSecondaryTone.dark : monochromeSecondaryTone.light)
    } else if pinnedAction {
      tone = isDark
        ? jsMax(peakTone(hue), darkAccentFloor)
        : jsMax(lightFillFloor, peakTone(hue) - pinnedActionLightStep)
    } else {
      tone = accentTone(hue, isDark: isDark)
    }
    let pair = fillPair(fillPalette, tone)
    tokens["--\(role)"] = pair.fill
    tokens["--\(role)-foreground"] = pair.foreground
    tokens["--\(role)-text"] = rgbString(textPalette.tone(isDark ? textTone.dark : textTone.light))
    tokens["--\(role)-subtle"] = rgbaString(
      vividPalette.tone(subtleSourceTone), isDark ? subtleAlpha.dark : subtleAlpha.light)
  }

  for (index, pair) in createChartColors(seed.hue, isDark: isDark, monochrome: monochrome).enumerated() {
    tokens["--chart-\(index + 1)"] = pair.color
    tokens["--chart-\(index + 1)-active"] = pair.activeColor
  }

  for (role, hex) in BloomConstantData.statusSeeds {
    let status = Hct.fromInt(argbFromHex(hex))
    let palette = TonalPalette.fromHueAndChroma(status.hue, status.chroma)
    let pair = fillPair(
      palette,
      isDark
        ? vividLegibleTone(palette)
        : jsMax(lightFillFloor, vividLegibleTone(palette) - lightDepthStep))
    tokens["--\(role)"] = pair.fill
    tokens["--\(role)-foreground"] = pair.foreground
    tokens["--\(role)-text"] = rgbString(
      TonalPalette.fromHueAndChroma(status.hue, textChroma).tone(isDark ? textTone.dark : textTone.light))
    tokens["--\(role)-subtle"] = rgbaString(
      palette.tone(status.tone), isDark ? subtleAlpha.dark : subtleAlpha.light)
  }

  return tokens
}

// MARK: - chart-colors.ts

/// `ThemeChartColor`: one categorical series' fill and its active (pressed/hovered) member.
public struct ThemeChartColor: Sendable, Hashable, Codable {
  public var color: String
  public var activeColor: String

  public init(color: String, activeColor: String) {
    self.color = color
    self.activeColor = activeColor
  }
}

private let chartHueOffsets: [Double] = [0, 72, 144, 216, 288, 36, 108, 180, 252]
private let chartMonoSteps: [Double] = [0, 1, 2, 3, 4, 0.5, 1.5, 2.5, 3.5]

/// `createChartColors`: the one categorical policy for tokens, themes and custom themes.
public func createChartColors(_ hue: Double, isDark: Bool, monochrome: Bool) -> [ThemeChartColor] {
  chartHueOffsets.enumerated().map { index, offset in
    let palette = TonalPalette.fromHueAndChroma(
      monochrome ? 0 : (hue + offset).truncatingRemainder(dividingBy: 360), monochrome ? 0 : 60)
    let tone = monochrome
      ? (isDark ? 40 + chartMonoSteps[index] * 13 : 78 - chartMonoSteps[index] * 13)
      : (isDark ? 72 : 48)
    let activeTone = tone + (isDark ? (monochrome ? 3 : 8) : -8)
    return ThemeChartColor(color: rgbString(palette.tone(tone)), activeColor: rgbString(palette.tone(activeTone)))
  }
}

/// `chartColorsFromTokens`: the nine canonical pairs out of a token map (nil when one is missing,
/// where the TypeScript throws).
public func chartColorsFromTokens(_ tokens: TokenMap) -> [ThemeChartColor]? {
  var out: [ThemeChartColor] = []
  for index in 1...9 {
    guard let color = tokens["--chart-\(index)"], !color.isEmpty,
      let active = tokens["--chart-\(index)-active"], !active.isEmpty
    else { return nil }
    out.append(ThemeChartColor(color: color, activeColor: active))
  }
  return out
}

/// `resolveThemeChartColors`: a hand-authored theme may omit the palette; use the same policy.
public func resolveThemeChartColors(_ theme: Theme) -> [ThemeChartColor] {
  if let charts = theme.chartColors, charts.count == 9 { return charts }
  guard let source = parseRgba(theme.colors.primary) else {
    return createChartColors(0, isDark: theme.isDark, monochrome: true)
  }
  let seed = Hct.fromInt(argbFromRgb(jsInt32(source.r), jsInt32(source.g), jsInt32(source.b)))
  return createChartColors(seed.hue, isDark: theme.isDark, monochrome: seed.chroma <= 6)
}
