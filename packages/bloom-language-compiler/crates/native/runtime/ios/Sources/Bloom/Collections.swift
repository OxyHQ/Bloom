// Bloom's maps and sets keep their order, as JS's objects and `Set`s do, and the order is
// observable (iteration, `keys`, `Codable`'s output): `[String: V]` is `OrderedDictionary`,
// `Set<T>` is `OrderedSet` (no swift-collections dependency). Both are values.
//
// A map with `String` keys orders them as a JS object does: keys that are array indices
// (`"0"`, `"42"`: canonical integers below 2³² − 1) first, ascending, then the others in
// insertion order. That is what makes `JSON.stringify` of a map byte-identical.
import Foundation

// MARK: - OrderedDictionary

/// A dictionary that keeps its keys in insertion order (a JS object's order for `String` keys).
public struct OrderedDictionary<Key: Hashable, Value> {
  @usableFromInline var _keys: [Key]
  @usableFromInline var _values: [Key: Value]

  /// An empty dictionary.
  public init() {
    _keys = []
    _values = [:]
  }

  /// The pairs, in order; a repeated key keeps its first position and its last value.
  public init<S: Sequence>(_ pairs: S) where S.Element == (Key, Value) {
    self.init()
    for (k, v) in pairs { self[k] = v }
  }

  /// The entries of a Swift dictionary, in its (unspecified) order.
  public init(_ dictionary: [Key: Value]) {
    self.init(dictionary.map { ($0.key, $0.value) })
  }

  /// The keys, in order.
  public var keys: [Key] { _keys }

  /// The values, in key order.
  public var values: [Value] { _keys.map { _values[$0]! } }

  public var count: Int { _keys.count }

  public var isEmpty: Bool { _keys.isEmpty }

  /// The value at `key`; setting a held key keeps its position, `nil` removes it.
  public subscript(key: Key) -> Value? {
    get { _values[key] }
    set {
      if let newValue {
        if _values.updateValue(newValue, forKey: key) == nil { insertKey(key) }
      } else if _values.removeValue(forKey: key) != nil {
        _keys.remove(at: _keys.firstIndex(of: key)!)
      }
    }
  }

  /// The value at `key`, or `fallback` (which a mutation through it stores).
  public subscript(key: Key, default fallback: @autoclosure () -> Value) -> Value {
    get { _values[key] ?? fallback() }
    set { self[key] = newValue }
  }

  private mutating func insertKey(_ key: Key) {
    if Key.self == String.self, let index = arrayIndex(key as! String) {
      // Index keys first, ascending, as a JS object orders them.
      var at = 0
      while at < _keys.count, let other = arrayIndex(_keys[at] as! String), other < index { at += 1 }
      _keys.insert(key, at: at)
    } else {
      _keys.append(key)
    }
  }

  /// Removes `key`; its value, or `nil`.
  @discardableResult
  public mutating func removeValue(forKey key: Key) -> Value? {
    let old = _values[key]
    self[key] = nil
    return old
  }

  /// Every value transformed, keys and order kept.
  public func mapValues<T>(_ transform: (Value) throws -> T) rethrows -> OrderedDictionary<Key, T> {
    var out = OrderedDictionary<Key, T>()
    out._keys = _keys
    out._values = try _values.mapValues(transform)
    return out
  }

  /// The entries `predicate` accepts, in order.
  public func filter(_ predicate: (Key, Value) throws -> Bool) rethrows -> OrderedDictionary<Key, Value> {
    var out = OrderedDictionary()
    for k in _keys where try predicate(k, _values[k]!) {
      out._keys.append(k)
      out._values[k] = _values[k]
    }
    return out
  }

  /// The dictionary with `value` at `key` (a held key keeps its position).
  public func setting(_ key: Key, _ value: Value) -> OrderedDictionary<Key, Value> {
    var out = self
    out[key] = value
    return out
  }

  /// The dictionary without `key`.
  public func removing(_ key: Key) -> OrderedDictionary<Key, Value> {
    var out = self
    out[key] = nil
    return out
  }

  /// The entries as `(key, value)` pairs, in order (JS's `Object.entries`).
  public var entries: [(Key, Value)] { _keys.map { ($0, _values[$0]!) } }

  /// The dictionary with `other`'s entries, `other` winning on a shared key.
  public func merging(_ other: OrderedDictionary<Key, Value>) -> OrderedDictionary<Key, Value> {
    var out = self
    for (k, v) in other.entries { out[k] = v }
    return out
  }

  /// The value for `key`, or `fallback`.
  public func value(for key: Key, default fallback: Value) -> Value { _values[key] ?? fallback }

