// Bloom (I/O): `URL` and its query items, parsed and written as JS's `URL` (the WHATWG URL
// standard) does: `HTTPS://A.b:443/x/../y` is `https://a.b/y`, a special scheme's empty path
// is `/`, non-ASCII is percent-encoded as UTF-8 and a non-ASCII host is punycode.
//
// Foundation's `URL` keeps text as given (no normalisation), has optional parts and decodes its
// `path`, so Bloom's is its own type, `BloomURL` (`foundationURL` converts).
//
// Not covered (JS normalises them, this parser keeps them as written): IPv4 hosts in other
// radixes (`0x7f.1`), IPv6 compression (`[0:0::1]`), and UTS 46 mapping beyond lower-casing
// and NFC before punycode.
import Foundation

/// What the runtime reads of a URL (JS `URL`'s parts).
public struct URLParts: Equatable, Hashable, Sendable {
  public let href: String
  public let scheme: String
  public let host: String
  public let port: String
  public let path: String
  public let query: String
  public let fragment: String
}

/// One `name=value` of a query (both decoded). Foundation's `URLQueryItem` has an optional value.
public struct BloomURLQueryItem: Equatable, Hashable, Sendable {
  public let name: String
  public let value: String

  public init(name: String, value: String) {
    self.name = name
    self.value = value
  }
}

/// Bloom's `URL`: an absolute URL (`https://host/path?query#fragment`), normalised as JS's.
public struct BloomURL: Hashable, Sendable, CustomStringConvertible {
  let parsed: ParsedURL

  /// The URL as text, normalised (`https://a.b/c?d=1`).
  public var absoluteString: String { parsed.href }
  /// `https`, `mailto`, …
  public var scheme: String { parsed.scheme }
  /// The host name, without the port (`""` when there is none).
  public var host: String { parsed.host ?? "" }
  /// The port when written (and not the scheme's default), else `none`.
  public var port: Int? { parsed.port.flatMap { Int($0) } }
  /// The path, from its `/`, percent-encoded as written.
  public var path: String { parsed.path }
  /// The query, without its `?`.
  public var query: String { parsed.query ?? "" }
  /// The fragment, without its `#`.
  public var fragment: String { parsed.fragment ?? "" }

  public var description: String { absoluteString }

  /// The runtime's parts of the URL.
  public var parts: URLParts {
    URLParts(href: absoluteString, scheme: scheme, host: host, port: parsed.port ?? "", path: path, query: query, fragment: fragment)
  }

  /// `text` as an absolute URL, or `none` when it is not one.
  public static func parse(_ text: String) -> BloomURL? { ParsedURL.parse(text, base: nil).map(BloomURL.init(parsed:)) }

  /// `text` resolved against `base` (`"../a"`, `"/b"`, `"?c=1"`), or `none`.
  public static func resolve(_ text: String, against base: BloomURL) -> BloomURL? {
    ParsedURL.parse(text, base: base.parsed).map(BloomURL.init(parsed:))
  }

  /// The query's items, in order, decoded.
  public var queryItems: [BloomURLQueryItem] {
    query.isEmpty
      ? []
      : query.split("&").map { pair in
        let parts = pair.split("=")
        return BloomURLQueryItem(name: percentDecoded(parts.first ?? ""), value: percentDecoded(parts.dropFirst(1).joined("=")))
      }
  }

  /// The value of the query item `name`, or `none`.
  public func queryValue(_ name: String) -> String? { queryItems.first { $0.name == name }?.value }

  /// The path's segments, decoded (`/a/b` is `["a", "b"]`).
  public var pathComponents: [String] { path.split("/").filter { !$0.isEmpty }.map(percentDecoded) }

  /// The last path segment, or `""`.
  public var lastPathComponent: String { pathComponents.last ?? "" }

  /// The URL with `path` added after its own (each segment percent-encoded), keeping its query.
  public func appending(path: String) -> BloomURL {
    let segments = path.split("/").filter { !$0.isEmpty }.map(percentEncoded).joined("/")
    let base = self.path.endsWith("/") ? self.path : self.path + "/"
    return with(path: segments.isEmpty ? self.path : base + segments, query: query)
  }

