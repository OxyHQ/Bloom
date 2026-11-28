// Bloom's `Codable` on Swift's own `Codable`, with the TS runtime's wire format and errors.
//
// The emitter writes Swift's synthesized conformance (plus `CodingKeys` for `@CodingKey`, and
// an `init(from:)` for a field with a default); `JSON.decode`/`JSON.encode` run it through
// these coders, which read and write `JSONValue`:
//
// - a struct is an object, its fields in declaration order; a `none` field is left out
//   (`encodeIfPresent`), and an absent or `null` member decodes as `none`;
// - `Date` is an ISO 8601 string with milliseconds (`2026-11-26T18:30:00.000Z`), and decodes
//   from that or from a number of milliseconds since 1970;
// - `Int` decodes from a number with no fraction (`2.0` is 2, `2.5` fails);
// - a case-only enum is its case name (`BloomCaseCodable`);
// - a map is an object in its order (`OrderedDictionary`), a set an array.
//
// A value that does not decode throws a `BloomDecodingError` whose message is the TS
// runtime's: "Post.likes: expected an integer, found a string".
import Foundation

// MARK: - Errors

/// Bloom's `DecodingError`: at `at` (`Post.author`), `expected` was wanted and `found` was there.
/// (Swift's `DecodingError` is an enum of contexts; this is Bloom's struct.)
public struct BloomDecodingError: Error, Equatable, Hashable, Sendable, LocalizedError, CustomStringConvertible {
  public let at: String
  public let expected: String
  public let found: String
  /// "Post.likes: expected a number, found a string".
  public let message: String

  public init(at: String, expected: String, found: String) {
    self.at = at
    self.expected = expected
    self.found = found
    message = "\(at): expected \(expected), found \(found)"
  }

  public var errorDescription: String? { message }
  public var description: String { message }
}

/// The JSON kind `value` is, as an error message says it.
func described(_ value: JSONValue) -> String {
  switch value {
  case .absent: return "nothing"
  case .null: return "null"
  case .bool: return "a boolean"
  case .number: return "a number"
  case .string: return "a string"
  case .array: return "an array"
  case .object: return "an object"
  }
}

/// Throws the `BloomDecodingError` for `value` at `at`, which is not `expected`.
public func decodingFailure<T>(_ value: JSONValue, _ at: String, _ expected: String) throws -> T {
  throw BloomDecodingError(at: at, expected: expected, found: described(value))
}

/// The member `key` of the object `value` (absent when it has none); throws when `value` is
/// not an object.
public func jsonField(_ value: JSONValue, _ key: String, _ at: String) throws -> JSONValue {
  guard case .object(let members) = value else { return try decodingFailure(value, at, "an object") }
  return members[key] ?? .absent
}

/// `entries` as a JSON object (absent values left out).
public func jsonObject(_ entries: OrderedDictionary<String, JSONValue>) -> JSONValue {
  .object(entries.filter { _, v in v != .absent })
}

// MARK: - Case-only enums

/// A case-only enum coded as its case name, as Bloom codes one: `enum Kind: BloomCaseCodable
/// { case post, reply }` encodes `.post` as `"post"` and decodes only a case's name (else
/// "Kind.kind: expected one of "post", "reply", found …"). Give the enum no raw type: a
/// `String` raw type brings Swift's own `RawRepresentable` coding instead (the same JSON,
/// with Swift's error).
public protocol BloomCaseCodable: CaseIterable, Codable {}

extension BloomCaseCodable {
  /// The case's name.
  public var caseName: String { String(describing: self) }

  public init(from decoder: Decoder) throws {
    let value = (decoder as? JSONValueDecoder)?.value
    let c = try decoder.singleValueContainer()
    let names = Self.allCases.map { "\"\($0.caseName)\"" }.joined(separator: ", ")
    let at = (decoder as? JSONValueDecoder)?.at ?? decoder.codingPath.map(\.stringValue).joined(separator: ".")
    guard let name = try? c.decode(String.self), let found = Self.allCases.first(where: { $0.caseName == name }) else {
      throw BloomDecodingError(at: at, expected: "one of \(names)", found: value.map(described) ?? "another value")
    }
    self = found
  }

