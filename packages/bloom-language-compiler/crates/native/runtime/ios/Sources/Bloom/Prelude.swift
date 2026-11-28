// The compiler's built-in members (`crates/lang/src/check/call.rs`, `method_names`), with
// Bloom's semantics, where Swift has no member of that name and meaning.
//
// Strings are measured in characters (grapheme clusters, Swift's own `count`). Collections
// are values: `appending`, `setting`, `removing` and the rest return a new one.
//
// Where Swift already has the member with Bloom's meaning, Swift's is used and nothing is
// declared here: `String.contains/lowercased/uppercased/hasPrefix/hasSuffix`,
// `Array.map/filter/compactMap/flatMap/reduce/contains/first/last/count/isEmpty/enumerated`,
// `Optional.map/flatMap`. A built-in whose Swift namesake means something else has another
// spelling (see `Renames.swift`): `Double.rounded()` is `bloomRounded()`.
import Foundation

// MARK: - String

// Offsets and lengths count characters (grapheme clusters, Swift's `Character`), as ADR 0003
// decided for every backend. The TS runtime still counts UTF-16 units: the two differ for
// text outside the BMP and for combined characters (`"👍🏽".slice(0, 1)` is the whole emoji
// here and half a surrogate pair on the web).

extension String {
  /// JS's `slice(start, end)` over characters: negative offsets count from the end, and
  /// offsets past the ends clamp.
  public func slice(_ start: Int, _ end: Int? = nil) -> String {
    let c = chars
    let (from, to) = sliceBounds(c.count, start, end)
    return from >= to ? "" : String(c[from..<to])
  }

  /// Whether the string starts with `prefix` (JS's `startsWith`; Swift's `hasPrefix`).
  public func startsWith(_ prefix: String) -> Bool { hasPrefix(prefix) }

  /// Whether the string ends with `suffix` (JS's `endsWith`; Swift's `hasSuffix`).
  public func endsWith(_ suffix: String) -> Bool { hasSuffix(suffix) }

  /// Leading and trailing whitespace and line terminators removed (JS's `trim`).
  public func trimmed() -> String {
    let scalars = unicodeScalars
    guard let first = scalars.firstIndex(where: { !isJSWhitespace($0) }) else { return "" }
    let last = scalars.lastIndex(where: { !isJSWhitespace($0) })!
    return String(scalars[first...last])
  }

  /// The parts between each `separator`, empty parts kept (JS's `split`): `"".split(",")` is
  /// `[""]`; an empty separator splits into characters.
  public func split(_ separator: String) -> [String] {
    if separator.isEmpty { return map { String($0) } }
    let s = chars
    let sep = separator.chars
    var out: [String] = []
    var from = 0
    while true {
      let at = unitIndex(s, sep, from: from)
      if at < 0 { break }
      out.append(String(s[from..<at]))
      from = at + sep.count
    }
    out.append(String(s[from...]))
    return out
  }

  /// Every `target` replaced with `replacement` (JS's `replaceAll` with a string pattern:
  /// `$$`, `$&`, `` $` `` and `$'` in `replacement` insert `$`, the match, and the text
  /// before and after it).
  public func replace(_ target: String, _ replacement: String) -> String {
    let s = chars
    let t = target.chars
    let r = replacement.chars
    var positions: [Int] = []
    var at = unitIndex(s, t, from: 0)
    while at >= 0 && at <= s.count {
      positions.append(at)
      if t.isEmpty && at == s.count { break }
      at = unitIndex(s, t, from: at + Swift.max(t.count, 1))
    }
    if positions.isEmpty { return self }
    var out: [Character] = []
    var end = 0
    for p in positions {
      out.append(contentsOf: s[end..<p])
      out.append(contentsOf: jsSubstitution(r, matched: t, position: p, in: s))
      end = p + t.count
    }
    out.append(contentsOf: s[end...])
    return String(out)
  }

  /// The integer the string writes (JS's `Number(text)`, trimmed: `"0x1F"`, `"1e3"`, `" 7 "`),
  /// or `none` when it is not a safe integer.
  public func toInt() -> Int? {
    guard let value = jsNumber(self), value.rounded(.towardZero) == value, Swift.abs(value) <= 9_007_199_254_740_991 else {
      return nil
    }
    return Int(value)
  }

  /// The number the string writes (JS's `Number(text)`, trimmed), or `none` when it is `NaN`.
  public func toFloat() -> Double? { jsNumber(self) }
}

