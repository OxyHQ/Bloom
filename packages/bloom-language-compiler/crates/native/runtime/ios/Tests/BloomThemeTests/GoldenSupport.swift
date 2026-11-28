// The goldens are the TypeScript's own output, read from the repo (there is no Swift copy):
// src/theme/__tests__/fixtures/*.json(l) and __fixtures__/golden-resolved-tokens.json. This
// file is an order-preserving JSON reader and a writer that prints exactly what
// `JSON.stringify` prints, so a test compares text, never a tolerance.
import Foundation
@testable import BloomTheme

/// The repository root, from this file's path (Tests/BloomThemeTests/ → … → the repo).
let repoRoot: URL = {
  var url = URL(fileURLWithPath: #filePath)
  for _ in 0..<9 { url.deleteLastPathComponent() }
  return url
}()

func repoText(_ path: String) throws -> String {
  try String(contentsOf: repoRoot.appendingPathComponent(path), encoding: .utf8)
}

/// A JSON value with its object members in document order.
indirect enum JS: Equatable {
  case null
  case bool(Bool)
  case number(Double)
  case string(String)
  case array([JS])
  case object([(String, JS)])

  static func == (lhs: JS, rhs: JS) -> Bool { lhs.compact == rhs.compact }

  subscript(key: String) -> JS? {
    if case .object(let members) = self { return members.first { $0.0 == key }?.1 }
    return nil
  }

  var string: String? { if case .string(let s) = self { return s } else { return nil } }
  var number: Double? { if case .number(let n) = self { return n } else { return nil } }
  var bool: Bool? { if case .bool(let b) = self { return b } else { return nil } }
  var array: [JS]? { if case .array(let a) = self { return a } else { return nil } }
  var members: [(String, JS)]? { if case .object(let m) = self { return m } else { return nil } }

  /// `JSON.stringify(value)`.
  var compact: String {
    var out = ""
    write(&out, indent: nil, depth: 0)
    return out
  }

  /// `JSON.stringify(value, null, 2)`.
  var pretty: String {
    var out = ""
    write(&out, indent: "  ", depth: 0)
    return out
  }

  private func write(_ out: inout String, indent: String?, depth: Int) {
    switch self {
    case .null: out += "null"
    case .bool(let b): out += b ? "true" : "false"
    case .number(let n): out += n.isFinite ? jsNumberString(n) : "null"
    case .string(let s): JS.quote(s, into: &out)
    case .array(let items):
      if items.isEmpty { out += "[]"; return }
      out += "["
      for (i, item) in items.enumerated() {
        if i > 0 { out += "," }
        if let indent { out += "\n" + String(repeating: indent, count: depth + 1) }
        item.write(&out, indent: indent, depth: depth + 1)
      }
      if let indent { out += "\n" + String(repeating: indent, count: depth) }
      out += "]"
    case .object(let members):
      if members.isEmpty { out += "{}"; return }
      out += "{"
      for (i, (key, value)) in members.enumerated() {
        if i > 0 { out += "," }
        if let indent { out += "\n" + String(repeating: indent, count: depth + 1) }
        JS.quote(key, into: &out)
        out += indent == nil ? ":" : ": "
        value.write(&out, indent: indent, depth: depth + 1)
      }
      if let indent { out += "\n" + String(repeating: indent, count: depth) }
      out += "}"
    }
  }

  private static func quote(_ s: String, into out: inout String) {
    out += "\""
    for scalar in s.unicodeScalars {
      switch scalar {
      case "\"": out += "\\\""
      case "\\": out += "\\\\"
      case "\u{08}": out += "\\b"
      case "\u{0C}": out += "\\f"
      case "\n": out += "\\n"
      case "\r": out += "\\r"
      case "\t": out += "\\t"
      default:
        if scalar.value < 0x20 {
          let hex = String(scalar.value, radix: 16)
          out += "\\u" + String(repeating: "0", count: 4 - hex.count) + hex
        } else {
          out.unicodeScalars.append(scalar)
        }
      }
    }
    out += "\""
  }

  /// Parse JSON text, keeping member order.
  static func parse(_ text: String) throws -> JS {
    var parser = Parser(Array(text.utf8))
    let value = try parser.value()
    parser.skip()
    guard parser.i == parser.bytes.count else { throw Parser.Failure.trailing }
    return value
  }

  private struct Parser {
    enum Failure: Error { case unexpected(Int), trailing }
    let bytes: [UInt8]
    var i = 0
    init(_ bytes: [UInt8]) { self.bytes = bytes }

    mutating func skip() {
      while i < bytes.count, [0x20, 0x0A, 0x0D, 0x09].contains(bytes[i]) { i += 1 }
    }

    mutating func value() throws -> JS {
      skip()
      guard i < bytes.count else { throw Failure.unexpected(i) }
      switch bytes[i] {
      case UInt8(ascii: "{"):
        i += 1
        var members: [(String, JS)] = []
        skip()
        if bytes[i] == UInt8(ascii: "}") { i += 1; return .object(members) }
        while true {
          skip()
          guard case .string(let key) = try value() else { throw Failure.unexpected(i) }
          skip()
          guard bytes[i] == UInt8(ascii: ":") else { throw Failure.unexpected(i) }
          i += 1
          let v = try value()
          if let at = members.firstIndex(where: { $0.0 == key }) { members[at].1 = v } else { members.append((key, v)) }
          skip()
          if bytes[i] == UInt8(ascii: ",") { i += 1; continue }
          guard bytes[i] == UInt8(ascii: "}") else { throw Failure.unexpected(i) }
          i += 1
          return .object(members)
        }
      case UInt8(ascii: "["):
        i += 1
        var items: [JS] = []
        skip()
        if bytes[i] == UInt8(ascii: "]") { i += 1; return .array(items) }
        while true {
          items.append(try value())
          skip()
          if bytes[i] == UInt8(ascii: ",") { i += 1; continue }
          guard bytes[i] == UInt8(ascii: "]") else { throw Failure.unexpected(i) }
          i += 1
          return .array(items)
        }
      case UInt8(ascii: "\""):
        i += 1
        var scalars = String.UnicodeScalarView()
        var raw: [UInt8] = []
        func flush() {
          if !raw.isEmpty { scalars.append(contentsOf: String(decoding: raw, as: UTF8.self).unicodeScalars); raw = [] }
        }
        while bytes[i] != UInt8(ascii: "\"") {
          if bytes[i] == UInt8(ascii: "\\") {
            flush()
            i += 1
            switch bytes[i] {
            case UInt8(ascii: "n"): scalars.append("\n")
            case UInt8(ascii: "t"): scalars.append("\t")
            case UInt8(ascii: "r"): scalars.append("\r")
            case UInt8(ascii: "b"): scalars.append("\u{08}")
            case UInt8(ascii: "f"): scalars.append("\u{0C}")
            case UInt8(ascii: "u"):
              let hex = String(decoding: bytes[(i + 1)...(i + 4)], as: UTF8.self)
              scalars.append(Unicode.Scalar(UInt32(hex, radix: 16)!) ?? "\u{FFFD}")
              i += 4
            default: scalars.append(Unicode.Scalar(bytes[i]))
            }
            i += 1
          } else {
            raw.append(bytes[i])
            i += 1
          }
        }
        flush()
        i += 1
        return .string(String(scalars))
      case UInt8(ascii: "t"): i += 4; return .bool(true)
      case UInt8(ascii: "f"): i += 5; return .bool(false)
      case UInt8(ascii: "n"): i += 4; return .null
      default:
        let start = i
        while i < bytes.count, "+-0123456789.eE".utf8.contains(bytes[i]) { i += 1 }
        guard let n = Double(String(decoding: bytes[start..<i], as: UTF8.self)) else { throw Failure.unexpected(start) }
        return .number(n)
      }
    }
  }
}

/// One `{"id":…,"input":…,"output":…}` golden line: its parsed input and the exact text of its
/// output, which the test reproduces.
struct GoldenLine {
  let id: String
  let input: JS
  let output: String
}

func goldenLines(_ file: String) throws -> [GoldenLine] {
  try repoText("src/theme/__tests__/fixtures/" + file).split(separator: "\n").map { line in
    let text = String(line)
    guard let marker = text.range(of: ",\"output\":") else { throw JS.ParseError.noOutput(text) }
    let head = try JS.parse(String(text[..<marker.lowerBound]) + "}")
    let output = String(text[marker.upperBound...].dropLast())
    return GoldenLine(id: head["id"]!.string!, input: head["input"]!, output: output)
  }
}

extension JS {
  enum ParseError: Error { case noOutput(String) }
}

// MARK: - BloomTheme values as JSON, in the TypeScript's member order

extension TokenMap {
  var js: JS { .object(map { ($0.0, .string($0.1)) }) }
}

extension ThemeColors {
  var js: JS { .object(ThemeColorField.allCases.map { ($0.rawValue, .string(self[$0])) }) }
}

extension Array where Element == ThemeChartColor {
  var js: JS { .array(map { .object([("color", .string($0.color)), ("activeColor", .string($0.activeColor))]) }) }
}

extension AccentColors {
  var js: JS { .object([("background", .string(background)), ("foreground", .string(foreground)), ("border", .string(border))]) }
}

extension SRGB {
  var js: JS { .object([("r", .number(r)), ("g", .number(g)), ("b", .number(b)), ("a", .number(a))]) }
}

/// Mismatched golden ids with the first difference, for a readable failure.
struct Mismatches: CustomStringConvertible {
  private(set) var ids: [String] = []
  private var first: [String] = []
  var total = 0

  mutating func check(_ line: GoldenLine, _ actual: String) {
    total += 1
    guard actual != line.output else { return }
    ids.append(line.id)
    if first.count < 3 {
      let a = Array(actual), e = Array(line.output)
      var at = 0
      while at < min(a.count, e.count), a[at] == e[at] { at += 1 }
      let lo = max(0, at - 60)
      first.append(
        "\(line.id) at \(at):\n  swift: …\(String(a[lo..<min(a.count, at + 60)]))\n  ts:    …\(String(e[lo..<min(e.count, at + 60)]))")
    }
  }

  var isEmpty: Bool { ids.isEmpty }
  var description: String { "\(ids.count)/\(total) differ: \(ids.prefix(20))\n" + first.joined(separator: "\n") }
}

func hexBytes(_ hex: String) -> [UInt8] {
  var out: [UInt8] = []
  out.reserveCapacity(hex.utf8.count / 2)
  var it = hex.utf8.makeIterator()
  func nibble(_ c: UInt8) -> UInt8 { c <= 57 ? c - 48 : (c | 0x20) - 87 }
  while let hi = it.next(), let lo = it.next() { out.append(nibble(hi) << 4 | nibble(lo)) }
  return out
}