  public func encode(to encoder: Encoder) throws {
    var c = encoder.singleValueContainer()
    try c.encode(caseName)
  }
}

/// A case-only enum's value from its case name, one of `cases` (the derived decoder's).
public func decodeCase<T: BloomCaseCodable>(_ value: JSONValue, _ at: String, _ cases: [T], _ expected: String) throws -> T {
  guard case .string(let name) = value, let found = cases.first(where: { $0.caseName == name }) else {
    return try decodingFailure(value, at, expected)
  }
  return found
}

/// A case-only enum's value as its case name.
public func encodeCase<T: BloomCaseCodable>(_ value: T) -> JSONValue { .string(value.caseName) }

// MARK: - The derived code's entry points

/// `value` decoded as a `T`; `at` names it in errors (`"JSON"` at the top).
public func decodeValue<T: Decodable>(_ type: T.Type, from value: JSONValue, at: String) throws -> T {
  try JSONValueDecoder.decode(type, value, at: at, codingPath: [])
}

/// `value` as a `JSONValue`.
public func encodeValue<T: Encodable>(_ value: T) -> JSONValue {
  do {
    return try JSONValueEncoder.encode(value)
  } catch {
    fatalError("Bloom: \(T.self) did not encode: \(error)")
  }
}

extension Decodable {
  /// The value `value` holds (Bloom's derived `T.decode(value, at)`).
  public static func decode(_ value: JSONValue, _ at: String) throws -> Self { try decodeValue(Self.self, from: value, at: at) }
}

extension Encodable {
  /// The value as JSON (Bloom's derived `T.encode(value)`).
  public static func encode(_ value: Self) -> JSONValue { encodeValue(value) }
}

extension Array {
  /// Bloom's `Codec.array(Post.self)`, `Array.codec(Post.self)`: the type `[Post]`, which is
  /// its own codec in Swift.
  public static func codec(_ element: Element.Type) -> [Element].Type { [Element].self }

  /// Each item decoded by `element`.
  public static func decode(_ value: JSONValue, _ at: String, _ element: (JSONValue, String) throws -> Element) throws -> [Element] {
    guard case .array(let items) = value else { return try decodingFailure(value, at, "an array") }
    return try items.map { try element($0, at) }
  }

  /// Each item encoded by `element`.
  public static func encode(_ value: [Element], _ element: (Element) -> JSONValue) -> JSONValue { .array(value.map(element)) }
}

extension Optional {
  /// `none` when absent or null; else what `wrapped` decodes.
  public static func decode(_ value: JSONValue, _ at: String, _ wrapped: (JSONValue, String) throws -> Wrapped) throws -> Wrapped? {
    value.isNull ? nil : try wrapped(value, at)
  }

  /// Absent (left out of its object) when `none`.
  public static func encode(_ value: Wrapped?, _ wrapped: (Wrapped) -> JSONValue) -> JSONValue { value.map(wrapped) ?? .absent }
}

extension OrderedDictionary where Key == String {
  /// Each member decoded by `element`.
  public static func decode(_ value: JSONValue, _ at: String, _ element: (JSONValue, String) throws -> Value) throws -> OrderedDictionary<String, Value> {
    guard case .object(let members) = value else { return try decodingFailure(value, at, "an object") }
    return try members.mapValues { try element($0, at) }
  }

  /// Each member encoded by `element`.
  public static func encode(_ value: OrderedDictionary<String, Value>, _ element: (Value) -> JSONValue) -> JSONValue {
    jsonObject(value.mapValues(element))
  }
}

// MARK: - BloomJSON

/// The coders of Bloom's wire format, shaped as Foundation's.
public enum BloomJSON {
  /// Encodes as `JSON.encode` does.
  public static let encoder = BloomJSONEncoder()

  /// Decodes as `JSON.decode` does.
  public static let decoder = BloomJSONDecoder()

  /// Foundation's encoder set as close to the wire format as it goes (dates as ISO 8601 with
  /// milliseconds, `/` unescaped), for an API that wants a `JSONEncoder`. Its key order and
  /// number text are Foundation's, not JS's: prefer `encoder`.
  public static var foundationEncoder: JSONEncoder {
    let e = JSONEncoder()
    e.dateEncodingStrategy = .custom { date, encoder in
      var c = encoder.singleValueContainer()
      try c.encode(date.iso8601)
    }
    e.outputFormatting = [.withoutEscapingSlashes]
    return e
  }