/// JS's `GetSubstitution` for a string pattern (no capture groups).
func jsSubstitution(_ replacement: [Character], matched: [Character], position: Int, in s: [Character]) -> [Character] {
  if !replacement.contains("$") { return replacement }
  var out: [Character] = []
  var i = 0
  while i < replacement.count {
    let c = replacement[i]
    if c == "$" && i + 1 < replacement.count {
      switch replacement[i + 1] {
      case "$":
        out.append("$")
        i += 2
        continue
      case "&":
        out.append(contentsOf: matched)
        i += 2
        continue
      case "`":
        out.append(contentsOf: s[0..<position])
        i += 2
        continue
      case "'":
        out.append(contentsOf: s[Swift.min(position + matched.count, s.count)...])
        i += 2
        continue
      default:
        break
      }
    }
    out.append(c)
    i += 1
  }
  return out
}

/// JS's `slice` bounds for a length `count`.
func sliceBounds(_ count: Int, _ start: Int, _ end: Int?) -> (Int, Int) {
  let from = start < 0 ? Swift.max(count + start, 0) : Swift.min(start, count)
  let e = end ?? count
  let to = e < 0 ? Swift.max(count + e, 0) : Swift.min(e, count)
  return (from, to)
}

// MARK: - Int and Double

extension Int {
  /// The value as a `Double` (Bloom's `Float`).
  public func toFloat() -> Double { Double(self) }

  /// The magnitude (`Math.abs`).
  public func abs() -> Int { Swift.abs(self) }

  /// The smaller of the value and `other`.
  public func min(_ other: Int) -> Int { Swift.min(self, other) }

  /// The larger of the value and `other`.
  public func max(_ other: Int) -> Int { Swift.max(self, other) }

  /// The value within `lo...hi` (`Math.min(Math.max(x, lo), hi)`).
  public func clamp(_ lo: Int, _ hi: Int) -> Int { Swift.min(Swift.max(self, lo), hi) }

  /// The value within `lo...hi`.
  public func clamped(_ lo: Int, _ hi: Int) -> Int { clamp(lo, hi) }
}

extension Double {
  /// The value itself (Bloom's `Float` is Swift's `Double`).
  public func toFloat() -> Double { self }

  /// Bloom's `x.rounded()`: the nearest integer, halves toward +∞ (JS's `Math.round`:
  /// `-2.5` is `-2`, where Swift's `rounded()` gives `-3.0`).
  public func bloomRounded() -> Int {
    let down = Foundation.floor(self)
    return clampedInt(self - down >= 0.5 ? down + 1 : down)
  }

  /// The largest integer not above the value (`Math.floor`).
  public func floor() -> Int { clampedInt(Foundation.floor(self)) }

  /// The smallest integer not below the value (`Math.ceil`).
  public func ceil() -> Int { clampedInt(Foundation.ceil(self)) }

  /// The integer part (`Math.trunc`).
  public func truncated() -> Int { clampedInt(self.rounded(.towardZero)) }

  /// The magnitude (`Math.abs`).
  public func abs() -> Double { Swift.abs(self) }

  /// The smaller of the value and `other` (`Math.min`: NaN when either is).
  public func min(_ other: Double) -> Double { self.isNaN || other.isNaN ? .nan : Swift.min(self, other) }

  /// The larger of the value and `other` (`Math.max`: NaN when either is).
  public func max(_ other: Double) -> Double { self.isNaN || other.isNaN ? .nan : Swift.max(self, other) }

  /// The value within `lo...hi` (`Math.min(Math.max(x, lo), hi)`).
  public func clamp(_ lo: Double, _ hi: Double) -> Double { self.max(lo).min(hi) }

  /// The value within `lo...hi`.
  public func clamped(_ lo: Double, _ hi: Double) -> Double { clamp(lo, hi) }
}

/// A number as JS writes it (`String(n)`): `1` for 1.0, `1e+21`, `1e-7`, `NaN`.
/// What string interpolation of a Bloom `Float` must print.
public func stringOfNumber(_ n: Double) -> String {
  if n.isNaN { return "NaN" }
  if n.isInfinite { return n < 0 ? "-Infinity" : "Infinity" }
  if n == 0 { return "0" }
  let sign = n < 0 ? "-" : ""
  // Swift's description has the shortest round-tripping digits, as JS's does; only the layout differs.
  let text = Swift.abs(n).description
  var mantissa = Substring(text)
  var exponent = 0
  if let e = text.firstIndex(where: { $0 == "e" || $0 == "E" }) {
    mantissa = text[..<e]
    exponent = Int(text[text.index(after: e)...])!
  }
  let parts = mantissa.split(separator: ".", omittingEmptySubsequences: false)
  let whole = String(parts[0])
  let fraction = parts.count > 1 ? String(parts[1]) : ""
  var digits = whole + fraction
  // value = 0.digits × 10^point
  var point = whole.count + exponent
  while digits.hasPrefix("0") {
    digits.removeFirst()
    point -= 1
  }
  while digits.hasSuffix("0") { digits.removeLast() }
  let k = digits.count
  let body: String
  if k <= point && point <= 21 {
    body = digits + String(repeating: "0", count: point - k)
  } else if 0 < point && point <= 21 {
    let i = digits.index(digits.startIndex, offsetBy: point)
    body = digits[..<i] + "." + digits[i...]
  } else if -6 < point && point <= 0 {
    body = "0." + String(repeating: "0", count: -point) + digits
  } else {
    let e = point - 1
    let head = digits.prefix(1)
    let tail = digits.dropFirst()
    body = head + (tail.isEmpty ? "" : "." + tail) + "e" + (e < 0 ? "-" : "+") + String(Swift.abs(e))
  }
  return sign + body
}