  /// The URL with `items` added to its query (percent-encoded), in key order.
  public func appendingQuery(_ items: OrderedDictionary<String, String>) -> BloomURL {
    let added = items.sortedEntries.map { "\(percentEncoded($0.0))=\(percentEncoded($0.1))" }.joined(separator: "&")
    let q = query.isEmpty ? added : (added.isEmpty ? query : query + "&" + added)
    return with(path: path, query: q)
  }

  /// The URL with this path and query, the rest kept.
  private func with(path: String, query: String) -> BloomURL {
    let port = self.port.map { ":\($0)" } ?? ""
    let q = query.isEmpty ? "" : "?\(query)"
    let f = fragment.isEmpty ? "" : "#\(fragment)"
    return BloomURL.parse("\(scheme)://\(host)\(port)\(path)\(q)\(f)") ?? self
  }

  /// The URL as Foundation's.
  public var foundationURL: Foundation.URL? { Foundation.URL(string: absoluteString) }

  /// Foundation's URL as Bloom's (normalised), or `none` when it is not absolute.
  public init?(_ url: Foundation.URL) {
    guard let parsed = ParsedURL.parse(url.absoluteString, base: nil) else { return nil }
    self.parsed = parsed
  }

  init(parsed: ParsedURL) { self.parsed = parsed }

  public static func == (a: BloomURL, b: BloomURL) -> Bool { a.absoluteString == b.absoluteString }
  public func hash(into hasher: inout Hasher) { hasher.combine(absoluteString) }
}

extension BloomURL: Codable {
  public init(from decoder: Decoder) throws {
    let c = try decoder.singleValueContainer()
    let text = try c.decode(String.self)
    guard let url = BloomURL.parse(text) else { throw DecodingError.dataCorruptedError(in: c, debugDescription: "not an absolute URL: \(text)") }
    self = url
  }

  public func encode(to encoder: Encoder) throws {
    var c = encoder.singleValueContainer()
    try c.encode(absoluteString)
  }
}

/// `text` percent-encoded for a URL's path segment or query value (JS's `encodeURIComponent`).
public func percentEncoded(_ text: String) -> String {
  var out = ""
  for byte in text.utf8 {
    switch byte {
    case UInt8(ascii: "A")...UInt8(ascii: "Z"), UInt8(ascii: "a")...UInt8(ascii: "z"), UInt8(ascii: "0")...UInt8(ascii: "9"):
      out.unicodeScalars.append(Unicode.Scalar(byte))
    case UInt8(ascii: "-"), UInt8(ascii: "_"), UInt8(ascii: "."), UInt8(ascii: "!"), UInt8(ascii: "~"), UInt8(ascii: "*"),
      UInt8(ascii: "'"), UInt8(ascii: "("), UInt8(ascii: ")"):
      out.unicodeScalars.append(Unicode.Scalar(byte))
    default:
      out += percentByte(byte)
    }
  }
  return out
}

/// `text` with its percent-escapes (and `+` spaces) decoded; unchanged when an escape is not
/// valid UTF-8 (JS's `decodeURIComponent` throwing, which the runtime catches).
public func percentDecoded(_ text: String) -> String {
  decodeURIComponent(text.replacingOccurrences(of: "+", with: " ")) ?? text
}

/// JS's `decodeURIComponent`, or `none` where it throws.
func decodeURIComponent(_ text: String) -> String? {
  let bytes = Array(text.utf8)
  var out: [UInt8] = []
  var i = 0
  while i < bytes.count {
    if bytes[i] == UInt8(ascii: "%") {
      guard i + 2 < bytes.count, let h = hexDigit(bytes[i + 1]), let l = hexDigit(bytes[i + 2]) else { return nil }
      out.append(UInt8(h * 16 + l))
      i += 3
    } else {
      out.append(bytes[i])
      i += 1
    }
  }
  return String(validating: out, as: UTF8.self)
}

private func percentByte(_ byte: UInt8) -> String {
  let hex = String(byte, radix: 16, uppercase: true)
  return "%" + (hex.count == 1 ? "0" + hex : hex)
}

