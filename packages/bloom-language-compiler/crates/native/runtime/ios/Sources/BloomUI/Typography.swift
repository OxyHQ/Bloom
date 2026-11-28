// Bloom's type on iOS, as today's Bloom draws it (src/typography): Inter for text steps,
// BlomusModernus for display and title steps, the type ramp's size, line height, tracking and
// weight, and a line height applied as React Native applies it on iOS (the extra space split
// above and below the glyphs).
#if canImport(SwiftUI)
import SwiftUI

/// A resolved text style: what a `Text` draws with.
public struct BloomTextStyle: Sendable, Equatable {
  public var family: String
  public var size: Double
  /// `nil`: the font's natural line height (a `Text` with no font).
  public var lineHeight: Double?
  public var tracking: Double
  public var weight: Int

  /// No font set: 13 pt Inter, its natural line height, regular (Typography.tsx).
  public static let `default` = BloomTextStyle(family: "Inter", size: 13, lineHeight: nil, tracking: 0, weight: 400)

  /// A ramp step at a weight (`headline` at 600 is `headline-semibold`), as tokens.ts picks it:
  /// a weight with no entry takes the regular entry and overrides only the weight.
  public static func step(_ font: Tokens.Font, weight: Int? = nil) -> BloomTextStyle {
    let family = font.rawValue
    let suffix: String = switch weight ?? defaultWeight(family) {
    case 500: "medium"
    case 600: "semibold"
    case 700: "bold"
    default: "regular"
    }
    if let step = Tokens.typeRamp["\(family)-\(suffix)"] ?? Tokens.typeRamp["\(family)-regular"] {
      return BloomTextStyle(
        family: face(family, weight: weight ?? step.weight), size: step.size, lineHeight: step.lineHeight,
        tracking: step.tracking, weight: weight ?? step.weight)
    }
    // A size rung (`.font(.lg)`): the size alone.
    var style = BloomTextStyle.default
    if let size = Double(fontSizeRung(family)) { style.size = size }
    if let weight { style.weight = weight }
    return style
  }

  /// The weight a step is written at when `.weight()` is not given (the ramp's first entry).
  static func defaultWeight(_ family: String) -> Int {
    for suffix in ["regular", "semibold", "medium", "bold"] {
      if let s = Tokens.typeRamp["\(family)-\(suffix)"] { return s.weight }
    }
    return 400
  }

  static func fontSizeRung(_ token: String) -> String {
    switch token {
    case "2xs": "10"
    case "xs": "12"
    case "sm": "13"
    case "md": "15"
    case "lg": "17"
    case "xl": "20"
    case "2xl": "22"
    case "3xl": "26"
    case "4xl": "32"
    case "5xl": "40"
    default: token
    }
  }

  /// The face of a step: display and title steps are BlomusModernus (its Bold above 500).
  static func face(_ family: String, weight: Int) -> String {
    let display = family.hasPrefix("large-title") || family.hasPrefix("display") || family.hasPrefix("title")
    if !display { return "Inter" }
    return weight > 500 ? "BlomusModernus-Bold" : "BlomusModernus-Regular"
  }

  /// SwiftUI's font for the style. Inter is one variable file: its weight is the axis.
  public var font: SwiftUI.Font {
    let base = SwiftUI.Font.custom(family, size: size)
    return family == "Inter" ? base.weight(Self.swiftWeight(weight)) : base
  }

  static func swiftWeight(_ w: Int) -> SwiftUI.Font.Weight {
    switch w {
    case ..<150: .ultraLight
    case ..<250: .thin
    case ..<350: .light
    case ..<450: .regular
    case ..<550: .medium
    case ..<650: .semibold
    case ..<750: .bold
    case ..<850: .heavy
    default: .black
    }
  }

  /// Inter's natural line height per point of size (hhea ascender 1984 + descender 494 over
  /// 2048 units per em). Measured against UIFont on the Mac lane before it is relied on.
  static let interLineRatio = (1984.0 + 494.0) / 2048.0

  /// The space added between lines, and above and below the text, so a line is `lineHeight`
  /// tall with the glyphs centred, as React Native's iOS text layout does it.
  public var leading: (between: Double, around: Double) {
    guard let lineHeight else { return (0, 0) }
    let natural = size * Self.interLineRatio
    let extra = max(0, lineHeight - natural)
    return (extra, extra / 2)
  }
}
#endif
