// CLDR's cardinal plural rules (CLDR 48, what `Intl.PluralRules` answers), for the languages
// below; any other is `other` (CLDR's root). Foundation has no public plural-rules API, so the
// rules are written out here, the same on every platform, and tested against Node's answers.
import Foundation

/// The CLDR plural category of `n` in `locale` (`""`: the preferred locale).
func pluralCategory(_ n: Double, _ locale: String) -> String {
  let tag = locale.isEmpty ? preferredLocale() : locale
  let parts = tag.lowercased().split("-")
  let language = parts.first ?? ""
  let op = PluralOperands(n)
  return rule(language, region: parts.count > 1 ? parts[1] : "")(op)
}

/// CLDR's operands of a number: `n` (its magnitude), `i` (the integer digits), `v` (how many
/// fraction digits are written), `f` and `t` (the fraction digits, with and without trailing zeros).
struct PluralOperands {
  let n: Double
  let i: Int
  let v: Int
  let f: Int
  let t: Int

  init(_ value: Double) {
    let magnitude = Swift.abs(value)
    n = magnitude
    // JS writes the number as `String(n)` does before the rules read it.
    let text = stringOfNumber(magnitude)
    if text.contains("e") || !text.contains(".") {
      i = clampedInt(magnitude.rounded(.towardZero))
      v = 0
      f = 0
      t = 0
    } else {
      let pieces = text.split(".")
      i = Int(pieces[0]) ?? 0
      let fraction = pieces[1]
      v = fraction.count
      f = Int(fraction.prefix(9)) ?? 0
      let trimmed = String(fraction.reversed().drop { $0 == "0" }.reversed())
      t = Int(trimmed.prefix(9)) ?? 0
    }
  }

  /// `n` is the integer `k`.
  func nIs(_ k: Double) -> Bool { n == k }

  /// `n % m` is an integer in `range` (CLDR's `n % m = a..b` on a decimal is never true).
  func nMod(_ m: Double, in range: ClosedRange<Int>) -> Bool {
    let r = n.truncatingRemainder(dividingBy: m)
    return r == r.rounded() && range.contains(Int(r))
  }

  func nIn(_ range: ClosedRange<Int>) -> Bool { n == n.rounded() && n <= 1e9 && range.contains(Int(n)) }
}

private typealias Rule = (PluralOperands) -> String