  /// Foundation's decoder reading dates as Bloom does (ISO 8601, or milliseconds since 1970).
  public static var foundationDecoder: JSONDecoder {
    let d = JSONDecoder()
    d.dateDecodingStrategy = .custom { decoder in
      let c = try decoder.singleValueContainer()
      if let ms = try? c.decode(Double.self) { return Date.fromMilliseconds(ms) }
      let text = try c.decode(String.self)
      guard let date = Date.parse(iso8601: text) else {
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "not an ISO 8601 date: \(text)")
      }
      return date
    }
    return d
  }
}

/// `JSON.encode`'s coder with `JSONEncoder`'s shape.
public struct BloomJSONEncoder: Sendable {
  /// Spaces per level (0: one line).
  public var indent: Int = 0

  public init(indent: Int = 0) { self.indent = indent }

  public func encode<T: Encodable>(_ value: T) throws -> Data { Data(encodeToString(value).utf8) }

  public func encodeToString<T: Encodable>(_ value: T) -> String { JSON.stringify(encodeValue(value), indent: indent) }
}

/// `JSON.decode`'s coder with `JSONDecoder`'s shape.
public struct BloomJSONDecoder: Sendable {
  public init() {}

  public func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
    try JSON.decode(type, from: String(decoding: data, as: UTF8.self))
  }

  public func decode<T: Decodable>(_ type: T.Type, from text: String) throws -> T { try JSON.decode(type, from: text) }
}

// MARK: - Decoder

/// A Swift dictionary, whose order the encoder makes stable (sorted keys).
protocol UnorderedStringDictionary {}
extension Dictionary: UnorderedStringDictionary where Key == String {}

/// A map, whose members are decoded at the map's own `at` (as Bloom's `Dictionary.decode`).
protocol BloomMapCoding {}
extension Dictionary: BloomMapCoding {}
extension OrderedDictionary: BloomMapCoding {}

/// Reads a `JSONValue` with Bloom's semantics.
final class JSONValueDecoder: Decoder {
  let value: JSONValue
  /// Where the value is, for errors (`Post.author`).
  let at: String
  /// The type being read: its fields are `Type.field`.
  let typeName: String
  /// A map: its members are read at `at`.
  let isMap: Bool
  let codingPath: [CodingKey]
  var userInfo: [CodingUserInfoKey: Any] { [:] }

  init(_ value: JSONValue, at: String, typeName: String, isMap: Bool, codingPath: [CodingKey]) {
    self.value = value
    self.at = at
    self.typeName = typeName
    self.isMap = isMap
    self.codingPath = codingPath
  }

  /// The name a type's fields are reported under (`Post`, not `Bloom.Post` or `Array<Post>`).
  static func name<T>(_ type: T.Type) -> String {
    let full = String(describing: type)
    return full.split(separator: ".").last.map(String.init) ?? full
  }

  static func decode<T: Decodable>(_ type: T.Type, _ value: JSONValue, at: String, codingPath: [CodingKey]) throws -> T {
    func fail<U>(_ expected: String) throws -> U { try decodingFailure(value, at, expected) }
    switch type {
    case is String.Type:
      guard case .string(let s) = value else { return try fail("a string") }
      return s as! T
    case is Bool.Type:
      guard case .bool(let b) = value else { return try fail("a boolean") }
      return b as! T
    case is Double.Type:
      guard case .number(let n) = value else { return try fail("a number") }
      return n as! T
    case is Float.Type:
      guard case .number(let n) = value else { return try fail("a number") }
      return Float(n) as! T
    case is Date.Type:
      switch value {
      case .number(let ms):
        return Date.fromMilliseconds(ms) as! T
      case .string(let text):
        guard let date = Date.parse(iso8601: text) else { return try fail("an ISO 8601 date") }
        return date as! T
      default:
        return try fail("a date")
      }
    case is BloomURL.Type:
      guard case .string(let text) = value else { return try fail("a URL") }
      guard let url = BloomURL.parse(text) else { return try fail("an absolute URL") }
      return url as! T
    case is Foundation.URL.Type:
      guard case .string(let text) = value else { return try fail("a URL") }
      guard let url = Foundation.URL(string: text), url.scheme != nil else { return try fail("an absolute URL") }
      return url as! T
    case is JSONValue.Type:
      return value as! T
    default:
      break
    }
    if let integer = type as? any FixedWidthInteger.Type {
      guard case .number(let n) = value, n.rounded(.towardZero) == n, let v = integer.init(exactly: n) else {
        return try fail("an integer")
      }
      return v as! T
    }
    let decoder = JSONValueDecoder(value, at: at, typeName: name(type), isMap: type is BloomMapCoding.Type, codingPath: codingPath)
    do {
      return try T(from: decoder)
    } catch let error as DecodingError {
      // Swift's own (a raw-value enum's unknown case, a custom `init(from:)`'s).
      throw BloomDecodingError(at: at, expected: "a valid \(name(type))", found: described(value)).with(swift: error)
    }
  }

