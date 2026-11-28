// Port of src/theme/color-engine/color-roles.ts (Material Color Utilities'
// MaterialDynamicColors, Apache-2.0): each role's recipe. The role NAMES are generated
// (`RoleName`); the recipes are code, so they are ported, and the goldens prove them.
import Foundation

private func isFidelity(_ s: DynamicScheme) -> Bool { s.variant == .fidelity || s.variant == .content }
private func isMonochrome(_ s: DynamicScheme) -> Bool { s.variant == .monochrome }

private func findDesiredChromaByTone(
  _ hue: Double, _ chroma: Double, _ tone: Double, _ byDecreasingTone: Bool
) -> Double {
  var answer = tone
  var closestToChroma = Hct.from(hue, chroma, tone)
  if closestToChroma.chroma < chroma {
    var chromaPeak = closestToChroma.chroma
    while closestToChroma.chroma < chroma {
      answer += byDecreasingTone ? -1.0 : 1.0
      let potentialSolution = Hct.from(hue, chroma, answer)
      if chromaPeak > potentialSolution.chroma { break }
      if abs(potentialSolution.chroma - chroma) < 0.4 { break }
      let potentialDelta = abs(potentialSolution.chroma - chroma)
      let currentDelta = abs(closestToChroma.chroma - chroma)
      if potentialDelta < currentDelta { closestToChroma = potentialSolution }
      chromaPeak = jsMax(chromaPeak, potentialSolution.chroma)
    }
  }
  return answer
}

private func highestSurface(_ s: DynamicScheme) -> RoleName { s.isDark ? .surfaceBright : .surfaceDim }

