// Bloom (core): `Core.bloom`'s extensions of String, Array, Dictionary, Set, Optional and
// Result, `Ref`, `RuntimeError` and `fatal`.
import Foundation

// MARK: - String

extension String {
  /// The user-perceived characters (extended grapheme clusters), each a string: Bloom's
  /// `Character` is a `String`. `"👍🏽".characters.count == 1`.
  public var characters: [String] { map { String($0) } }

  /// How many user-perceived characters the string has (Swift's `count`).
  public var characterCount: Int { count }

  /// Whether the string is empty or only whitespace.
  public var isBlank: Bool { trimmed().isEmpty }

  /// The character offset of the first `sub` at or after `from`, or `none` (the TS runtime
  /// counts UTF-16 units).
  public func firstIndex(of sub: String, from: Int = 0) -> Int? {
    let at = unitIndex(chars, sub.chars, from: from)
    return at < 0 ? nil : at
  }

  /// The character offset of the last `sub`, or `none`.
  public func lastIndex(of sub: String) -> Int? {
    let at = unitLastIndex(chars, sub.chars)
    return at < 0 ? nil : at
  }

  /// The string without `prefix`, when it starts with it.
  public func droppingPrefix(_ prefix: String) -> String {
    startsWith(prefix) ? slice(prefix.count) : self
  }

  /// The string without `suffix`, when it ends with it.
  public func droppingSuffix(_ suffix: String) -> String {
    endsWith(suffix) ? slice(0, count - suffix.count) : self
  }

  /// The first `n` user-perceived characters, as a string.
  public func prefix(_ n: Int) -> String { String(self.dropLast(Swift.max(0, count - Swift.max(n, 0)))) }

  /// The last `n` user-perceived characters, as a string.
  public func suffix(_ n: Int) -> String { String(self.dropFirst(Swift.max(0, count - Swift.max(n, 0)))) }

  /// At most `length` characters, with `ellipsis` in place of the rest.
  public func truncated(to length: Int, ellipsis: String = "…") -> String {
    count <= length ? self : prefix(length) + ellipsis
  }

  /// Leading whitespace removed.
  public func trimmingStart() -> String {
    guard let first = unicodeScalars.firstIndex(where: { !isJSWhitespace($0) }) else { return "" }
    return String(unicodeScalars[first...])
  }

  /// Trailing whitespace removed.
  public func trimmingEnd() -> String {
    guard let last = unicodeScalars.lastIndex(where: { !isJSWhitespace($0) }) else { return "" }
    return String(unicodeScalars[...last])
  }

  /// Padded at the start with `pad` to `length` characters (JS's `padStart`, which counts
  /// UTF-16 units).
  public func paddingStart(to length: Int, with pad: String = " ") -> String { jsPadding(length, pad) + self }

  /// Padded at the end with `pad` to `length` characters (JS's `padEnd`).
  public func paddingEnd(to length: Int, with pad: String = " ") -> String { self + jsPadding(length, pad) }

  private func jsPadding(_ length: Int, _ pad: String) -> String {
    let missing = length - count
    let p = pad.chars
    if missing <= 0 || p.isEmpty { return "" }
    var out: [Character] = []
    out.reserveCapacity(missing)
    while out.count < missing { out.append(p[out.count % p.count]) }
    return String(out)
  }

  /// Bloom's `capitalized`: the first character upper-cased, the rest kept (Foundation's
  /// `capitalized` capitalizes every word and lower-cases the rest).
  public var capitalizedFirst: String {
    guard let first = first else { return self }
    return String(first).uppercased() + dropFirst()
  }

  /// The string's lines (`\r\n` and `\n` end a line).
  public var lines: [String] { replacingOccurrences(of: "\r\n", with: "\n").split("\n") }

  /// Ordered as a person reading `locale` expects (`""`: the device's locale): `-1`, `0` or `1`.
  /// (`locale:` is required in Swift: without it Foundation's `compare(_:)` answers.)
  public func compare(_ other: String, locale: String) -> Int {
    let found = locale.isEmpty ? Foundation.Locale.current : Foundation.Locale(identifier: locale)
    switch self.compare(other, options: [], range: nil, locale: found) {
    case .orderedAscending: return -1
    case .orderedSame: return 0
    case .orderedDescending: return 1
    }
  }

  /// `s` repeated `count` times (none when `count` is not positive).
  public static func repeating(_ s: String, count: Int) -> String { count > 0 ? String(repeating: s, count: count) : "" }
}

// MARK: - Array

extension Array {
  /// Consecutive slices of `size` elements (the last may be shorter).
  public func chunked(into size: Int) -> [[Element]] {
    let step = Swift.max(size, 1)
    return Swift.stride(from: 0, to: count, by: step).map { slice($0, $0 + step) }
  }

  /// The elements grouped by `key`, each group in order.
  public func grouped(by key: (Element) throws -> String) rethrows -> OrderedDictionary<String, [Element]> {
    var out: OrderedDictionary<String, [Element]> = [:]
    for x in self { out[try key(x), default: []].append(x) }
    return out
  }

  /// The elements by their `key`, the last one winning.
  public func keyed(by key: (Element) throws -> String) rethrows -> OrderedDictionary<String, Element> {
    var out: OrderedDictionary<String, Element> = [:]
    for x in self { out[try key(x)] = x }
    return out
  }

  /// The elements with the first of each `key` kept.
  public func uniqued(by key: (Element) throws -> String) rethrows -> [Element] {
    var seen = Set<String>()
    var out: [Element] = []
    for x in self where seen.insert(try key(x)).inserted { out.append(x) }
    return out
  }