  func container<Key: CodingKey>(keyedBy type: Key.Type) throws -> KeyedDecodingContainer<Key> {
    guard case .object(let members) = value else { return try decodingFailure(value, at, "an object") }
    return KeyedDecodingContainer(Keyed<Key>(decoder: self, members: members))
  }

  func unkeyedContainer() throws -> UnkeyedDecodingContainer {
    guard case .array(let items) = value else { return try decodingFailure(value, at, "an array") }
    return Unkeyed(decoder: self, items: items)
  }

  func singleValueContainer() throws -> SingleValueDecodingContainer { Single(decoder: self) }

  struct Keyed<Key: CodingKey>: KeyedDecodingContainerProtocol {
    let decoder: JSONValueDecoder
    let members: OrderedDictionary<String, JSONValue>
    var codingPath: [CodingKey] { decoder.codingPath }
    var allKeys: [Key] { members.keys.compactMap { Key(stringValue: $0) } }

    func contains(_ key: Key) -> Bool { members[key.stringValue] != nil }

    private func member(_ key: Key) -> JSONValue { members[key.stringValue] ?? .absent }

    private func at(_ key: Key) -> String { decoder.isMap ? decoder.at : "\(decoder.typeName).\(key.stringValue)" }

    func decodeNil(forKey key: Key) throws -> Bool { member(key).isNull }

    func decode<T: Decodable>(_ type: T.Type, forKey key: Key) throws -> T {
      try JSONValueDecoder.decode(type, member(key), at: at(key), codingPath: codingPath + [key])
    }

    func decodeIfPresent<T: Decodable>(_ type: T.Type, forKey key: Key) throws -> T? {
      member(key).isNull ? nil : try decode(type, forKey: key)
    }

    func nestedContainer<NestedKey: CodingKey>(keyedBy type: NestedKey.Type, forKey key: Key) throws -> KeyedDecodingContainer<NestedKey> {
      try child(key).container(keyedBy: type)
    }

    func nestedUnkeyedContainer(forKey key: Key) throws -> UnkeyedDecodingContainer { try child(key).unkeyedContainer() }

    func superDecoder() throws -> Decoder { decoder }

    func superDecoder(forKey key: Key) throws -> Decoder { child(key) }

    private func child(_ key: Key) -> JSONValueDecoder {
      JSONValueDecoder(member(key), at: at(key), typeName: decoder.typeName, isMap: false, codingPath: codingPath + [key])
    }
  }

  struct Unkeyed: UnkeyedDecodingContainer {
    let decoder: JSONValueDecoder
    let items: [JSONValue]
    var currentIndex = 0
    var codingPath: [CodingKey] { decoder.codingPath }
    var count: Int? { items.count }
    var isAtEnd: Bool { currentIndex >= items.count }

    init(decoder: JSONValueDecoder, items: [JSONValue]) {
      self.decoder = decoder
      self.items = items
    }

    private mutating func next() throws -> JSONValue {
      guard !isAtEnd else { return try decodingFailure(.absent, decoder.at, "another item") }
      defer { currentIndex += 1 }
      return items[currentIndex]
    }

    mutating func decodeNil() throws -> Bool {
      if !isAtEnd && items[currentIndex].isNull {
        currentIndex += 1
        return true
      }
      return false
    }

