// Ports of src/theme/color-engine/variant.ts, dynamic-scheme.ts, scheme-variants.ts,
// tone-delta-pair.ts and color-role.ts (Material Color Utilities, Apache-2.0).
import Foundation

/// `Variant`: the scheme families, numbered as Material Color Utilities numbers them.
enum Variant: Int, Sendable {
  case monochrome = 0
  case neutral = 1
  case tonalSpot = 2
  case vibrant = 3
  case expressive = 4
  case fidelity = 5
  case content = 6
  case rainbow = 7
  case fruitSalad = 8
}

/// `SchemeVariant`: the scheme a seed is built with.
public enum SchemeVariant: String, CaseIterable, Codable, Sendable, Hashable {
  case vivid
  case vibrant
  case expressive
  case tonalSpot
  case neutral
  case monochrome
}

/// `DynamicScheme`: the five palettes a variant derives from the seed, plus error, and the
/// dark/contrast state a role resolves against.
struct DynamicScheme: Sendable {
  let sourceColorArgb: ARGB
  let variant: Variant
  let contrastLevel: Double
  let isDark: Bool
  let sourceColorHct: Hct
  let primaryPalette: TonalPalette
  let secondaryPalette: TonalPalette
  let tertiaryPalette: TonalPalette
  let neutralPalette: TonalPalette
  let neutralVariantPalette: TonalPalette
  let errorPalette: TonalPalette

  init(
    sourceColorArgb: ARGB, variant: Variant, contrastLevel: Double, isDark: Bool,
    primaryPalette: TonalPalette, secondaryPalette: TonalPalette, tertiaryPalette: TonalPalette,
    neutralPalette: TonalPalette, neutralVariantPalette: TonalPalette
  ) {
    self.sourceColorArgb = sourceColorArgb
    self.variant = variant
    self.contrastLevel = contrastLevel
    self.isDark = isDark
    self.sourceColorHct = .fromInt(sourceColorArgb)
    self.primaryPalette = primaryPalette
    self.secondaryPalette = secondaryPalette
    self.tertiaryPalette = tertiaryPalette
    self.neutralPalette = neutralPalette
    self.neutralVariantPalette = neutralVariantPalette
    self.errorPalette = .fromHueAndChroma(25.0, 84.0)
  }

  static func getRotatedHue(_ sourceColor: Hct, _ hues: [Double], _ rotations: [Double]) -> Double {
    let sourceHue = sourceColor.hue
    precondition(hues.count == rotations.count, "mismatch between hue length & rotations")
    if rotations.count == 1 { return sanitizeDegreesDouble(sourceColor.hue + rotations[0]) }
    let size = hues.count
    var i = 0
    while i <= size - 2 {
      let thisHue = hues[i]
      let nextHue = hues[i + 1]
      if thisHue < sourceHue && sourceHue < nextHue {
        return sanitizeDegreesDouble(sourceHue + rotations[i])
      }
      i += 1
    }
    return sourceHue
  }

  func argb(_ role: RoleName) -> ARGB { role.argb(in: self) }
}

// MARK: - Scheme variants (scheme-variants.ts)

/// `AccentSources`: pinned accent seeds; a palette is built from the colour itself.
struct AccentSources: Sendable {
  var secondarySource: Hct?
  var tertiarySource: Hct?
}

private func accentPalette(_ source: Hct?, _ derived: () -> TonalPalette) -> TonalPalette {
  source.map { TonalPalette.fromInt($0.toInt()) } ?? derived()
}

private let vibrantHues: [Double] = [0.0, 41.0, 61.0, 101.0, 131.0, 181.0, 251.0, 301.0, 360.0]
private let vibrantSecondaryRotations: [Double] = [18.0, 15.0, 10.0, 12.0, 15.0, 18.0, 15.0, 12.0, 12.0]
private let vibrantTertiaryRotations: [Double] = [35.0, 30.0, 20.0, 25.0, 30.0, 35.0, 30.0, 25.0, 25.0]
private let expressiveHues: [Double] = [0.0, 21.0, 51.0, 121.0, 151.0, 191.0, 271.0, 321.0, 360.0]
private let expressiveSecondaryRotations: [Double] = [45.0, 95.0, 45.0, 20.0, 45.0, 90.0, 45.0, 45.0, 45.0]
private let expressiveTertiaryRotations: [Double] = [120.0, 120.0, 20.0, 45.0, 20.0, 15.0, 20.0, 120.0, 120.0]