  /// The elements `predicate` accepts, and the others.
  public func partitioned(by predicate: (Element) throws -> Bool) rethrows -> ([Element], [Element]) {
    var yes: [Element] = []
    var no: [Element] = []
    for x in self {
      if try predicate(x) { yes.append(x) } else { no.append(x) }
    }
    return (yes, no)
  }

  /// The element at `index`, or `none` past the ends.
  public func element(at index: Int) -> Element? { at(index) }

  /// The array with the element at `index` replaced.
  public func replacing(at index: Int, with value: Element) -> [Element] {
    var out = self
    if index >= 0 && index < count { out[index] = value }
    return out
  }

  /// The array with every element `predicate` accepts replaced by `update` of it.
  public func updating(where predicate: (Element) throws -> Bool, _ update: (Element) throws -> Element) rethrows -> [Element] {
    try map { try predicate($0) ? try update($0) : $0 }
  }

  /// The array without the elements `predicate` accepts.
  public func removingAll(where predicate: (Element) throws -> Bool) rethrows -> [Element] {
    try filter { !(try predicate($0)) }
  }

  /// The array with `other`'s elements after its own.
  public func appendingAll(_ other: [Element]) -> [Element] { self + other }

  /// The elements in `n`-element windows, overlapping.
  public func windows(of n: Int) -> [[Element]] {
    n < 1 || n > count ? [] : (0..<(count - n + 1)).map { slice($0, $0 + n) }
  }
}

/// The strings deduplicated, in first-seen order.
public func uniqued(_ xs: [String]) -> [String] { xs.uniqued(by: { $0 }) }

/// `a` then `b`.
public func concat<T>(_ a: [T], _ b: [T]) -> [T] { a + b }

/// `from`, `from + by`, … up to and not including `to` (`by` may be negative; 0 is empty).
public func stride(from: Int, to: Int, by: Int = 1) -> [Int] {
  var out: [Int] = []
  if by > 0 {
    var i = from
    while i < to { out.append(i); i += by }
  } else if by < 0 {
    var i = from
    while i > to { out.append(i); i += by }
  }
  return out
}

/// `0..<n`, as an array.
public func range(_ n: Int) -> [Int] { n > 0 ? Array(0..<n) : [] }

/// Pairs of the elements of `a` and `b`, as long as the shorter.
public func zip<A, B>(_ a: [A], _ b: [B]) -> [(A, B)] { Array(Swift.zip(a, b)) }

// Core.bloom's Dictionary and Set extensions (`mapValues`, `filter`, `merging`,
// `value(for:default:)`, `sortedEntries`, `elements`, `union`, `toggling`, `Set.of`, …) are
// members of `OrderedDictionary` and `OrderedSet` (`Collections.swift`).

// MARK: - Optional

extension Optional {
  /// Whether there is a value.
  public var isSome: Bool { self != nil }

  /// Whether there is none.
  public var isNone: Bool { self == nil }

  /// The value, or `error` thrown.
  public func orThrow(_ error: any Error) throws -> Wrapped {
    guard let value = self else { throw error }
    return value
  }
}

// MARK: - Result

/// Bloom's `Result<T, E>`: `ok(T)` or `err(E)`. Its error is any type (`Result<Unit, String>`),
/// which Swift's `Result` (`Failure: Error`) cannot hold, hence its own type.
public enum BloomResult<Success, Failure> {
  case ok(Success)
  case err(Failure)
}

extension BloomResult: Sendable where Success: Sendable, Failure: Sendable {}
extension BloomResult: Equatable where Success: Equatable, Failure: Equatable {}
extension BloomResult: Hashable where Success: Hashable, Failure: Hashable {}

extension BloomResult {
  /// Whether it is `ok`.
  public var isOk: Bool {
    if case .ok = self { return true }
    return false
  }

  /// The success value, or `none`.
  public func ok() -> Success? {
    if case .ok(let value) = self { return value }
    return nil
  }

  /// `transform` of the success value.
  public func map<U>(_ transform: (Success) throws -> U) rethrows -> BloomResult<U, Failure> {
    switch self {
    case .ok(let value): return .ok(try transform(value))
    case .err(let error): return .err(error)
    }
  }

  /// `transform` of the error.
  public func mapErr<F>(_ transform: (Failure) throws -> F) rethrows -> BloomResult<Success, F> {
    switch self {
    case .ok(let value): return .ok(value)
    case .err(let error): return .err(try transform(error))
    }
  }

  /// The success value, or `fallback`.
  public func unwrapOr(_ fallback: Success) -> Success { ok() ?? fallback }

  /// The success value, or its error thrown (an error that is not a Swift `Error` is thrown
  /// as a `RuntimeError` of its text).
  public func get() throws -> Success {
    switch self {
    case .ok(let value): return value
    case .err(let error):
      if let error = error as? any Error { throw error }
      throw RuntimeError(message: jsText(error))
    }
  }
}

/// Runs `body`: its value as `ok`, what it throws as `err` (Bloom's `catching { … }`).
public func catching<T>(_ body: () throws -> T) -> BloomResult<T, any Error> {
  do { return .ok(try body()) } catch { return .err(error) }
}

// MARK: - Ref

/// A value a view keeps across renders without drawing again (React's `useRef`): writing
/// `ref.value` changes it in place.
public final class Ref<T> {
  public var value: T

  public init(_ value: T) { self.value = value }
}

// MARK: - Errors

/// An error with a message: what `throw` takes when no domain error type fits.
public struct RuntimeError: Error, Equatable, Hashable, Sendable, LocalizedError, CustomStringConvertible {
  public let message: String

  public init(message: String) { self.message = message }

  public var errorDescription: String? { message }
  public var description: String { message }
}

/// Stops the program: a state the code holds impossible was reached. (On the web this
/// throws a `RuntimeError`; in Swift it traps, as `fatalError`.)
public func fatal<T>(_ message: String = "unreachable") -> T { fatalError(message) }
