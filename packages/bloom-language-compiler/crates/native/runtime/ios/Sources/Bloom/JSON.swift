// Bloom (I/O): `JSONValue` and `JSON.parse` / `JSON.stringify`, byte-identical to JS's
// `JSON.parse` and `JSON.stringify`: objects keep JS's key order (`OrderedDictionary`),
// numbers are written as JS writes them (`1` for 1.0, `1e+21`), and the escapes are JS's
// (`"`, `\\`, the control characters; `/` and non-ASCII are written as they are).
import Foundation

/// A JSON value as parsed: what the derived decoders read. `absent` is a missing member
/// (JS's `undefined`): left out of an object, `null` in an array, as `JSON.stringify` does.
public enum JSONValue: Sendable, Hashable {
  case absent
  case null
  case bool(Bool)
  case number(Double)
  case string(String)
  case array([JSONValue])
  case object(OrderedDictionary<String, JSONValue>)
}

extension JSONValue {
  /// `null`, `bool`, `number`, `string`, `array`, `object` or `absent` (the runtime's `jsonKind`).
  public var kind: String {
    switch self {
    case .absent: return "absent"
    case .null: return "null"
    case .bool: return "bool"
    case .number: return "number"
    case .string: return "string"
    case .array: return "array"
    case .object: return "object"
    }
  }

  /// The member `key` of an object (absent when it has none, or is not an object).
  public subscript(key: String) -> JSONValue {
    if case .object(let o) = self { return o[key] ?? .absent }
    return .absent
  }

  /// The item at `index` of an array (absent past its ends, or when it is not an array).
  public subscript(index: Int) -> JSONValue {
    if case .array(let a) = self, index >= 0, index < a.count { return a[index] }
    return .absent
  }

  /// `value["key"]` in Bloom: the member `key` of an object, `none` when the value is not an
  /// object or has nothing there (a lenient read, the checker's `json_reads`).
  public func read(_ key: String) -> JSONValue? {
    if case .object(let o) = self { return o[key] }
    return nil
  }

  /// `value[i]` in Bloom: the item at `index` of an array, `none` past its ends or when the value
  /// is not an array.
  public func read(_ index: Int) -> JSONValue? {
    if case .array(let a) = self, index >= 0, index < a.count { return a[index] }
    return nil
  }

  /// The string, when it is one.
  public var stringValue: String? {
    if case .string(let s) = self { return s }
    return nil
  }

  /// The number, when it is one.
  public var numberValue: Double? {
    if case .number(let n) = self { return n }
    return nil
  }

  /// The boolean, when it is one.
  public var boolValue: Bool? {
    if case .bool(let b) = self { return b }
    return nil
  }

  /// The items, when it is an array.
  public var arrayValue: [JSONValue]? {
    if case .array(let a) = self { return a }
    return nil
  }

  /// The members, when it is an object.
  public var objectValue: OrderedDictionary<String, JSONValue>? {
    if case .object(let o) = self { return o }
    return nil
  }

  /// Whether it is `null` or absent.
  public var isNull: Bool { self == .null || self == .absent }
}

extension JSONValue: ExpressibleByNilLiteral, ExpressibleByBooleanLiteral, ExpressibleByIntegerLiteral,
  ExpressibleByFloatLiteral, ExpressibleByStringLiteral, ExpressibleByArrayLiteral, ExpressibleByDictionaryLiteral
{
  public init(nilLiteral: ()) { self = .null }
  public init(booleanLiteral value: Bool) { self = .bool(value) }
  public init(integerLiteral value: Int) { self = .number(Double(value)) }
  public init(floatLiteral value: Double) { self = .number(value) }
  public init(stringLiteral value: String) { self = .string(value) }
  public init(arrayLiteral elements: JSONValue...) { self = .array(elements) }
  public init(dictionaryLiteral elements: (String, JSONValue)...) { self = .object(OrderedDictionary(elements)) }
}

/// Text that is not JSON (JS's `SyntaxError` from `JSON.parse`).
public struct JSONSyntaxError: Error, Equatable, Sendable, LocalizedError, CustomStringConvertible {
  /// What was wrong.
  public let message: String
  /// The UTF-8 offset where it went wrong.
  public let offset: Int

  public var errorDescription: String? { message }
  public var description: String { message }
}

/// Bloom's `JSON`: parsing, writing, and `Codable` values to and from JSON text.
public enum JSON {
  /// `text` parsed (throws a `JSONSyntaxError` on invalid JSON, as `JSON.parse`).
  public static func parse(_ text: String) throws -> JSONValue {
    var parser = JSONParser(Array(text.utf8))
    return try parser.document()
  }

  /// `value` as JSON text; `indent` spaces per level (0: on one line; at most 10, as JS).
  public static func stringify(_ value: JSONValue, indent: Int = 0) -> String {
    let gap = String(repeating: " ", count: Swift.min(Swift.max(indent, 0), 10))
    var out = ""
    if !write(value, gap: gap, current: "", into: &out) { return "null" }
    return out
  }

