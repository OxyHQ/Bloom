// JavaScript's number semantics where Swift's differ, so the port computes and prints exactly
// what the TypeScript engine does. Every `Math.round`, `toFixed`, `String(number)`, `parseFloat`
// and `parseInt` in src/theme goes through one of these.
import Foundation

/// ECMAScript `Math.round`: the nearest integer, ties toward +infinity (Swift's `.rounded()` takes
/// ties away from zero, so `-2.5` would give `-3` where JavaScript gives `-2`). Not `floor(x + 0.5)`
/// either, which is wrong for `0.49999999999999994`.
@inline(__always)
func jsRound(_ x: Double) -> Double {
  if !x.isFinite { return x }
  let down = x.rounded(.down)
  let result = x - down >= 0.5 ? down + 1 : down
  // Math.round(-0.4) is -0, which matters only to division, kept for fidelity.
  return result == 0 && x.sign == .minus ? -0.0 : result
}

/// `Math.round(x)` as an integer, for a value known to be finite and in range.
@inline(__always)
func jsRoundInt(_ x: Double) -> Int { Int(jsRound(x)) }

/// ECMAScript `Number::toString(10)`: the shortest digits that round-trip, written the way
/// JavaScript writes them (`1`, not Swift's `1.0`; `0.00001`, not `1e-05`; `1e+21`).
public func jsNumberString(_ value: Double) -> String {
  if value.isNaN { return "NaN" }
  if value == 0 { return "0" }
  if value.isInfinite { return value < 0 ? "-Infinity" : "Infinity" }
  let negative = value < 0
  // Swift's description is also the shortest round-tripping digit string (and the closest
  // of those to the value), so only the layout differs.
  let text = (negative ? -value : value).description
  var mantissa = text
  var exponent = 0
  if let e = text.firstIndex(where: { $0 == "e" || $0 == "E" }) {
    mantissa = String(text[..<e])
    exponent = Int(text[text.index(after: e)...]) ?? 0
  }
  var digits: String
  var pointPosition: Int  // digits before the decimal point in `mantissa`
  if let dot = mantissa.firstIndex(of: ".") {
    let whole = String(mantissa[..<dot])
    let fraction = String(mantissa[mantissa.index(after: dot)...])
    digits = whole + fraction
    pointPosition = whole.count
  } else {
    digits = mantissa
    pointPosition = mantissa.count
  }
  // Strip leading zeros (moving the point) and trailing zeros.
  while digits.count > 1, digits.first == "0" {
    digits.removeFirst()
    pointPosition -= 1
  }
  while digits.count > 1, digits.last == "0" { digits.removeLast() }
  let k = digits.count
  let n = pointPosition + exponent  // value = 0.digits × 10^n
  var out: String
  if k <= n && n <= 21 {
    out = digits + String(repeating: "0", count: n - k)
  } else if 0 < n && n <= 21 {
    let i = digits.index(digits.startIndex, offsetBy: n)
    out = digits[..<i] + "." + digits[i...]
  } else if -6 < n && n <= 0 {
    out = "0." + String(repeating: "0", count: -n) + digits
  } else {
    let e = n - 1
    let sign = e < 0 ? "-" : "+"
    let head = String(digits.first!)
    let tail = k == 1 ? "" : "." + digits.dropFirst()
    out = head + tail + "e" + sign + String(abs(e))
  }
  return negative ? "-" + out : out
}

/// ECMAScript `Number.prototype.toFixed(digits)` for a finite value below 1e21: the decimal
/// nearest the exact double, an exact tie going to the larger magnitude (C's `%.*f`, which is
/// otherwise exact, breaks ties to even).
func jsToFixed(_ value: Double, _ digits: Int) -> String {
  precondition(value.isFinite && abs(value) < 1e21 && digits >= 0 && digits <= 20)
  let negative = value < 0
  let magnitude = abs(value)
  let scale = pow(10.0, Double(digits))  // 10^digits is exact in a double up to 10^22
  let scaled = magnitude * scale
  let below = scaled.rounded(.down)
  // An exact tie is k + 0.5 with no rounding in the product, which `fma` measures.
  if scaled - below == 0.5, fma(magnitude, scale, -scaled) == 0 {
    var text = String(format: "%.0f", below + 1)
    if digits > 0 {
      if text.count <= digits { text = String(repeating: "0", count: digits - text.count + 1) + text }
      text.insert(".", at: text.index(text.endIndex, offsetBy: -digits))
    }
    return (negative ? "-" : "") + text
  }
  return String(format: "%.\(digits)f", value)
}