func buildScheme(
  _ variant: SchemeVariant, _ source: Hct, _ isDark: Bool, _ contrastLevel: Double = 0,
  _ accents: AccentSources = AccentSources()
) -> DynamicScheme {
  switch variant {
  case .vibrant:
    return DynamicScheme(
      sourceColorArgb: source.toInt(), variant: .vibrant, contrastLevel: contrastLevel, isDark: isDark,
      primaryPalette: .fromHueAndChroma(source.hue, 200.0),
      secondaryPalette: accentPalette(accents.secondarySource) {
        .fromHueAndChroma(DynamicScheme.getRotatedHue(source, vibrantHues, vibrantSecondaryRotations), 24.0)
      },
      tertiaryPalette: accentPalette(accents.tertiarySource) {
        .fromHueAndChroma(DynamicScheme.getRotatedHue(source, vibrantHues, vibrantTertiaryRotations), 32.0)
      },
      neutralPalette: .fromHueAndChroma(source.hue, 10.0),
      neutralVariantPalette: .fromHueAndChroma(source.hue, 12.0))
  case .vivid:
    return DynamicScheme(
      sourceColorArgb: source.toInt(), variant: .vibrant, contrastLevel: contrastLevel, isDark: isDark,
      primaryPalette: .fromHueAndChroma(source.hue, 200.0),
      secondaryPalette: accentPalette(accents.secondarySource) {
        .fromHueAndChroma(DynamicScheme.getRotatedHue(source, vibrantHues, vibrantSecondaryRotations), 64.0)
      },
      tertiaryPalette: accentPalette(accents.tertiarySource) {
        .fromHueAndChroma(DynamicScheme.getRotatedHue(source, vibrantHues, vibrantTertiaryRotations), 72.0)
      },
      neutralPalette: .fromHueAndChroma(source.hue, 10.0),
      neutralVariantPalette: .fromHueAndChroma(source.hue, 12.0))
  case .expressive:
    return DynamicScheme(
      sourceColorArgb: source.toInt(), variant: .expressive, contrastLevel: contrastLevel, isDark: isDark,
      primaryPalette: .fromHueAndChroma(sanitizeDegreesDouble(source.hue + 240.0), 40.0),
      secondaryPalette: accentPalette(accents.secondarySource) {
        .fromHueAndChroma(
          DynamicScheme.getRotatedHue(source, expressiveHues, expressiveSecondaryRotations), 24.0)
      },
      tertiaryPalette: accentPalette(accents.tertiarySource) {
        .fromHueAndChroma(
          DynamicScheme.getRotatedHue(source, expressiveHues, expressiveTertiaryRotations), 32.0)
      },
      neutralPalette: .fromHueAndChroma(source.hue + 15, 8.0),
      neutralVariantPalette: .fromHueAndChroma(source.hue + 15, 12.0))
  case .tonalSpot:
    return DynamicScheme(
      sourceColorArgb: source.toInt(), variant: .tonalSpot, contrastLevel: contrastLevel, isDark: isDark,
      primaryPalette: .fromHueAndChroma(source.hue, 36.0),
      secondaryPalette: accentPalette(accents.secondarySource) { .fromHueAndChroma(source.hue, 16.0) },
      tertiaryPalette: accentPalette(accents.tertiarySource) {
        .fromHueAndChroma(sanitizeDegreesDouble(source.hue + 60.0), 24.0)
      },
      neutralPalette: .fromHueAndChroma(source.hue, 6.0),
      neutralVariantPalette: .fromHueAndChroma(source.hue, 8.0))
  case .neutral:
    return DynamicScheme(
      sourceColorArgb: source.toInt(), variant: .neutral, contrastLevel: contrastLevel, isDark: isDark,
      primaryPalette: .fromHueAndChroma(source.hue, 12.0),
      secondaryPalette: accentPalette(accents.secondarySource) { .fromHueAndChroma(source.hue, 8.0) },
      tertiaryPalette: accentPalette(accents.tertiarySource) { .fromHueAndChroma(source.hue, 16.0) },
      neutralPalette: .fromHueAndChroma(source.hue, 2.0),
      neutralVariantPalette: .fromHueAndChroma(source.hue, 2.0))
  case .monochrome:
    // A pinned accent is ignored on purpose (scheme-variants.ts).
    let grey = TonalPalette.fromHueAndChroma(source.hue, 0)
    return DynamicScheme(
      sourceColorArgb: source.toInt(), variant: .monochrome, contrastLevel: contrastLevel, isDark: isDark,
      primaryPalette: grey, secondaryPalette: grey, tertiaryPalette: grey, neutralPalette: grey,
      neutralVariantPalette: grey)
  }
}