/// A value as JS's `String(x)` writes it, for `joined`: numbers as `stringOfNumber`, `none`
/// as `""`.
func jsText(_ value: Any) -> String {
  switch value {
  case let s as String: return s
  case let d as Double: return stringOfNumber(d)
  case let i as Int: return String(i)
  case let b as Bool: return b ? "true" : "false"
  default:
    let mirror = Mirror(reflecting: value)
    if mirror.displayStyle == .optional {
      guard let inner = mirror.children.first?.value else { return "" }
      return jsText(inner)
    }
    return String(describing: value)
  }
}

// MARK: - Array

extension Array {
  /// The first element `predicate` accepts, or `none` (JS's `find`).
  public func find(_ predicate: (Element) throws -> Bool) rethrows -> Element? { try first(where: predicate) }

  /// The index of the first element `predicate` accepts, or `none`.
  public func findIndex(_ predicate: (Element) throws -> Bool) rethrows -> Int? { try firstIndex(where: predicate) }

  /// Whether `predicate` accepts some element (JS's `some`).
  public func any(_ predicate: (Element) throws -> Bool) rethrows -> Bool { try contains(where: predicate) }

  /// Whether `predicate` accepts every element (JS's `every`).
  public func all(_ predicate: (Element) throws -> Bool) rethrows -> Bool { try allSatisfy(predicate) }

  /// JS's `slice(start, end)`: negative offsets count from the end, offsets past the ends clamp.
  public func slice(_ start: Int, _ end: Int? = nil) -> [Element] {
    let (from, to) = sliceBounds(count, start, end)
    return from >= to ? [] : Array(self[from..<to])
  }

  /// The element at `index`, or `none` outside `0..<count` (a negative index is `none`).
  public func at(_ index: Int) -> Element? { index >= 0 && index < count ? self[index] : nil }

  /// The first `n` elements (JS's `slice(0, n)`: a negative `n` drops from the end).
  public func prefix(_ n: Int) -> [Element] { slice(0, n) }

  /// The elements after the first `n` (JS's `slice(n)`).
  public func dropFirst(_ n: Int) -> [Element] { slice(n) }

  /// The elements in reverse order, as an array.
  public func reversed() -> [Element] {
    var out = self
    out.reverse()
    return out
  }

  /// The array with `element` after its own.
  public func appending(_ element: Element) -> [Element] {
    var out = self
    out.append(element)
    return out
  }

  /// The array with `element` at `index` (JS's `[...xs.slice(0, i), x, ...xs.slice(i)]`).
  public func inserting(_ element: Element, _ index: Int) -> [Element] {
    slice(0, index) + [element] + slice(index)
  }

  /// The array without the element at `index` (JS's `[...xs.slice(0, i), ...xs.slice(i + 1)]`).
  public func removing(_ index: Int) -> [Element] { slice(0, index) + slice(index + 1) }

  /// Sorted by `before`, stably: equal elements keep their order.
  public func sorted(_ before: (Element, Element) throws -> Bool) rethrows -> [Element] {
    try enumerated()
      .sorted { a, b in try before(a.element, b.element) ? true : (try before(b.element, a.element) ? false : a.offset < b.offset) }
      .map(\.element)
  }

  /// The elements as text, `separator` between them (JS's `join`).
  public func joined(_ separator: String) -> String { map { jsText($0) }.joined(separator: separator) }
}

extension Array where Element: Equatable {
  /// The index of the first `element`, or `none` (JS's `indexOf`).
  public func indexOf(_ element: Element) -> Int? { firstIndex(of: element) }
}

// Bloom's maps and sets are `OrderedDictionary` and `OrderedSet` (`Collections.swift`):
// their built-in members (`setting`, `removing`, `entries`, `inserting`, `values`, …) are there.

// MARK: - Optional

extension Optional {
  /// The value, or `fallback` when there is none (`??`).
  public func unwrapOr(_ fallback: Wrapped) -> Wrapped { self ?? fallback }
}