  /// Whether `key` is held.
  public func contains(_ key: Key) -> Bool { _values[key] != nil }

  /// The entries as a Swift dictionary (order dropped).
  public var dictionary: [Key: Value] { _values }
}

extension OrderedDictionary where Key: Comparable {
  /// The entries sorted by key.
  public var sortedEntries: [(Key, Value)] { _keys.sorted().map { ($0, _values[$0]!) } }
}

/// `s` as an array index (a canonical integer below 2³² − 1), as JS orders object keys.
func arrayIndex(_ s: String) -> UInt32? {
  let u = s.utf8
  guard let first = u.first, u.count <= 10, first >= 48, first <= 57 else { return nil }
  if first == 48 && u.count > 1 { return nil }
  var v: UInt64 = 0
  for c in u {
    guard c >= 48 && c <= 57 else { return nil }
    v = v * 10 + UInt64(c - 48)
  }
  return v < 4_294_967_295 ? UInt32(v) : nil
}

extension OrderedDictionary: ExpressibleByDictionaryLiteral {
  public init(dictionaryLiteral elements: (Key, Value)...) { self.init(elements) }
}

extension OrderedDictionary: Sequence {
  public struct Iterator: IteratorProtocol {
    var base: OrderedDictionary
    var index = 0
    public mutating func next() -> (key: Key, value: Value)? {
      guard index < base._keys.count else { return nil }
      defer { index += 1 }
      let k = base._keys[index]
      return (k, base._values[k]!)
    }
  }

  public func makeIterator() -> Iterator { Iterator(base: self) }
  public var underestimatedCount: Int { count }
}

extension OrderedDictionary: Equatable where Value: Equatable {
  /// Equal entries in the same order.
  public static func == (a: Self, b: Self) -> Bool { a._keys == b._keys && a._values == b._values }
}

extension OrderedDictionary: Hashable where Value: Hashable {
  public func hash(into hasher: inout Hasher) {
    for (k, v) in self {
      hasher.combine(k)
      hasher.combine(v)
    }
  }
}

extension OrderedDictionary: @unchecked Sendable where Key: Sendable, Value: Sendable {}

extension OrderedDictionary: CustomStringConvertible {
  public var description: String {
    isEmpty ? "[:]" : "[" + entries.map { "\(String(reflecting: $0.0)): \(String(reflecting: $0.1))" }.joined(separator: ", ") + "]"
  }
}

/// A coding key of any text (a map's key, a JSON object's member).
public struct BloomCodingKey: CodingKey, Hashable, Sendable {
  public let stringValue: String
  public let intValue: Int?

  public init(_ string: String) {
    stringValue = string
    intValue = nil
  }

  public init?(stringValue: String) { self.init(stringValue) }

  public init?(intValue: Int) {
    stringValue = String(intValue)
    self.intValue = intValue
  }
}

/// A map encodes as a JSON object, its keys in order (`String` keys, or any
/// `LosslessStringConvertible` key as its text).
extension OrderedDictionary: Encodable where Key: LosslessStringConvertible, Value: Encodable {
  public func encode(to encoder: Encoder) throws {
    var c = encoder.container(keyedBy: BloomCodingKey.self)
    for (k, v) in self { try c.encode(v, forKey: BloomCodingKey(k.description)) }
  }
}

extension OrderedDictionary: Decodable where Key: LosslessStringConvertible, Value: Decodable {
  public init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: BloomCodingKey.self)
    self.init()
    for key in c.allKeys {
      guard let k = Key(key.stringValue) else {
        throw DecodingError.dataCorruptedError(forKey: key, in: c, debugDescription: "not a key: \(key.stringValue)")
      }
      self[k] = try c.decode(Value.self, forKey: key)
    }
  }
}

// MARK: - OrderedSet

/// A set that keeps its elements in insertion order (a JS `Set`).
public struct OrderedSet<Element: Hashable> {
  @usableFromInline var _elements: [Element]
  @usableFromInline var _members: Set<Element>

  /// An empty set.
  public init() {
    _elements = []
    _members = []
  }

  /// The distinct elements of `elements`, first occurrence first.
  public init<S: Sequence>(_ elements: S) where S.Element == Element {
    self.init()
    for x in elements { insert(x) }
  }

  public var count: Int { _elements.count }

  public var isEmpty: Bool { _elements.isEmpty }

  /// The elements, in insertion order.
  public var values: [Element] { _elements }

  /// The elements, in insertion order.
  public var elements: [Element] { _elements }