    mutating func decode<T: Decodable>(_ type: T.Type) throws -> T {
      let key = BloomCodingKey(intValue: currentIndex)!
      return try JSONValueDecoder.decode(type, try next(), at: decoder.at, codingPath: codingPath + [key])
    }

    mutating func nestedContainer<NestedKey: CodingKey>(keyedBy type: NestedKey.Type) throws -> KeyedDecodingContainer<NestedKey> {
      try JSONValueDecoder(try next(), at: decoder.at, typeName: decoder.typeName, isMap: false, codingPath: codingPath).container(keyedBy: type)
    }

    mutating func nestedUnkeyedContainer() throws -> UnkeyedDecodingContainer {
      try JSONValueDecoder(try next(), at: decoder.at, typeName: decoder.typeName, isMap: false, codingPath: codingPath).unkeyedContainer()
    }

    mutating func superDecoder() throws -> Decoder {
      JSONValueDecoder(try next(), at: decoder.at, typeName: decoder.typeName, isMap: false, codingPath: codingPath)
    }
  }

  struct Single: SingleValueDecodingContainer {
    let decoder: JSONValueDecoder
    var codingPath: [CodingKey] { decoder.codingPath }

    func decodeNil() -> Bool { decoder.value.isNull }

    func decode<T: Decodable>(_ type: T.Type) throws -> T {
      if type == JSONValue.self { return decoder.value as! T }
      // The value itself: the same type would recurse into its own `init(from:)`.
      return try JSONValueDecoder.decode(type, decoder.value, at: decoder.at, codingPath: codingPath)
    }
  }
}

extension BloomDecodingError {
  /// Swift's error, kept for debugging (Bloom's message is the one shown).
  fileprivate func with(swift error: DecodingError) -> BloomDecodingError { self }
}

// MARK: - Encoder

/// A JSON value being built (containers write into it by reference).
final class JSONNode {
  enum Kind {
    case empty
    case value(JSONValue)
    case array([JSONNode])
    case object(OrderedDictionary<String, JSONNode>)
  }

  var kind: Kind = .empty
  /// A Swift `Dictionary`: its keys are sorted, Swift's order being unspecified.
  var sortKeys = false

  var value: JSONValue {
    switch kind {
    case .empty: return .absent
    case .value(let v): return v
    case .array(let items): return .array(items.map { $0.value == .absent ? .null : $0.value })
    case .object(let members):
      var out = OrderedDictionary<String, JSONValue>()
      let keys = sortKeys ? members.keys.sorted() : members.keys
      for k in keys {
        let v = members[k]!.value
        if v != .absent { out[k] = v }
      }
      return .object(out)
    }
  }

  func object() -> Void {
    if case .object = kind { return }
    kind = .object([:])
  }

  func array() {
    if case .array = kind { return }
    kind = .array([])
  }

  func set(_ key: String, _ node: JSONNode) {
    object()
    if case .object(var members) = kind {
      kind = .empty
      members[key] = node
      kind = .object(members)
    }
  }

  func append(_ node: JSONNode) {
    array()
    if case .array(var items) = kind {
      kind = .empty
      items.append(node)
      kind = .array(items)
    }
  }
}

/// Writes a `JSONValue` with Bloom's semantics.
final class JSONValueEncoder: Encoder {
  let node: JSONNode
  let codingPath: [CodingKey]
  var userInfo: [CodingUserInfoKey: Any] { [:] }

  init(node: JSONNode, codingPath: [CodingKey]) {
    self.node = node
    self.codingPath = codingPath
  }

  static func encode<T: Encodable>(_ value: T) throws -> JSONValue { try node(value, codingPath: []).value }

  static func node<T: Encodable>(_ value: T, codingPath: [CodingKey]) throws -> JSONNode {
    let n = JSONNode()
    switch value {
    case let s as String: n.kind = .value(.string(s))
    case let b as Bool: n.kind = .value(.bool(b))
    case let d as Double: n.kind = .value(.number(d))
    case let f as Float: n.kind = .value(.number(Double(f)))
    case let date as Date: n.kind = .value(.string(date.iso8601))
    case let url as BloomURL: n.kind = .value(.string(url.absoluteString))
    case let url as Foundation.URL: n.kind = .value(.string(url.absoluteString))
    case let json as JSONValue: n.kind = .value(json)
    case let i as any FixedWidthInteger: n.kind = .value(.number(Double(i)))
    default:
      n.sortKeys = value is UnorderedStringDictionary
      try value.encode(to: JSONValueEncoder(node: n, codingPath: codingPath))
    }
    return n
  }