  /// The `T` that `text` holds (`JSON.decode(Post.self, from: text)`); throws a
  /// `BloomDecodingError` naming the field that did not decode.
  public static func decode<T: Decodable>(_ type: T.Type, from text: String) throws -> T {
    try decodeValue(type, from: try parse(text), at: "JSON")
  }

  /// `value` as JSON text (`JSON.encode(Post.self, post)`).
  public static func encode<T: Encodable>(_ type: T.Type, _ value: T, indent: Int = 0) -> String {
    stringify(encodeValue(value), indent: indent)
  }

  /// Writes `value`; false when it writes nothing (absent at the top).
  private static func write(_ value: JSONValue, gap: String, current: String, into out: inout String) -> Bool {
    switch value {
    case .absent:
      return false
    case .null:
      out += "null"
    case .bool(let b):
      out += b ? "true" : "false"
    case .number(let n):
      out += n.isFinite ? stringOfNumber(n) : "null"
    case .string(let s):
      quote(s, into: &out)
    case .array(let items):
      if items.isEmpty {
        out += "[]"
        return true
      }
      let inner = current + gap
      out += "["
      for (i, item) in items.enumerated() {
        if i > 0 { out += "," }
        if !gap.isEmpty { out += "\n" + inner }
        if !write(item, gap: gap, current: inner, into: &out) { out += "null" }
      }
      if !gap.isEmpty { out += "\n" + current }
      out += "]"
    case .object(let members):
      let inner = current + gap
      var first = true
      out += "{"
      for (key, member) in members where member != .absent {
        if !first { out += "," }
        first = false
        if !gap.isEmpty { out += "\n" + inner }
        quote(key, into: &out)
        out += gap.isEmpty ? ":" : ": "
        _ = write(member, gap: gap, current: inner, into: &out)
      }
      if !first && !gap.isEmpty { out += "\n" + current }
      out += "}"
    }
    return true
  }

  /// JS's `QuoteJSONString`.
  static func quote(_ s: String, into out: inout String) {
    out += "\""
    for u in s.unicodeScalars {
      switch u {
      case "\"": out += "\\\""
      case "\\": out += "\\\\"
      case "\u{08}": out += "\\b"
      case "\u{0C}": out += "\\f"
      case "\n": out += "\\n"
      case "\r": out += "\\r"
      case "\t": out += "\\t"
      default:
        if u.value < 0x20 {
          let hex = String(u.value, radix: 16)
          out += "\\u" + String(repeating: "0", count: 4 - hex.count) + hex
        } else {
          out.unicodeScalars.append(u)
        }
      }
    }
    out += "\""
  }
}

/// JSON's grammar (RFC 8259, as `JSON.parse` reads it): no comments, no trailing commas; a
/// repeated key keeps its first position and its last value.
struct JSONParser {
  let bytes: [UInt8]
  var i = 0

  init(_ bytes: [UInt8]) { self.bytes = bytes }

  mutating func document() throws -> JSONValue {
    skip()
    let value = try self.value()
    skip()
    if i != bytes.count { throw fail("Unexpected non-whitespace character after JSON") }
    return value
  }

  func fail(_ what: String) -> JSONSyntaxError {
    JSONSyntaxError(message: "\(what) at position \(i)", offset: i)
  }

  mutating func skip() {
    while i < bytes.count, [0x20, 0x09, 0x0A, 0x0D].contains(bytes[i]) { i += 1 }
  }

  mutating func literal(_ word: String, _ value: JSONValue) throws -> JSONValue {
    let w = Array(word.utf8)
    guard i + w.count <= bytes.count, Array(bytes[i..<(i + w.count)]) == w else { throw fail("Unexpected token") }
    i += w.count
    return value
  }

  mutating func value() throws -> JSONValue {
    guard i < bytes.count else { throw fail("Unexpected end of JSON input") }
    switch bytes[i] {
    case UInt8(ascii: "{"):
      i += 1
      var members = OrderedDictionary<String, JSONValue>()
      skip()
      if i < bytes.count && bytes[i] == UInt8(ascii: "}") {
        i += 1
        return .object(members)
      }
      while true {
        skip()
        guard i < bytes.count, bytes[i] == UInt8(ascii: "\"") else { throw fail("Expected property name") }
        let key = try string()
        skip()
        guard i < bytes.count, bytes[i] == UInt8(ascii: ":") else { throw fail("Expected ':' after property name") }
        i += 1
        skip()
        members[key] = try value()
        skip()
        guard i < bytes.count else { throw fail("Unexpected end of JSON input") }
        if bytes[i] == UInt8(ascii: ",") {
          i += 1
          continue
        }
        guard bytes[i] == UInt8(ascii: "}") else { throw fail("Expected ',' or '}' after property value") }
        i += 1
        return .object(members)
      }
    case UInt8(ascii: "["):
      i += 1
      var items: [JSONValue] = []
      skip()
      if i < bytes.count && bytes[i] == UInt8(ascii: "]") {
        i += 1
        return .array(items)
      }
      while true {
        skip()
        items.append(try value())
        skip()
        guard i < bytes.count else { throw fail("Unexpected end of JSON input") }
        if bytes[i] == UInt8(ascii: ",") {
          i += 1
          continue
        }
        guard bytes[i] == UInt8(ascii: "]") else { throw fail("Expected ',' or ']' after array element") }
        i += 1
        return .array(items)
      }
    case UInt8(ascii: "\""):
      return .string(try string())
    case UInt8(ascii: "t"):
      return try literal("true", .bool(true))
    case UInt8(ascii: "f"):
      return try literal("false", .bool(false))
    case UInt8(ascii: "n"):
      return try literal("null", .null)
    default:
      return .number(try number())
    }
  }

