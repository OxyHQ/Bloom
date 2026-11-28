// Internal plumbing: a lock-guarded value, UTF-16 helpers and JS's number grammar.
import Foundation

/// A value behind a lock (`Synchronization.Mutex` needs iOS 18; the package targets 17).
final class Locked<Value>: @unchecked Sendable {
  private let lock = NSLock()
  private var value: Value

  init(_ value: Value) { self.value = value }

  @discardableResult
  func withLock<R>(_ body: (inout Value) throws -> R) rethrows -> R {
    lock.lock()
    defer { lock.unlock() }
    return try body(&value)
  }
}

extension String {
  /// The string's characters (grapheme clusters): what Bloom's offsets count.
  var chars: [Character] { Array(self) }

  /// The string's UTF-16 code units (JS's view of a string).
  var units: [UInt16] { Array(utf16) }

  /// A string of UTF-16 code units (a lone surrogate becomes U+FFFD: Swift strings are
  /// well-formed, JS's need not be).
  init<C: Collection>(units: C) where C.Element == UInt16 {
    self = String(decoding: units, as: UTF16.self)
  }
}

/// The offset of `sub` in `s` at or after `from` (JS's `indexOf`, over any elements), or -1.
func unitIndex<E: Equatable>(_ s: [E], _ sub: [E], from: Int = 0) -> Int {
  let start = Swift.max(0, from)
  if sub.isEmpty { return Swift.min(start, s.count) }
  if sub.count > s.count { return -1 }
  var i = start
  while i + sub.count <= s.count {
    if s[i] == sub[0] {
      var j = 1
      while j < sub.count && s[i + j] == sub[j] { j += 1 }
      if j == sub.count { return i }
    }
    i += 1
  }
  return -1
}

/// The offset of the last `sub` in `s` (JS's `lastIndexOf`), or -1.
func unitLastIndex<E: Equatable>(_ s: [E], _ sub: [E]) -> Int {
  if sub.isEmpty { return s.count }
  if sub.count > s.count { return -1 }
  var i = s.count - sub.count
  while i >= 0 {
    if s[i..<(i + sub.count)].elementsEqual(sub) { return i }
    i -= 1
  }
  return -1
}

/// JS's `WhiteSpace` and `LineTerminator`: what `trim` removes and `Number` skips.
func isJSWhitespace(_ u: Unicode.Scalar) -> Bool {
  switch u.value {
  case 0x09...0x0D, 0x20, 0xA0, 0x1680, 0x2000...0x200A, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF:
    return true
  default:
    return false
  }
}

/// JS's `Number(text)`: `nil` where it is `NaN` (and for `""`, which `Number` reads as 0 but
/// Bloom's `toInt`/`toFloat` refuse).
func jsNumber(_ text: String) -> Double? {
  let scalars = Array(text.unicodeScalars)
  var lo = 0
  var hi = scalars.count
  while lo < hi && isJSWhitespace(scalars[lo]) { lo += 1 }
  while hi > lo && isJSWhitespace(scalars[hi - 1]) { hi -= 1 }
  if lo == hi { return nil }
  let s = String(String.UnicodeScalarView(scalars[lo..<hi]))
  let chars = Array(s.utf8)
  // 0x…, 0o…, 0b… (no sign).
  if chars.count > 2 && chars[0] == UInt8(ascii: "0") {
    let radix: Double?
    switch chars[1] {
    case UInt8(ascii: "x"), UInt8(ascii: "X"): radix = 16
    case UInt8(ascii: "o"), UInt8(ascii: "O"): radix = 8
    case UInt8(ascii: "b"), UInt8(ascii: "B"): radix = 2
    default: radix = nil
    }
    if let radix {
      var value = 0.0
      for c in chars[2...] {
        guard let d = hexDigit(c), Double(d) < radix else { return nil }
        value = value * radix + Double(d)
      }
      return value
    }
  }
  var i = 0
  var negative = false
  if chars[i] == UInt8(ascii: "+") || chars[i] == UInt8(ascii: "-") {
    negative = chars[i] == UInt8(ascii: "-")
    i += 1
  }
  if Array(chars[i...]) == Array("Infinity".utf8) { return negative ? -.infinity : .infinity }
  // DecimalDigits? (. DecimalDigits?)? ExponentPart?, with a digit somewhere before the exponent.
  var digits = 0
  while i < chars.count && isDigit(chars[i]) { i += 1; digits += 1 }
  if i < chars.count && chars[i] == UInt8(ascii: ".") {
    i += 1
    while i < chars.count && isDigit(chars[i]) { i += 1; digits += 1 }
  }
  if digits == 0 { return nil }
  if i < chars.count && (chars[i] == UInt8(ascii: "e") || chars[i] == UInt8(ascii: "E")) {
    i += 1
    if i < chars.count && (chars[i] == UInt8(ascii: "+") || chars[i] == UInt8(ascii: "-")) { i += 1 }
    var exponent = 0
    while i < chars.count && isDigit(chars[i]) { i += 1; exponent += 1 }
    if exponent == 0 { return nil }
  }
  if i != chars.count { return nil }
  return Double(s)
}

private func isDigit(_ c: UInt8) -> Bool { c >= UInt8(ascii: "0") && c <= UInt8(ascii: "9") }

func hexDigit(_ c: UInt8) -> Int? {
  switch c {
  case UInt8(ascii: "0")...UInt8(ascii: "9"): return Int(c - UInt8(ascii: "0"))
  case UInt8(ascii: "a")...UInt8(ascii: "f"): return Int(c - UInt8(ascii: "a")) + 10
  case UInt8(ascii: "A")...UInt8(ascii: "F"): return Int(c - UInt8(ascii: "A")) + 10
  default: return nil
  }
}

/// A `Double` as an `Int`, as JS code would hold it: NaN is 0 and out-of-range values clamp
/// (Swift's `Int(_:)` would trap).
func clampedInt(_ value: Double) -> Int {
  if value.isNaN { return 0 }
  if value >= 9.223372036854775807e18 { return Int.max }
  if value <= -9.223372036854775808e18 { return Int.min }
  return Int(value)
}