  func store(_ value: JSONValue) { node.kind = .value(value) }

  func container<Key: CodingKey>(keyedBy type: Key.Type) -> KeyedEncodingContainer<Key> {
    node.object()
    return KeyedEncodingContainer(Keyed<Key>(encoder: self))
  }

  func unkeyedContainer() -> UnkeyedEncodingContainer {
    node.array()
    return Unkeyed(encoder: self)
  }

  func singleValueContainer() -> SingleValueEncodingContainer { Single(encoder: self) }

  struct Keyed<Key: CodingKey>: KeyedEncodingContainerProtocol {
    let encoder: JSONValueEncoder
    var codingPath: [CodingKey] { encoder.codingPath }

    mutating func encodeNil(forKey key: Key) throws {
      let n = JSONNode()
      n.kind = .value(.null)
      encoder.node.set(key.stringValue, n)
    }

    mutating func encode<T: Encodable>(_ value: T, forKey key: Key) throws {
      encoder.node.set(key.stringValue, try JSONValueEncoder.node(value, codingPath: codingPath + [key]))
    }

    mutating func nestedContainer<NestedKey: CodingKey>(keyedBy keyType: NestedKey.Type, forKey key: Key) -> KeyedEncodingContainer<NestedKey> {
      let n = JSONNode()
      encoder.node.set(key.stringValue, n)
      return JSONValueEncoder(node: n, codingPath: codingPath + [key]).container(keyedBy: keyType)
    }

    mutating func nestedUnkeyedContainer(forKey key: Key) -> UnkeyedEncodingContainer {
      let n = JSONNode()
      encoder.node.set(key.stringValue, n)
      return JSONValueEncoder(node: n, codingPath: codingPath + [key]).unkeyedContainer()
    }

    mutating func superEncoder() -> Encoder { encoder }

    mutating func superEncoder(forKey key: Key) -> Encoder {
      let n = JSONNode()
      encoder.node.set(key.stringValue, n)
      return JSONValueEncoder(node: n, codingPath: codingPath + [key])
    }
  }

  struct Unkeyed: UnkeyedEncodingContainer {
    let encoder: JSONValueEncoder
    var codingPath: [CodingKey] { encoder.codingPath }
    var count: Int {
      if case .array(let items) = encoder.node.kind { return items.count }
      return 0
    }

    mutating func encodeNil() throws {
      let n = JSONNode()
      n.kind = .value(.null)
      encoder.node.append(n)
    }

    mutating func encode<T: Encodable>(_ value: T) throws {
      encoder.node.append(try JSONValueEncoder.node(value, codingPath: codingPath + [BloomCodingKey(intValue: count)!]))
    }

    mutating func nestedContainer<NestedKey: CodingKey>(keyedBy keyType: NestedKey.Type) -> KeyedEncodingContainer<NestedKey> {
      let n = JSONNode()
      encoder.node.append(n)
      return JSONValueEncoder(node: n, codingPath: codingPath).container(keyedBy: keyType)
    }

    mutating func nestedUnkeyedContainer() -> UnkeyedEncodingContainer {
      let n = JSONNode()
      encoder.node.append(n)
      return JSONValueEncoder(node: n, codingPath: codingPath).unkeyedContainer()
    }

    mutating func superEncoder() -> Encoder {
      let n = JSONNode()
      encoder.node.append(n)
      return JSONValueEncoder(node: n, codingPath: codingPath)
    }
  }

  struct Single: SingleValueEncodingContainer {
    let encoder: JSONValueEncoder
    var codingPath: [CodingKey] { encoder.codingPath }

    mutating func encodeNil() throws { encoder.node.kind = .value(.null) }

    mutating func encode<T: Encodable>(_ value: T) throws {
      encoder.node.kind = try JSONValueEncoder.node(value, codingPath: codingPath).kind
    }
  }
}