// MARK: - The WHATWG parser (the parts Bloom needs)

private let specialPorts: [String: String] = ["http": "80", "https": "443", "ws": "80", "wss": "443", "ftp": "21", "file": ""]

private enum EncodeSet {
  case c0, fragment, query, specialQuery, path, userinfo

  func contains(_ b: UInt8) -> Bool {
    if b < 0x20 || b > 0x7E { return true }
    let fragment: Set<UInt8> = [0x20, 0x22, 0x3C, 0x3E, 0x60]
    let query: Set<UInt8> = [0x20, 0x22, 0x23, 0x3C, 0x3E]
    let path = query.union([0x3F, 0x5E, 0x60, 0x7B, 0x7D])
    switch self {
    case .c0: return false
    case .fragment: return fragment.contains(b)
    case .query: return query.contains(b)
    case .specialQuery: return query.contains(b) || b == 0x27
    case .path: return path.contains(b)
    case .userinfo: return path.union([0x2F, 0x3A, 0x3B, 0x3D, 0x40, 0x5B, 0x5C, 0x5D, 0x7C]).contains(b)
    }
  }
}

private func encode(_ s: Substring, _ set: EncodeSet) -> String {
  var out = ""
  for b in s.utf8 {
    if set.contains(b) { out += percentByte(b) } else { out.unicodeScalars.append(Unicode.Scalar(b)) }
  }
  return out
}

/// A parsed URL: the WHATWG record, with `nil` for a null host, query or fragment.
struct ParsedURL: Hashable, Sendable {
  var scheme: String
  var username = ""
  var password = ""
  var host: String?
  var port: String?
  var path: String
  /// A path that is not a list of segments (`mailto:a@b`).
  var opaque = false
  var query: String?
  var fragment: String?

  var special: Bool { specialPorts[scheme] != nil }

  var href: String {
    var out = scheme + ":"
    if let host {
      out += "//"
      if !username.isEmpty || !password.isEmpty {
        out += username + (password.isEmpty ? "" : ":" + password) + "@"
      }
      out += host
      if let port { out += ":" + port }
    } else if !opaque && path.hasPrefix("//") {
      out += "/."
    }
    out += path
    if let query { out += "?" + query }
    if let fragment { out += "#" + fragment }
    return out
  }

  static func parse(_ input: String, base: ParsedURL?) -> ParsedURL? {
    // Leading and trailing C0 controls and spaces go; tabs and newlines go everywhere.
    var scalars = Array(input.unicodeScalars)
    while let f = scalars.first, f.value <= 0x20 { scalars.removeFirst() }
    while let l = scalars.last, l.value <= 0x20 { scalars.removeLast() }
    scalars.removeAll { $0 == "\t" || $0 == "\n" || $0 == "\r" }
    let text = String(String.UnicodeScalarView(scalars))[...]

    if let colon = schemeEnd(text) {
      let scheme = text[..<colon].lowercased()
      let rest = text[text.index(after: colon)...]
      var url = ParsedURL(scheme: scheme, path: "")
      if url.special {
        if let base, base.scheme == scheme, !rest.hasPrefix("/"), !rest.hasPrefix("\\"), scheme != "file" {
          return relative(rest, base: base)
        }
        let afterSlashes = rest.drop { $0 == "/" || $0 == "\\" }
        if scheme == "file" {
          let stripped = rest.hasPrefix("//") || rest.hasPrefix("\\\\") ? rest.dropFirst(2) : rest
          if stripped.hasPrefix("/") || stripped.hasPrefix("\\") {
            url.host = ""
            return url.finish(path: stripped, base: nil)
          }
          return url.authority(stripped)
        }
        return url.authority(afterSlashes)
      }
      if rest.hasPrefix("//") { return url.authority(rest.dropFirst(2)) }
      if rest.hasPrefix("/") { return url.finish(path: rest, base: nil) }
      // An opaque path: `mailto:a@b`, `data:…`.
      url.opaque = true
      let (body, query, fragment) = split(rest)
      url.path = encode(body, .c0)
      url.query = query.map { encode($0, .query) }
      url.fragment = fragment.map { encode($0, .fragment) }
      return url
    }
    guard let base else { return nil }
    return relative(text, base: base)
  }