extension RoleName {
  var recipe: RoleRecipe {
    switch self {
    // ---- palette key colours ----
    case .primaryPaletteKeyColor:
      return RoleRecipe(palette: { $0.primaryPalette }, tone: { $0.primaryPalette.keyColor.tone })
    case .secondaryPaletteKeyColor:
      return RoleRecipe(palette: { $0.secondaryPalette }, tone: { $0.secondaryPalette.keyColor.tone })
    case .tertiaryPaletteKeyColor:
      return RoleRecipe(palette: { $0.tertiaryPalette }, tone: { $0.tertiaryPalette.keyColor.tone })
    case .neutralPaletteKeyColor:
      return RoleRecipe(palette: { $0.neutralPalette }, tone: { $0.neutralPalette.keyColor.tone })
    case .neutralVariantPaletteKeyColor:
      return RoleRecipe(
        palette: { $0.neutralVariantPalette }, tone: { $0.neutralVariantPalette.keyColor.tone })

    // ---- surfaces ----
    case .background:
      return RoleRecipe(palette: { $0.neutralPalette }, tone: { $0.isDark ? 6 : 98 }, isBackground: true)
    case .onBackground:
      return RoleRecipe(
        palette: { $0.neutralPalette }, tone: { $0.isDark ? 90 : 10 },
        background: { _ in .background }, contrastCurve: ContrastCurve(3, 3, 4.5, 7))
    case .surface:
      return RoleRecipe(palette: { $0.neutralPalette }, tone: { $0.isDark ? 6 : 98 }, isBackground: true)
    case .surfaceDim:
      return RoleRecipe(
        palette: { $0.neutralPalette },
        tone: { s in s.isDark ? 6 : ContrastCurve(87, 87, 80, 75).get(s.contrastLevel) },
        isBackground: true)
    case .surfaceBright:
      return RoleRecipe(
        palette: { $0.neutralPalette },
        tone: { s in s.isDark ? ContrastCurve(24, 24, 29, 34).get(s.contrastLevel) : 98 },
        isBackground: true)
    case .surfaceContainerLowest:
      return RoleRecipe(
        palette: { $0.neutralPalette },
        tone: { s in s.isDark ? ContrastCurve(4, 4, 2, 0).get(s.contrastLevel) : 100 },
        isBackground: true)
    case .surfaceContainerLow:
      return RoleRecipe(
        palette: { $0.neutralPalette },
        tone: { s in
          s.isDark
            ? ContrastCurve(10, 10, 11, 12).get(s.contrastLevel)
            : ContrastCurve(96, 96, 96, 95).get(s.contrastLevel)
        },
        isBackground: true)
    case .surfaceContainer:
      return RoleRecipe(
        palette: { $0.neutralPalette },
        tone: { s in
          s.isDark
            ? ContrastCurve(12, 12, 16, 20).get(s.contrastLevel)
            : ContrastCurve(94, 94, 92, 90).get(s.contrastLevel)
        },
        isBackground: true)
    case .surfaceContainerHigh:
      return RoleRecipe(
        palette: { $0.neutralPalette },
        tone: { s in
          s.isDark
            ? ContrastCurve(17, 17, 21, 25).get(s.contrastLevel)
            : ContrastCurve(92, 92, 88, 85).get(s.contrastLevel)
        },
        isBackground: true)
    case .surfaceContainerHighest:
      return RoleRecipe(
        palette: { $0.neutralPalette },
        tone: { s in
          s.isDark
            ? ContrastCurve(22, 22, 26, 30).get(s.contrastLevel)
            : ContrastCurve(90, 90, 84, 80).get(s.contrastLevel)
        },
        isBackground: true)
    case .onSurface:
      return RoleRecipe(
        palette: { $0.neutralPalette }, tone: { $0.isDark ? 90 : 10 },
        background: highestSurface, contrastCurve: ContrastCurve(4.5, 7, 11, 21))
    case .surfaceVariant:
      return RoleRecipe(
        palette: { $0.neutralVariantPalette }, tone: { $0.isDark ? 30 : 90 }, isBackground: true)
    case .onSurfaceVariant:
      return RoleRecipe(
        palette: { $0.neutralVariantPalette }, tone: { $0.isDark ? 80 : 30 },
        background: highestSurface, contrastCurve: ContrastCurve(3, 4.5, 7, 11))
    case .inverseSurface:
      return RoleRecipe(palette: { $0.neutralPalette }, tone: { $0.isDark ? 90 : 20 })
    case .inverseOnSurface:
      return RoleRecipe(
        palette: { $0.neutralPalette }, tone: { $0.isDark ? 20 : 95 },
        background: { _ in .inverseSurface }, contrastCurve: ContrastCurve(4.5, 7, 11, 21))
    case .outline:
      return RoleRecipe(
        palette: { $0.neutralVariantPalette }, tone: { $0.isDark ? 60 : 50 },
        background: highestSurface, contrastCurve: ContrastCurve(1.5, 3, 4.5, 7))
    case .outlineVariant:
      return RoleRecipe(
        palette: { $0.neutralVariantPalette }, tone: { $0.isDark ? 30 : 80 },
        background: highestSurface, contrastCurve: ContrastCurve(1, 1, 3, 4.5))
    case .shadow:
      return RoleRecipe(palette: { $0.neutralPalette }, tone: { _ in 0 })
    case .scrim:
      return RoleRecipe(palette: { $0.neutralPalette }, tone: { _ in 0 })
    case .surfaceTint:
      return RoleRecipe(palette: { $0.primaryPalette }, tone: { $0.isDark ? 80 : 40 }, isBackground: true)

    // ---- primary ----
    case .primary:
      return RoleRecipe(
        palette: { $0.primaryPalette },
        tone: { s in isMonochrome(s) ? (s.isDark ? 100 : 0) : s.isDark ? 80 : 40 },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .primaryContainer, roleB: .primary, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onPrimary:
      return RoleRecipe(
        palette: { $0.primaryPalette },
        tone: { s in isMonochrome(s) ? (s.isDark ? 10 : 90) : s.isDark ? 20 : 100 },
        background: { _ in .primary }, contrastCurve: ContrastCurve(4.5, 7, 11, 21))
    case .primaryContainer:
      return RoleRecipe(
        palette: { $0.primaryPalette },
        tone: { s in
          if isFidelity(s) { return s.sourceColorHct.tone }
          if isMonochrome(s) { return s.isDark ? 85 : 25 }
          return s.isDark ? 30 : 90
        },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .primaryContainer, roleB: .primary, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onPrimaryContainer:
      return RoleRecipe(
        palette: { $0.primaryPalette },
        tone: { s in
          if isFidelity(s) { return RoleName.foregroundTone(RoleName.primaryContainer.recipe.tone(s), 4.5) }
          if isMonochrome(s) { return s.isDark ? 0 : 100 }
          return s.isDark ? 90 : 30
        },
        background: { _ in .primaryContainer }, contrastCurve: ContrastCurve(3, 4.5, 7, 11))
    case .inversePrimary:
      return RoleRecipe(
        palette: { $0.primaryPalette }, tone: { $0.isDark ? 40 : 80 },
        background: { _ in .inverseSurface }, contrastCurve: ContrastCurve(3, 4.5, 7, 7))

    // ---- secondary ----
    case .secondary:
      return RoleRecipe(
        palette: { $0.secondaryPalette }, tone: { $0.isDark ? 80 : 40 },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .secondaryContainer, roleB: .secondary, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onSecondary:
      return RoleRecipe(
        palette: { $0.secondaryPalette },
        tone: { s in isMonochrome(s) ? (s.isDark ? 10 : 100) : s.isDark ? 20 : 100 },
        background: { _ in .secondary }, contrastCurve: ContrastCurve(4.5, 7, 11, 21))
    case .secondaryContainer:
      return RoleRecipe(
        palette: { $0.secondaryPalette },
        tone: { s in
          let initialTone: Double = s.isDark ? 30 : 90
          if isMonochrome(s) { return s.isDark ? 30 : 85 }
          if !isFidelity(s) { return initialTone }
          return findDesiredChromaByTone(
            s.secondaryPalette.hue, s.secondaryPalette.chroma, initialTone, !s.isDark)
        },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .secondaryContainer, roleB: .secondary, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onSecondaryContainer:
      return RoleRecipe(
        palette: { $0.secondaryPalette },
        tone: { s in
          if isMonochrome(s) { return s.isDark ? 90 : 10 }
          if !isFidelity(s) { return s.isDark ? 90 : 30 }
          return RoleName.foregroundTone(RoleName.secondaryContainer.recipe.tone(s), 4.5)
        },
        background: { _ in .secondaryContainer }, contrastCurve: ContrastCurve(3, 4.5, 7, 11))

    // ---- tertiary ----
    case .tertiary:
      return RoleRecipe(
        palette: { $0.tertiaryPalette },
        tone: { s in isMonochrome(s) ? (s.isDark ? 90 : 25) : s.isDark ? 80 : 40 },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .tertiaryContainer, roleB: .tertiary, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onTertiary:
      return RoleRecipe(
        palette: { $0.tertiaryPalette },
        tone: { s in isMonochrome(s) ? (s.isDark ? 10 : 90) : s.isDark ? 20 : 100 },
        background: { _ in .tertiary }, contrastCurve: ContrastCurve(4.5, 7, 11, 21))
    case .tertiaryContainer:
      return RoleRecipe(
        palette: { $0.tertiaryPalette },
        tone: { s in
          if isMonochrome(s) { return s.isDark ? 60 : 49 }
          if !isFidelity(s) { return s.isDark ? 30 : 90 }
          let proposedHct = s.tertiaryPalette.getHct(s.sourceColorHct.tone)
          return fixIfDisliked(proposedHct).tone
        },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .tertiaryContainer, roleB: .tertiary, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onTertiaryContainer:
      return RoleRecipe(
        palette: { $0.tertiaryPalette },
        tone: { s in
          if isMonochrome(s) { return s.isDark ? 0 : 100 }
          if !isFidelity(s) { return s.isDark ? 90 : 30 }
          return RoleName.foregroundTone(RoleName.tertiaryContainer.recipe.tone(s), 4.5)
        },
        background: { _ in .tertiaryContainer }, contrastCurve: ContrastCurve(3, 4.5, 7, 11))

    // ---- error ----
    case .error:
      return RoleRecipe(
        palette: { $0.errorPalette }, tone: { $0.isDark ? 80 : 40 },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .errorContainer, roleB: .error, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onError:
      return RoleRecipe(
        palette: { $0.errorPalette }, tone: { $0.isDark ? 20 : 100 },
        background: { _ in .error }, contrastCurve: ContrastCurve(4.5, 7, 11, 21))
    case .errorContainer:
      return RoleRecipe(
        palette: { $0.errorPalette }, tone: { $0.isDark ? 30 : 90 },
        isBackground: true, background: highestSurface, contrastCurve: ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: { _ in ToneDeltaPair(roleA: .errorContainer, roleB: .error, delta: 10, polarity: .nearer, stayTogether: false) })
    case .onErrorContainer:
      return RoleRecipe(
        palette: { $0.errorPalette },
        tone: { s in isMonochrome(s) ? (s.isDark ? 90 : 10) : s.isDark ? 90 : 30 },
        background: { _ in .errorContainer }, contrastCurve: ContrastCurve(3, 4.5, 7, 11))
    }
  }
}
