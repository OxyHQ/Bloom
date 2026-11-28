// The token record (`Record<string, string>`) with JavaScript's key order: a key keeps the
// position of its first insertion, a later write replaces only its value. Every TypeScript
// spread (`{ ...base, ...policy }`) is a `merge` here, so the order matches byte for byte.
import Foundation

/// One `name: value` pair, as an authored preset writes it.
public struct TokenPair: Sendable, Hashable, Codable {
  public var name: String
  public var value: String

  public init(_ name: String, _ value: String) {
    self.name = name
    self.value = value
  }
}

/// `Record<string, string>` in insertion order (every key here is a `--token`, never an index).
public struct TokenMap: Sendable, Hashable, Sequence {
  public private(set) var keys: [String] = []
  private var values: [String: String] = [:]

  public init() {}

  public init(_ pairs: [(String, String)]) {
    for (key, value) in pairs { self[key] = value }
  }

  public var count: Int { keys.count }
  public var isEmpty: Bool { keys.isEmpty }

  public subscript(key: String) -> String? {
    get { values[key] }
    set {
      if let newValue {
        if values.updateValue(newValue, forKey: key) == nil { keys.append(key) }
      } else if values.removeValue(forKey: key) != nil {
        keys.removeAll { $0 == key }
      }
    }
  }

  /// A canonical token's value (`--<token>`).
  public subscript(token: CanonicalToken) -> String? {
    get { self[token.variable] }
    set { self[token.variable] = newValue }
  }

  /// `{ ...self, ...other }`.
  public func merging(_ other: TokenMap) -> TokenMap {
    var out = self
    for (key, value) in other { out[key] = value }
    return out
  }

  public mutating func merge(_ other: TokenMap) {
    for (key, value) in other { self[key] = value }
  }

  public func filter(_ isIncluded: (String, String) -> Bool) -> TokenMap {
    var out = TokenMap()
    for (key, value) in self where isIncluded(key, value) { out[key] = value }
    return out
  }

  public func makeIterator() -> AnyIterator<(String, String)> {
    var index = 0
    let keys = self.keys
    let values = self.values
    return AnyIterator {
      guard index < keys.count else { return nil }
      defer { index += 1 }
      return (keys[index], values[keys[index]]!)
    }
  }

  public static func == (lhs: TokenMap, rhs: TokenMap) -> Bool {
    lhs.keys == rhs.keys && lhs.values == rhs.values
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(keys)
    for key in keys { hasher.combine(values[key]) }
  }
}