/// ECMAScript `parseFloat`: the longest prefix (after leading whitespace) that is a decimal
/// literal, or NaN.
func jsParseFloat(_ text: String) -> Double {
  let scalars = Array(text.unicodeScalars.drop(while: { jsWhitespace($0) }))
  var i = 0
  var literal = ""
  if i < scalars.count, scalars[i] == "+" || scalars[i] == "-" {
    literal.unicodeScalars.append(scalars[i])
    i += 1
  }
  let rest = String(String.UnicodeScalarView(scalars[i...]))
  if rest.hasPrefix("Infinity") { return literal == "-" ? -.infinity : .infinity }
  let isDigit: (Unicode.Scalar) -> Bool = { $0.value >= 48 && $0.value <= 57 }
  var sawDigit = false
  while i < scalars.count, isDigit(scalars[i]) {
    literal.unicodeScalars.append(scalars[i]); i += 1; sawDigit = true
  }
  if i < scalars.count, scalars[i] == "." {
    var j = i + 1
    var fraction = ""
    while j < scalars.count, isDigit(scalars[j]) { fraction.unicodeScalars.append(scalars[j]); j += 1 }
    if sawDigit || !fraction.isEmpty {
      literal += "." + fraction
      sawDigit = sawDigit || !fraction.isEmpty
      i = j
    }
  }
  if !sawDigit { return .nan }
  if i < scalars.count, scalars[i] == "e" || scalars[i] == "E" {
    var j = i + 1
    var exponent = "e"
    if j < scalars.count, scalars[j] == "+" || scalars[j] == "-" {
      exponent.unicodeScalars.append(scalars[j]); j += 1
    }
    var expDigits = false
    while j < scalars.count, isDigit(scalars[j]) {
      exponent.unicodeScalars.append(scalars[j]); j += 1; expDigits = true
    }
    if expDigits { literal += exponent }
  }
  if literal.hasSuffix(".") { literal += "0" }
  if let dot = literal.firstIndex(of: "."), dot == literal.startIndex
    || (literal.index(after: literal.startIndex) == dot && (literal.first == "-" || literal.first == "+"))
  {
    literal.insert("0", at: dot)
  }
  return Double(literal) ?? .nan
}

/// ECMAScript `Number(string)` for the strings a colour parser sees: the whole trimmed text
/// must be a decimal literal (`""` is 0), `Infinity`, or a `0x`/`0o`/`0b` integer, else NaN.
func jsNumber(_ text: String) -> Double {
  let trimmed = jsTrim(text)
  if trimmed.isEmpty { return 0 }
  switch trimmed {
  case "Infinity", "+Infinity": return .infinity
  case "-Infinity": return -.infinity
  default: break
  }
  let lower = trimmed.lowercased()
  for (prefix, radix) in [("0x", 16), ("0o", 8), ("0b", 2)] where lower.hasPrefix(prefix) {
    guard let v = UInt64(lower.dropFirst(2), radix: radix) else { return .nan }
    return Double(v)
  }
  guard isFullDecimalLiteral(trimmed) else { return .nan }
  var literal = trimmed
  if literal.hasSuffix(".") { literal += "0" }
  return Double(literal) ?? jsParseFloat(literal)
}

/// ECMAScript `parseInt(text, 10)` for a colour channel: leading whitespace, a sign, the
/// leading decimal digits; NaN when there are none.
func jsParseInt10(_ text: String) -> Double {
  let scalars = Array(text.unicodeScalars.drop(while: { jsWhitespace($0) }))
  var i = 0
  var negative = false
  if i < scalars.count, scalars[i] == "+" || scalars[i] == "-" {
    negative = scalars[i] == "-"
    i += 1
  }
  var value = 0.0
  var any = false
  while i < scalars.count, scalars[i].value >= 48, scalars[i].value <= 57 {
    value = value * 10 + Double(scalars[i].value - 48)
    any = true
    i += 1
  }
  if !any { return .nan }
  return negative ? -value : value
}

/// The white space `parseFloat`/`trim` skip (StrWhiteSpaceChar).
func jsWhitespace(_ s: Unicode.Scalar) -> Bool {
  switch s.value {
  case 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x20, 0xA0, 0x1680, 0x2000...0x200A, 0x2028, 0x2029,
    0x202F, 0x205F, 0x3000, 0xFEFF:
    return true
  default:
    return false
  }
}

/// `String.prototype.trim`.
func jsTrim(_ text: String) -> String {
  let scalars = text.unicodeScalars
  guard let start = scalars.firstIndex(where: { !jsWhitespace($0) }) else { return "" }
  let end = scalars.lastIndex(where: { !jsWhitespace($0) })!
  return String(scalars[start...end])
}

/// `String.prototype.trimStart`.
func jsTrimStart(_ text: String) -> String {
  String(String.UnicodeScalarView(text.unicodeScalars.drop(while: { jsWhitespace($0) })))
}

/// ECMAScript `ToInt32`, what `x & 255` applies to a double first.
func jsInt32(_ x: Double) -> Int {
  guard x.isFinite else { return 0 }
  let truncated = x.rounded(.towardZero)
  let modulo = truncated.truncatingRemainder(dividingBy: 4_294_967_296)
  var value = modulo < 0 ? modulo + 4_294_967_296 : modulo
  if value >= 2_147_483_648 { value -= 4_294_967_296 }
  return Int(value)
}

/// Whether all of `s` is a StrDecimalLiteral (`1`, `1.`, `.5`, `-2e3`).
private func isFullDecimalLiteral(_ s: String) -> Bool {
  var chars = Array(s.unicodeScalars)[...]
  func isDigit(_ c: Unicode.Scalar) -> Bool { c.value >= 48 && c.value <= 57 }
  if let first = chars.first, first == "+" || first == "-" { chars = chars.dropFirst() }
  var digits = 0
  while let c = chars.first, isDigit(c) { chars = chars.dropFirst(); digits += 1 }
  if chars.first == "." {
    chars = chars.dropFirst()
    while let c = chars.first, isDigit(c) { chars = chars.dropFirst(); digits += 1 }
  }
  if digits == 0 { return false }
  if let e = chars.first, e == "e" || e == "E" {
    chars = chars.dropFirst()
    if let sign = chars.first, sign == "+" || sign == "-" { chars = chars.dropFirst() }
    var exponent = 0
    while let c = chars.first, isDigit(c) { chars = chars.dropFirst(); exponent += 1 }
    if exponent == 0 { return false }
  }
  return chars.isEmpty
}