private func rule(_ language: String, region: String) -> Rule {
  let millions: (PluralOperands) -> Bool = { $0.i != 0 && $0.i % 1_000_000 == 0 && $0.v == 0 }
  switch language {
  case "en", "de", "nl", "sv", "fi", "et", "gl", "ur", "sw", "ast", "fy":
    return { $0.i == 1 && $0.v == 0 ? "one" : "other" }
  case "es":
    return { $0.nIs(1) ? "one" : millions($0) ? "many" : "other" }
  case "it", "ca", "vec":
    return { $0.i == 1 && $0.v == 0 ? "one" : millions($0) ? "many" : "other" }
  case "pt":
    if region == "pt" { return { $0.i == 1 && $0.v == 0 ? "one" : millions($0) ? "many" : "other" } }
    return { $0.i == 0 || $0.i == 1 ? "one" : millions($0) ? "many" : "other" }
  case "fr":
    return { $0.i == 0 || $0.i == 1 ? "one" : millions($0) ? "many" : "other" }
  case "ja", "zh", "ko", "id", "vi", "th", "ms", "my", "lo", "km", "yue", "jv", "su":
    return { _ in "other" }
  case "ar":
    return { o in
      if o.nIs(0) { return "zero" }
      if o.nIs(1) { return "one" }
      if o.nIs(2) { return "two" }
      if o.nMod(100, in: 3...10) { return "few" }
      if o.nMod(100, in: 11...99) { return "many" }
      return "other"
    }
  case "ru", "uk":
    return { o in
      guard o.v == 0 else { return "other" }
      if o.i % 10 == 1 && o.i % 100 != 11 { return "one" }
      if (2...4).contains(o.i % 10) && !(12...14).contains(o.i % 100) { return "few" }
      return "many"
    }
  case "be":
    return { o in
      if o.nMod(10, in: 1...1) && !o.nMod(100, in: 11...11) { return "one" }
      if o.nMod(10, in: 2...4) && !o.nMod(100, in: 12...14) { return "few" }
      if o.nMod(10, in: 0...0) || o.nMod(10, in: 5...9) || o.nMod(100, in: 11...14) { return "many" }
      return "other"
    }
  case "pl":
    return { o in
      if o.i == 1 && o.v == 0 { return "one" }
      guard o.v == 0 else { return "other" }
      if (2...4).contains(o.i % 10) && !(12...14).contains(o.i % 100) { return "few" }
      return "many"
    }
  case "cs", "sk":
    return { o in
      if o.i == 1 && o.v == 0 { return "one" }
      if (2...4).contains(o.i) && o.v == 0 { return "few" }
      if o.v != 0 { return "many" }
      return "other"
    }
  case "he", "iw":
    return { o in
      if (o.i == 1 && o.v == 0) || (o.i == 0 && o.v != 0) { return "one" }
      if o.i == 2 && o.v == 0 { return "two" }
      return "other"
    }
  case "hi", "bn", "fa", "gu", "kn", "mr", "zu", "am", "as":
    return { $0.i == 0 || $0.nIs(1) ? "one" : "other" }
  case "tr", "el", "hu", "bg", "nb", "no", "nn", "ka", "kk", "az", "uz", "eu", "sq", "ta", "te", "ml", "mn", "ne":
    return { $0.nIs(1) ? "one" : "other" }
  case "da":
    return { $0.nIs(1) || ($0.t != 0 && ($0.i == 0 || $0.i == 1)) ? "one" : "other" }
  case "ro", "mo":
    return { o in
      if o.i == 1 && o.v == 0 { return "one" }
      if o.v != 0 || o.nIs(0) || (!o.nIs(1) && o.nMod(100, in: 1...19)) { return "few" }
      return "other"
    }
  case "lt":
    return { o in
      if o.nMod(10, in: 1...1) && !o.nMod(100, in: 11...19) { return "one" }
      if o.nMod(10, in: 2...9) && !o.nMod(100, in: 11...19) { return "few" }
      if o.f != 0 { return "many" }
      return "other"
    }
  case "lv":
    return { o in
      if o.nMod(10, in: 0...0) || o.nMod(100, in: 11...19) || (o.v == 2 && (11...19).contains(o.f % 100)) { return "zero" }
      if (o.nMod(10, in: 1...1) && !o.nMod(100, in: 11...11)) || (o.v == 2 && o.f % 10 == 1 && o.f % 100 != 11)
        || (o.v != 2 && o.f % 10 == 1)
      {
        return "one"
      }
      return "other"
    }
  case "ga":
    return { o in
      if o.nIs(1) { return "one" }
      if o.nIs(2) { return "two" }
      if o.nIn(3...6) { return "few" }
      if o.nIn(7...10) { return "many" }
      return "other"
    }
  case "cy":
    return { o in
      if o.nIs(0) { return "zero" }
      if o.nIs(1) { return "one" }
      if o.nIs(2) { return "two" }
      if o.nIs(3) { return "few" }
      if o.nIs(6) { return "many" }
      return "other"
    }
  case "sl":
    return { o in
      if o.v == 0 && o.i % 100 == 1 { return "one" }
      if o.v == 0 && o.i % 100 == 2 { return "two" }
      if (o.v == 0 && (3...4).contains(o.i % 100)) || o.v != 0 { return "few" }
      return "other"
    }
  case "hr", "sr", "bs", "sh":
    return { o in
      if (o.v == 0 && o.i % 10 == 1 && o.i % 100 != 11) || (o.f % 10 == 1 && o.f % 100 != 11) { return "one" }
      if (o.v == 0 && (2...4).contains(o.i % 10) && !(12...14).contains(o.i % 100))
        || ((2...4).contains(o.f % 10) && !(12...14).contains(o.f % 100))
      {
        return "few"
      }
      return "other"
    }
  default:
    return { _ in "other" }
  }
}