  public func contains(_ x: Element) -> Bool { _members.contains(x) }

  /// Adds `x` at the end when it is not held.
  @discardableResult
  public mutating func insert(_ x: Element) -> Bool {
    guard _members.insert(x).inserted else { return false }
    _elements.append(x)
    return true
  }

  /// Removes `x`.
  @discardableResult
  public mutating func remove(_ x: Element) -> Element? {
    guard _members.remove(x) != nil else { return nil }
    _elements.remove(at: _elements.firstIndex(of: x)!)
    return x
  }

  /// The set with `x` added.
  public func inserting(_ x: Element) -> OrderedSet<Element> {
    var out = self
    out.insert(x)
    return out
  }

  /// The set without `x`.
  public func removing(_ x: Element) -> OrderedSet<Element> {
    var out = self
    out.remove(x)
    return out
  }

  /// The elements of either set: these, then `other`'s new ones.
  public func union(_ other: OrderedSet<Element>) -> OrderedSet<Element> {
    var out = self
    for x in other._elements { out.insert(x) }
    return out
  }

  /// The elements of both sets, in this one's order.
  public func intersection(_ other: OrderedSet<Element>) -> OrderedSet<Element> {
    OrderedSet(_elements.filter { other.contains($0) })
  }

  /// The elements not in `other`, in order.
  public func subtracting(_ other: OrderedSet<Element>) -> OrderedSet<Element> {
    OrderedSet(_elements.filter { !other.contains($0) })
  }

  /// Whether every element is in `other`.
  public func isSubset(of other: OrderedSet<Element>) -> Bool { _elements.allSatisfy { other.contains($0) } }

  /// The set with `x` added, or removed when it was there.
  public func toggling(_ x: Element) -> OrderedSet<Element> { contains(x) ? removing(x) : inserting(x) }

  /// A set of `xs`.
  public static func of(_ xs: [Element]) -> OrderedSet<Element> { OrderedSet(xs) }

  /// The elements as a Swift set (order dropped).
  public var set: Set<Element> { _members }
}

extension OrderedSet: ExpressibleByArrayLiteral {
  public init(arrayLiteral elements: Element...) { self.init(elements) }
}

extension OrderedSet: Sequence {
  public func makeIterator() -> IndexingIterator<[Element]> { _elements.makeIterator() }
  public var underestimatedCount: Int { count }
}

extension OrderedSet: Equatable {
  /// The same elements (a JS `Set` has no `==`; Bloom's compares members, not order).
  public static func == (a: Self, b: Self) -> Bool { a._members == b._members }
}

extension OrderedSet: Hashable {
  public func hash(into hasher: inout Hasher) { hasher.combine(_members) }
}

extension OrderedSet: @unchecked Sendable where Element: Sendable {}

extension OrderedSet: CustomStringConvertible {
  public var description: String { "[" + _elements.map { String(reflecting: $0) }.joined(separator: ", ") + "]" }
}

/// A set encodes as a JSON array, in order.
extension OrderedSet: Encodable where Element: Encodable {
  public func encode(to encoder: Encoder) throws {
    var c = encoder.unkeyedContainer()
    for x in _elements { try c.encode(x) }
  }
}

extension OrderedSet: Decodable where Element: Decodable {
  public init(from decoder: Decoder) throws {
    var c = try decoder.unkeyedContainer()
    self.init()
    while !c.isAtEnd { insert(try c.decode(Element.self)) }
  }
}

// MARK: - UniqueID

/// An identifier unique to this device and moment (a lower-case UUID), as a value.
public struct UniqueID: Hashable, Sendable, Codable, CustomStringConvertible, Comparable {
  public let rawValue: String

  /// A new identifier.
  public init() { rawValue = UUID().uuidString.lowercased() }

  /// The identifier `rawValue` (from a server, a record).
  public init(_ rawValue: String) { self.rawValue = rawValue }

  /// Bloom's field (`@Transparent public struct UniqueID { public let string: String }`): the
  /// identity as text. `@State private var id = UniqueID()` keeps one for a view's life.
  public init(string: String) { self.rawValue = string }

  /// The identity as text (Bloom's `id.string`).
  public var string: String { rawValue }

  public var description: String { rawValue }

  public static func < (a: UniqueID, b: UniqueID) -> Bool { a.rawValue < b.rawValue }

  public init(from decoder: Decoder) throws { rawValue = try decoder.singleValueContainer().decode(String.self) }

  public func encode(to encoder: Encoder) throws {
    var c = encoder.singleValueContainer()
    try c.encode(rawValue)
  }
}
