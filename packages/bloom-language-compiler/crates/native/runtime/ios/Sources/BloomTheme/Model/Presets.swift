// The types the generated preset registry is written in (src/theme/color-presets.ts), and the
// lookups the TypeScript derives from it. The VALUES are generated: Generated/Presets.generated.swift.
import Foundation

/// `ColorPresetGate`: why a preset is not offered to everyone. Absent means free.
public enum ColorPresetGate: String, Codable, Sendable, Hashable {
  /// Reserved for the account whose brand it is.
  case handle
  /// Sold with a subscription.
  case premium
}

/// `ColorPresetPairing`.
public enum ColorPresetPairing: String, Codable, Sendable, Hashable {
  case derived
  case curated
}

/// A preset's forced label (`label: 'white'`).
public enum PresetLabel: String, Codable, Sendable, Hashable {
  case white
}

/// `ColorPresetFamilyDefinition`.
public struct ColorPresetFamilyDefinition: Sendable, Hashable {
  public let name: ColorPresetFamily
  public let displayName: String
  public let description: String
}

/// `PresetTokenOverrides`: a drawn brand scheme per mode, `#rrggbb` by canonical token.
public struct PresetTokenOverrides: Sendable, Hashable {
  public let light: [TokenPair]?
  public let dark: [TokenPair]?

  public func tokens(for mode: ColorMode) -> [TokenPair]? { mode == .dark ? dark : light }
}

/// `ColorPresetRecipe` (and `AppColorPreset`, its older subset): one preset's seed recipe.
public struct ColorPresetRecipe: Sendable, Hashable {
  public let name: AppColorName
  public let displayName: String
  public let family: ColorPresetFamily
  public let description: String
  /// The identity seed, `#rrggbb`.
  public let hex: String
  public let variant: SchemeVariant
  public let secondaryHex: String?
  /// The standout action seed: `tertiary` owns FABs and compose actions.
  public let tertiaryHex: String?
  public let pairing: ColorPresetPairing
  public let featured: Bool
  public let label: PresetLabel?
  public let gate: ColorPresetGate?
  /// Authored per-mode values that win over the engine's derivation.
  public let tokens: PresetTokenOverrides?
}

public typealias AppColorPreset = ColorPresetRecipe

/// `AccentHues`: the two accent hues a seed rotates to when nothing pins them.
public struct AccentHues: Sendable, Hashable {
  public let secondary: Double
  public let tertiary: Double
}

/// `ColorPresetGroup`.
public struct ColorPresetGroup: Sendable, Hashable {
  public let family: ColorPresetFamilyDefinition
  public let presets: [ColorPresetRecipe]
}

private let presetsByName: [AppColorName: ColorPresetRecipe] = Dictionary(
  uniqueKeysWithValues: BloomThemeData.colorPresetRegistry.map { ($0.name, $0) })

extension AppColorName {
  /// `APP_COLOR_PRESETS[name]`.
  public var preset: ColorPresetRecipe { presetsByName[self]! }

  /// `hexToAppColorName`: the preset a seed hex names, else `teal`.
  public static func named(hex: String) -> AppColorName {
    BloomThemeData.hexToAppColor[hex.lowercased()] ?? .teal
  }
}

extension BloomThemeData {
  /// `COLOR_PRESET_GROUPS`, in family order.
  public static var colorPresetGroups: [ColorPresetGroup] {
    colorPresetFamilyRegistry.map { family in
      ColorPresetGroup(family: family, presets: colorPresetRegistry.filter { $0.family == family.name })
    }
  }
}

/// `ProfileColor`: a persisted profile identity — a preset, or an exact seed.
public enum ProfileColor: Sendable, Hashable {
  case colorPreset(AppColorName)
  case seed(String)
}

/// `resolveProfileColor`: persisted names and legacy hex values; nil inherits the theme.
public func resolveProfileColor(_ value: String?) -> ProfileColor? {
  guard let value, !value.isEmpty else { return nil }
  let normalized = jsTrim(value).lowercased()
  let name = normalized == "amber" ? "yellow" : normalized
  if let preset = AppColorName(rawValue: name) { return .colorPreset(preset) }
  let hexDigits = Set("0123456789abcdef")
  if normalized.count == 7, normalized.first == "#", normalized.dropFirst().allSatisfy(hexDigits.contains) {
    return .seed(normalized)
  }
  if normalized.count == 4, normalized.first == "#", normalized.dropFirst().allSatisfy(hexDigits.contains) {
    return .seed("#" + normalized.dropFirst().map { "\($0)\($0)" }.joined())
  }
  return nil
}

/// `ThemeGradient`: ordered `[offset, color]` stops.
public struct ThemeGradient: Sendable, Hashable {
  public let values: [GradientStop]
}

public struct GradientStop: Sendable, Hashable {
  public let offset: Double
  public let color: String

  public init(_ offset: Double, _ color: String) {
    self.offset = offset
    self.color = color
  }
}

/// `LABEL_ALPHA`.
public struct LabelAlpha: Sendable, Hashable {
  public let label: Double
  public let secondary: Double
  public let tertiary: Double
  public let quaternary: Double
}