  /// The end of a scheme (`https:`), or `nil` when `text` has none.
  private static func schemeEnd(_ text: Substring) -> Substring.Index? {
    guard let first = text.unicodeScalars.first, first.isASCII, first.properties.isAlphabetic else { return nil }
    for i in text.indices {
      let c = text[i]
      if c == ":" { return i }
      guard c.isASCII, c.isLetter || c.isNumber || c == "+" || c == "-" || c == "." else { return nil }
    }
    return nil
  }

  /// `text` split at its query and fragment.
  private static func split(_ text: Substring) -> (Substring, Substring?, Substring?) {
    var body = text
    var fragment: Substring?
    if let hash = body.firstIndex(of: "#") {
      fragment = body[body.index(after: hash)...]
      body = body[..<hash]
    }
    var query: Substring?
    if let q = body.firstIndex(of: "?") {
      query = body[body.index(after: q)...]
      body = body[..<q]
    }
    return (body, query, fragment)
  }

  private static func relative(_ text: Substring, base: ParsedURL) -> ParsedURL? {
    var url = base
    url.fragment = nil
    if base.opaque {
      guard text.hasPrefix("#") else { return nil }
      url.fragment = encode(text.dropFirst(), .fragment)
      return url
    }
    let slash: (Character) -> Bool = { $0 == "/" || (base.special && $0 == "\\") }
    if let first = text.first, slash(first), text.count > 1, slash(text[text.index(after: text.startIndex)]) {
      var fresh = ParsedURL(scheme: base.scheme, path: "")
      return fresh.authority(text.drop(while: slash))
    }
    if text.isEmpty { return url }
    if text.hasPrefix("?") || text.hasPrefix("#") {
      let (_, query, fragment) = split(text)
      if text.hasPrefix("?") { url.query = query.map { encode($0, base.special ? .specialQuery : .query) } }
      url.fragment = fragment.map { encode($0, .fragment) }
      return url
    }
    url.query = nil
    if let first = text.first, slash(first) { return url.finish(path: text, base: nil) }
    return url.finish(path: text, base: base.path)
  }

  /// Reads `host[:port]` (with `user:pass@`), then the path.
  private mutating func authority(_ text: Substring) -> ParsedURL? {
    let isEnd: (Character) -> Bool = { $0 == "/" || $0 == "?" || $0 == "#" || (self.special && $0 == "\\") }
    let end = text.firstIndex(where: isEnd) ?? text.endIndex
    var auth = text[..<end]
    if let at = auth.lastIndex(of: "@") {
      let info = auth[..<at]
      if let colon = info.firstIndex(of: ":") {
        username = encode(info[..<colon], .userinfo)
        password = encode(info[info.index(after: colon)...], .userinfo)
      } else {
        username = encode(info, .userinfo)
      }
      auth = auth[auth.index(after: at)...]
    }
    var hostText = auth
    if let colon = auth.lastIndex(of: ":"), !auth[colon...].contains("]") {
      hostText = auth[..<colon]
      let portText = auth[auth.index(after: colon)...]
      if !portText.isEmpty {
        guard portText.allSatisfy({ $0.isASCII && $0.isNumber }), let n = Int(portText), n <= 65535 else { return nil }
        port = specialPorts[scheme] == String(n) ? nil : String(n)
      }
    }
    if special {
      guard let h = ParsedURL.domain(hostText), !h.isEmpty || scheme == "file" else { return nil }
      host = h
    } else {
      guard !hostText.contains(where: { " #/<>?@[\\]^|".contains($0) }) || hostText.hasPrefix("[") else { return nil }
      host = encode(hostText, .c0)
    }
    return finish(path: text[end...], base: nil)
  }