  mutating func number() throws -> Double {
    let start = i
    func digit() -> Bool { i < bytes.count && bytes[i] >= 48 && bytes[i] <= 57 }
    if i < bytes.count && bytes[i] == UInt8(ascii: "-") { i += 1 }
    guard digit() else { throw fail("Unexpected token") }
    if bytes[i] == 48 {
      i += 1
    } else {
      while digit() { i += 1 }
    }
    if i < bytes.count && bytes[i] == UInt8(ascii: ".") {
      i += 1
      guard digit() else { throw fail("Unterminated fractional number") }
      while digit() { i += 1 }
    }
    if i < bytes.count && (bytes[i] == UInt8(ascii: "e") || bytes[i] == UInt8(ascii: "E")) {
      i += 1
      if i < bytes.count && (bytes[i] == UInt8(ascii: "+") || bytes[i] == UInt8(ascii: "-")) { i += 1 }
      guard digit() else { throw fail("Exponent part is missing a number") }
      while digit() { i += 1 }
    }
    return Double(String(decoding: bytes[start..<i], as: UTF8.self))!
  }

  mutating func string() throws -> String {
    i += 1
    var units: [UInt16] = []
    var runStart = i
    func flush(_ end: Int) {
      if end > runStart { units.append(contentsOf: String(decoding: bytes[runStart..<end], as: UTF8.self).utf16) }
    }
    while true {
      guard i < bytes.count else { throw fail("Unterminated string in JSON") }
      let c = bytes[i]
      if c == UInt8(ascii: "\"") {
        flush(i)
        i += 1
        return String(decoding: units, as: UTF16.self)
      }
      if c < 0x20 { throw fail("Bad control character in string literal") }
      if c == UInt8(ascii: "\\") {
        flush(i)
        i += 1
        guard i < bytes.count else { throw fail("Unterminated string in JSON") }
        switch bytes[i] {
        case UInt8(ascii: "\""): units.append(0x22)
        case UInt8(ascii: "\\"): units.append(0x5C)
        case UInt8(ascii: "/"): units.append(0x2F)
        case UInt8(ascii: "b"): units.append(0x08)
        case UInt8(ascii: "f"): units.append(0x0C)
        case UInt8(ascii: "n"): units.append(0x0A)
        case UInt8(ascii: "r"): units.append(0x0D)
        case UInt8(ascii: "t"): units.append(0x09)
        case UInt8(ascii: "u"):
          guard i + 4 < bytes.count else { throw fail("Bad Unicode escape") }
          var v = 0
          for k in 1...4 {
            guard let d = hexDigit(bytes[i + k]) else { throw fail("Bad Unicode escape") }
            v = v * 16 + d
          }
          units.append(UInt16(v))
          i += 4
        default:
          throw fail("Bad escaped character")
        }
        i += 1
        runStart = i
        continue
      }
      i += 1
    }
  }
}

extension JSONValue: Codable {
  public init(from decoder: Decoder) throws {
    if let d = decoder as? JSONValueDecoder {
      self = d.value
      return
    }
    let c = try decoder.singleValueContainer()
    if c.decodeNil() {
      self = .null
    } else if let b = try? c.decode(Bool.self) {
      self = .bool(b)
    } else if let n = try? c.decode(Double.self) {
      self = .number(n)
    } else if let s = try? c.decode(String.self) {
      self = .string(s)
    } else if let a = try? c.decode([JSONValue].self) {
      self = .array(a)
    } else {
      self = .object(try c.decode(OrderedDictionary<String, JSONValue>.self))
    }
  }

  public func encode(to encoder: Encoder) throws {
    if let e = encoder as? JSONValueEncoder {
      e.store(self)
      return
    }
    var c = encoder.singleValueContainer()
    switch self {
    case .absent, .null: try c.encodeNil()
    case .bool(let b): try c.encode(b)
    case .number(let n): try c.encode(n)
    case .string(let s): try c.encode(s)
    case .array(let a): try c.encode(a)
    case .object(let o): try c.encode(o)
    }
  }
}