// MARK: - Colour roles (color-role.ts)

enum TonePolarity: Sendable { case darker, lighter, nearer, farther }

struct ToneDeltaPair: Sendable {
  let roleA: RoleName
  let roleB: RoleName
  let delta: Double
  let polarity: TonePolarity
  let stayTogether: Bool
}

/// A role's recipe (`ColorRoleArgs`): a palette, a base tone, and optionally a background to
/// contrast against and a paired role to keep tonal distance from.
struct RoleRecipe {
  var palette: (DynamicScheme) -> TonalPalette
  var tone: (DynamicScheme) -> Double
  var isBackground = false
  var background: ((DynamicScheme) -> RoleName)? = nil
  var secondBackground: ((DynamicScheme) -> RoleName)? = nil
  var contrastCurve: ContrastCurve? = nil
  var toneDeltaPair: ((DynamicScheme) -> ToneDeltaPair)? = nil
}

extension RoleName {
  func argb(in scheme: DynamicScheme) -> ARGB { hct(in: scheme).toInt() }

  func hct(in scheme: DynamicScheme) -> Hct { recipe.palette(scheme).getHct(tone(in: scheme)) }

  /// `ColorRole.getTone`.
  func tone(in scheme: DynamicScheme) -> Double {
    let recipe = self.recipe
    let decreasingContrast = scheme.contrastLevel < 0
    if let pairOf = recipe.toneDeltaPair {
      let pair = pairOf(scheme)
      let bg = recipe.background!(scheme)
      let bgTone = bg.tone(in: scheme)
      let aIsNearer =
        pair.polarity == .nearer || (pair.polarity == .lighter && !scheme.isDark)
        || (pair.polarity == .darker && scheme.isDark)
      let nearer = aIsNearer ? pair.roleA : pair.roleB
      let farther = aIsNearer ? pair.roleB : pair.roleA
      let amNearer = self == nearer
      let expansionDir: Double = scheme.isDark ? 1 : -1
      let nearerRecipe = nearer.recipe
      let fartherRecipe = farther.recipe
      let nContrast = nearerRecipe.contrastCurve!.get(scheme.contrastLevel)
      let fContrast = fartherRecipe.contrastCurve!.get(scheme.contrastLevel)
      let nInitialTone = nearerRecipe.tone(scheme)
      var nTone = ratioOfTones(bgTone, nInitialTone) >= nContrast
        ? nInitialTone : RoleName.foregroundTone(bgTone, nContrast)
      let fInitialTone = fartherRecipe.tone(scheme)
      var fTone = ratioOfTones(bgTone, fInitialTone) >= fContrast
        ? fInitialTone : RoleName.foregroundTone(bgTone, fContrast)
      if decreasingContrast {
        nTone = RoleName.foregroundTone(bgTone, nContrast)
        fTone = RoleName.foregroundTone(bgTone, fContrast)
      }
      if (fTone - nTone) * expansionDir >= pair.delta {
        // constraint already satisfied
      } else {
        fTone = clampDouble(0, 100, nTone + pair.delta * expansionDir)
        if (fTone - nTone) * expansionDir >= pair.delta {
          // satisfied after expanding farther
        } else {
          nTone = clampDouble(0, 100, fTone - pair.delta * expansionDir)
        }
      }
      if 50 <= nTone && nTone < 60 {
        if expansionDir > 0 {
          nTone = 60
          fTone = jsMax(fTone, nTone + pair.delta * expansionDir)
        } else {
          nTone = 49
          fTone = jsMin(fTone, nTone + pair.delta * expansionDir)
        }
      } else if 50 <= fTone && fTone < 60 {
        if pair.stayTogether {
          if expansionDir > 0 {
            nTone = 60
            fTone = jsMax(fTone, nTone + pair.delta * expansionDir)
          } else {
            nTone = 49
            fTone = jsMin(fTone, nTone + pair.delta * expansionDir)
          }
        } else if expansionDir > 0 {
          fTone = 60
        } else {
          fTone = 49
        }
      }
      return amNearer ? nTone : fTone
    }

    var answer = recipe.tone(scheme)
    guard let background = recipe.background else { return answer }
    let bgTone = background(scheme).tone(in: scheme)
    let desiredRatio = recipe.contrastCurve!.get(scheme.contrastLevel)
    if ratioOfTones(bgTone, answer) >= desiredRatio {
      // already contrasts enough
    } else {
      answer = RoleName.foregroundTone(bgTone, desiredRatio)
    }
    if decreasingContrast { answer = RoleName.foregroundTone(bgTone, desiredRatio) }
    if recipe.isBackground && 50 <= answer && answer < 60 {
      answer = ratioOfTones(49, bgTone) >= desiredRatio ? 49 : 60
    }
    if let secondBackground = recipe.secondBackground {
      let bgTone1 = background(scheme).tone(in: scheme)
      let bgTone2 = secondBackground(scheme).tone(in: scheme)
      let upper = jsMax(bgTone1, bgTone2)
      let lower = jsMin(bgTone1, bgTone2)
      if ratioOfTones(upper, answer) >= desiredRatio && ratioOfTones(lower, answer) >= desiredRatio {
        return answer
      }
      let lightOption = lighterTone(upper, desiredRatio)
      let darkOption = darkerTone(lower, desiredRatio)
      var availables: [Double] = []
      if lightOption != -1 { availables.append(lightOption) }
      if darkOption != -1 { availables.append(darkOption) }
      let prefersLight =
        RoleName.tonePrefersLightForeground(bgTone1) || RoleName.tonePrefersLightForeground(bgTone2)
      if prefersLight { return lightOption < 0 ? 100 : lightOption }
      if availables.count == 1 { return availables[0] }
      return darkOption < 0 ? 0 : darkOption
    }
    return answer
  }

  static func foregroundTone(_ bgTone: Double, _ ratio: Double) -> Double {
    let lighter = lighterToneUnsafe(bgTone, ratio)
    let darker = darkerToneUnsafe(bgTone, ratio)
    let lighterRatio = ratioOfTones(lighter, bgTone)
    let darkerRatio = ratioOfTones(darker, bgTone)
    if tonePrefersLightForeground(bgTone) {
      let negligibleDifference =
        abs(lighterRatio - darkerRatio) < 0.1 && lighterRatio < ratio && darkerRatio < ratio
      return lighterRatio >= ratio || lighterRatio >= darkerRatio || negligibleDifference
        ? lighter : darker
    }
    return darkerRatio >= ratio || darkerRatio >= lighterRatio ? darker : lighter
  }

  static func tonePrefersLightForeground(_ tone: Double) -> Bool { jsRound(tone) < 60.0 }
  static func toneAllowsLightForeground(_ tone: Double) -> Bool { jsRound(tone) <= 49.0 }
  static func enableLightForeground(_ tone: Double) -> Double {
    tonePrefersLightForeground(tone) && !toneAllowsLightForeground(tone) ? 49.0 : tone
  }
}