  /// The ASCII form of a special URL's host, or `nil` when it is not one.
  private static func domain(_ text: Substring) -> String? {
    if text.hasPrefix("[") { return text.hasSuffix("]") ? text.lowercased() : nil }
    guard let decoded = decodeURIComponent(String(text)) else { return nil }
    let lowered = decoded.precomposedStringWithCanonicalMapping.lowercased()
    var labels: [String] = []
    for label in lowered.split(separator: ".", omittingEmptySubsequences: false) {
      if label.unicodeScalars.allSatisfy(\.isASCII) {
        labels.append(String(label))
      } else {
        guard let encoded = punycode(String(label)) else { return nil }
        labels.append("xn--" + encoded)
      }
    }
    let ascii = labels.joined(separator: ".")
    if ascii.unicodeScalars.contains(where: { $0.value <= 0x20 || $0.value == 0x7F || " #%/:<>?@[\\]^|".unicodeScalars.contains($0) }) {
      return nil
    }
    return ascii
  }

  /// Reads the path (relative to `base`'s, a path's text, when given), query and fragment.
  private mutating func finish(path text: Substring, base: String?) -> ParsedURL? {
    let (body, query, fragment) = ParsedURL.split(text)
    var segments: [String] = []
    if let base {
      segments = base.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
      if !segments.isEmpty { segments.removeFirst() } // before the first "/"
      if !segments.isEmpty { segments.removeLast() } // the last segment is replaced
    }
    let separators: (Character) -> Bool = { $0 == "/" || (self.special && $0 == "\\") }
    var parts = body.split(omittingEmptySubsequences: false, whereSeparator: separators)
    if body.first.map(separators) == true { parts.removeFirst() }
    for (i, part) in parts.enumerated() {
      let last = i == parts.count - 1
      let lowered = part.lowercased()
      if lowered == ".." || lowered == ".%2e" || lowered == "%2e." || lowered == "%2e%2e" {
        if !segments.isEmpty { segments.removeLast() }
        if last { segments.append("") }
      } else if lowered == "." || lowered == "%2e" {
        if last { segments.append("") }
      } else {
        segments.append(encode(part, .path))
      }
    }
    if parts.isEmpty && base != nil && body.isEmpty { segments.append("") }
    path = segments.isEmpty ? (special ? "/" : "") : "/" + segments.joined(separator: "/")
    if host == nil && !special && body.isEmpty { path = "" }
    self.query = query.map { encode($0, special ? .specialQuery : .query) }
    self.fragment = fragment.map { encode($0, .fragment) }
    return self
  }
}

/// RFC 3492's encoding of a label (what follows `xn--`), or `nil` on overflow.
func punycode(_ label: String) -> String? {
  let input = label.unicodeScalars.map(\.value)
  let base: UInt32 = 36, tMin: UInt32 = 1, tMax: UInt32 = 26, skew: UInt32 = 38, damp: UInt32 = 700
  var n: UInt32 = 128
  var delta: UInt32 = 0
  var bias: UInt32 = 72
  var output = input.filter { $0 < 128 }.map { Character(Unicode.Scalar($0)!) }
  let basic = UInt32(output.count)
  var handled = basic
  if basic > 0 { output.append("-") }
  func digit(_ d: UInt32) -> Character { Character(Unicode.Scalar(d < 26 ? d + 97 : d + 22)!) }
  func adapt(_ delta: UInt32, _ points: UInt32, _ first: Bool) -> UInt32 {
    var d = first ? delta / damp : delta / 2
    d += d / points
    var k: UInt32 = 0
    while d > ((base - tMin) * tMax) / 2 {
      d /= base - tMin
      k += base
    }
    return k + (base - tMin + 1) * d / (d + skew)
  }
  while handled < UInt32(input.count) {
    let m = input.filter { $0 >= n }.min()!
    let (step, overflow) = (m - n).multipliedReportingOverflow(by: handled + 1)
    if overflow { return nil }
    delta += step
    n = m
    for c in input {
      if c < n { delta += 1 }
      if c == n {
        var q = delta
        var k = base
        while true {
          let t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias)
          if q < t { break }
          output.append(digit(t + (q - t) % (base - t)))
          q = (q - t) / (base - t)
          k += base
        }
        output.append(digit(q))
        bias = adapt(delta, handled + 1, handled == basic)
        delta = 0
        handled += 1
      }
    }
    delta += 1
    n += 1
  }
  return String(output)
}
