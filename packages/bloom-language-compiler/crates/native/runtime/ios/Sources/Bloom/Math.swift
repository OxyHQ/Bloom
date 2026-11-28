// Bloom (math): the constants and members Math.bloom adds over `Double` and `Int`, and numbers
// written for a locale as `Intl.NumberFormat` writes them.
//
// `sqrt`, `pow`, `exp`, `log`, `log2`, `log10`, `sin`, `cos`, `tan`, `atan2` and `hypot` are
// Foundation's own free functions (the same IEEE results), and `Double.pi`, `isFinite` and
// `isNaN` are Swift's: nothing is declared for them here.
import Foundation

extension Double {
  /// Euler's number.
  public static let e: Double = M_E

  /// The square root (Bloom's property; Swift's method `squareRoot()` is the same value).
  public var squareRoot: Double { Foundation.sqrt(self) }

  /// The value with `digits` decimal places, as a person in `locale` writes it (`""`: the
  /// device's): `1234.5.formatted(digits: 1)` is `1,234.5` in English. Halves round away from
  /// zero, as `Intl` rounds. (Pass `digits:` or `locale:`: `formatted()` alone is Foundation's.)
  public func formatted(digits: Int = 0, locale: String = "") -> String { formatNumber(self, locale, digits, digits) }

  /// Compact (`1.2K`, `3.4M`), as a person in `locale` writes it.
  public func compact(locale: String = "") -> String { formatCompact(self, locale) }

  /// A uniformly distributed value in `from..<to`.
  public static func random(in from: Double, to: Double) -> Double { from + Double.random(in: 0..<1) * (to - from) }
}

extension Int {
  /// The value as a person in `locale` writes it (`1234` is `1,234` in English).
  public func formatted(locale: String) -> String { formatNumber(Double(self), locale, 0, 0) }

  /// Compact (`1.2K`, `3.4M`): how Mention shows counts.
  public func compact(locale: String = "") -> String { formatCompact(Double(self), locale) }

  /// Whether the value is even.
  public var isEven: Bool { self % 2 == 0 }

  /// A uniformly distributed integer in `from..<to` (`from` when the range is empty).
  public static func random(in from: Int, to: Int) -> Int { to > from ? Int.random(in: from..<to) : from }
}

/// `n.toLocaleString(locale, { minimumFractionDigits, maximumFractionDigits })`.
func formatNumber(_ n: Double, _ locale: String, _ minFraction: Int, _ maxFraction: Int) -> String {
  if n.isNaN { return "NaN" }
  let style = FloatingPointFormatStyle<Double>.number
    .precision(.fractionLength(minFraction...Swift.max(minFraction, maxFraction)))
    .rounded(rule: .toNearestOrAwayFromZero)
    .locale(foundationLocale(locale))
  return n.formatted(style)
}

/// `Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n)`.
func formatCompact(_ n: Double, _ locale: String) -> String {
  if n.isNaN { return "NaN" }
  let style = FloatingPointFormatStyle<Double>.number
    .notation(.compactName)
    .precision(.fractionLength(0...1))
    .rounded(rule: .toNearestOrAwayFromZero)
    .locale(foundationLocale(locale))
  return n.formatted(style)
}
