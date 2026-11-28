// Bloom: `Regex`, regular expressions in JS's syntax, over `NSRegularExpression` (ICU).
// Swift's own `Regex<Output>` is another type (typed captures, Swift's syntax), so Bloom's is
// `BloomRegex`. Matches, replacements and splits follow JS's `matchAll`, `replace` and `split`.
//
// JS and ICU read most patterns alike. Where they differ (documented, not translated):
// - `\d`, `\w`, `\b` and `\s` are Unicode-aware in ICU, ASCII in JS (without `u`, `\d` in JS
//   never matches `٣`);
// - `$` without `m` matches before a final line terminator in ICU, only at the end in JS;
// - `[^]` (JS's "any character") is an error in ICU (write `[\s\S]`);
// - ICU's look-behind must be bounded; JS's need not be;
// - the `y` (sticky) and `v` flags are not supported (a `RegexError`).
// Offsets (`start`, `end`) count characters (grapheme clusters), as Bloom's strings do; the TS
// runtime counts UTF-16 units.
import Foundation

/// A regular expression: its pattern and its flags (`i` ignores case, `m` multiline, `s` lets
/// `.` match newlines, `u` Unicode; `g` and `d` are accepted and change nothing).
public struct BloomRegex: Equatable, Hashable, Sendable {
  public let pattern: String
  public var flags: String = ""

  public init(pattern: String, flags: String = "") {
    self.pattern = pattern
    self.flags = flags
  }
}

/// One match: its text, where it starts (character offset) and its groups.
public struct RegexMatch: Equatable, Hashable, Sendable {
  public let text: String
  public let start: Int
  /// The numbered groups, from group 1 (`""` where a group did not take part).
  public let groups: [String]
  /// The named groups (`(?<handle>\\w+)`) that took part.
  public let named: OrderedDictionary<String, String>

  public init(text: String, start: Int, groups: [String], named: OrderedDictionary<String, String>) {
    self.text = text
    self.start = start
    self.groups = groups
    self.named = named
  }

  /// Group `n` (0 is the whole match, 1 the first group), or `none`.
  public func group(_ n: Int) -> String? { n == 0 ? text : groups.at(n - 1) }

  /// Where the match ends (character offset, exclusive).
  public var end: Int { start + text.count }
}

/// A pattern that is not a valid expression.
public struct RegexError: Error, Equatable, Hashable, Sendable, LocalizedError {
  public let pattern: String
  public let message: String

  public init(pattern: String, message: String) {
    self.pattern = pattern
    self.message = message
  }

  public var errorDescription: String? { message }
}

private final class CompiledRegex: @unchecked Sendable {
  let regex: NSRegularExpression
  let names: [String]
  init(regex: NSRegularExpression, names: [String]) {
    self.regex = regex
    self.names = names
  }
}

private let compiledRegexes = Locked([String: CompiledRegex]())

extension BloomRegex {
  /// The expression, checked: throws a `RegexError` when `pattern` or `flags` is invalid.
  public static func compile(_ pattern: String, flags: String = "") throws -> BloomRegex {
    let regex = BloomRegex(pattern: pattern, flags: flags)
    _ = try regex.compiled()
    return regex
  }

  fileprivate func compiled() throws -> CompiledRegex {
    let key = "\(flags)/\(pattern)"
    if let found = compiledRegexes.withLock({ $0[key] }) { return found }
    var options: NSRegularExpression.Options = []
    var seen = Set<Character>()
    for flag in flags {
      guard seen.insert(flag).inserted else { throw RegexError(pattern: pattern, message: "Invalid flags supplied to RegExp constructor '\(flags)'") }
      switch flag {
      case "i": options.insert(.caseInsensitive)
      case "m": options.insert(.anchorsMatchLines)
      case "s": options.insert(.dotMatchesLineSeparators)
      case "g", "u", "d": break
      default: throw RegexError(pattern: pattern, message: "Invalid flags supplied to RegExp constructor '\(flags)'")
      }
    }
    let regex: NSRegularExpression
    do {
      // JS's empty pattern matches the empty string; ICU refuses it.
      regex = try NSRegularExpression(pattern: pattern.isEmpty ? "(?:)" : pattern, options: options)
    } catch {
      throw RegexError(pattern: pattern, message: "Invalid regular expression: /\(pattern)/\(flags): \(error.localizedDescription)")
    }
    let made = CompiledRegex(regex: regex, names: groupNames(pattern))
    compiledRegexes.withLock { $0[key] = made }
    return made
  }

  /// Every match in `text`, in order (none when the pattern is invalid).
  public func matches(in text: String) -> [RegexMatch] { rawMatches(text, limit: 0).map { convert($0, in: text) } }

  /// The first match in `text`, or `none`.
  public func firstMatch(in text: String) -> RegexMatch? { rawMatches(text, limit: 1).first.map { convert($0, in: text) } }

  /// Whether the expression matches somewhere in `text`.
  public func isMatch(_ text: String) -> Bool { !rawMatches(text, limit: 1).isEmpty }

  /// `text` with every match replaced: `$1`, `$<name>`, `$&`, `` $` ``, `$'` and `$$` insert
  /// as in JS's `replace`.
  public func replacing(in text: String, with replacement: String) -> String {
    guard let compiled = try? compiled() else { return text }
    let ns = text as NSString
    let r = Array(replacement.utf16)
    var out: [UInt16] = []
    var last = 0
    for m in rawMatches(text, limit: 0) {
      out.append(contentsOf: Array(ns.substring(with: NSRange(location: last, length: m.range.location - last)).utf16))
      out.append(contentsOf: substitute(r, m, ns, compiled))
      last = m.range.location + m.range.length
    }
    out.append(contentsOf: Array(ns.substring(from: last).utf16))
    return String(units: out)
  }

  /// The parts of `text` between matches, with the groups' text between them (JS's `split`).
  public func split(_ text: String) -> [String] {
    guard let compiled = try? compiled() else { return [text] }
    let ns = text as NSString
    let size = ns.length
    if size == 0 { return compiled.regex.firstMatch(in: text, range: NSRange(location: 0, length: 0)) == nil ? [""] : [] }
    // ES's `@@split`: a sticky match at each position q; an empty one at p moves on.
    var out: [String] = []
    var p = 0
    var q = 0
    while q < size {
      let range = NSRange(location: q, length: size - q)
      guard let m = compiled.regex.firstMatch(in: text, options: [.anchored, .withoutAnchoringBounds], range: range) else {
        q += 1
        continue
      }
      let e = Swift.min(m.range.location + m.range.length, size)
      if e == p {
        q += 1
        continue
      }
      out.append(ns.substring(with: NSRange(location: p, length: q - p)))
      for g in 1..<Swift.max(1, m.numberOfRanges) {
        let r = m.range(at: g)
        out.append(r.location == NSNotFound ? "" : ns.substring(with: r))
      }
      p = e
      q = p
    }
    out.append(ns.substring(from: p))
    return out
  }

  private func rawMatches(_ text: String, limit: Int) -> [NSTextCheckingResult] {
    guard let compiled = try? compiled() else { return [] }
    let range = NSRange(location: 0, length: (text as NSString).length)
    if limit == 1 { return compiled.regex.firstMatch(in: text, range: range).map { [$0] } ?? [] }
    return compiled.regex.matches(in: text, range: range)
  }

  private func convert(_ m: NSTextCheckingResult, in text: String) -> RegexMatch {
    let ns = text as NSString
    let names = (try? compiled().names) ?? []
    var named = OrderedDictionary<String, String>()
    for name in names {
      let r = m.range(withName: name)
      if r.location != NSNotFound { named[name] = ns.substring(with: r) }
    }
    let groups = (0..<Swift.max(0, m.numberOfRanges - 1)).map { g -> String in
      let r = m.range(at: g + 1)
      return r.location == NSNotFound ? "" : ns.substring(with: r)
    }
    let prefix = ns.substring(to: m.range.location)
    return RegexMatch(text: ns.substring(with: m.range), start: prefix.count, groups: groups, named: named)
  }

  /// JS's `GetSubstitution` with captures.
  private func substitute(_ r: [UInt16], _ m: NSTextCheckingResult, _ ns: NSString, _ compiled: CompiledRegex) -> [UInt16] {
    let dollar = UInt16(UInt8(ascii: "$"))
    func text(_ range: NSRange) -> [UInt16] { range.location == NSNotFound ? [] : Array(ns.substring(with: range).utf16) }
    func isDigit(_ u: UInt16) -> Bool { u >= 48 && u <= 57 }
    let groupCount = m.numberOfRanges - 1
    var out: [UInt16] = []
    var i = 0
    while i < r.count {
      guard r[i] == dollar, i + 1 < r.count else {
        out.append(r[i])
        i += 1
        continue
      }
      let next = r[i + 1]
      switch next {
      case dollar:
        out.append(dollar)
        i += 2
      case UInt16(UInt8(ascii: "&")):
        out.append(contentsOf: text(m.range))
        i += 2
      case UInt16(UInt8(ascii: "`")):
        out.append(contentsOf: Array(ns.substring(to: m.range.location).utf16))
        i += 2
      case UInt16(UInt8(ascii: "'")):
        out.append(contentsOf: Array(ns.substring(from: m.range.location + m.range.length).utf16))
        i += 2
      case UInt16(UInt8(ascii: "<")) where !compiled.names.isEmpty:
        if let close = r[(i + 2)...].firstIndex(of: UInt16(UInt8(ascii: ">"))) {
          let name = String(units: r[(i + 2)..<close])
          out.append(contentsOf: text(m.range(withName: name)))
          i = close + 1
        } else {
          out.append(dollar)
          i += 1
        }
      default:
        if isDigit(next) {
          // Two digits when that group exists, else one.
          if i + 2 < r.count, isDigit(r[i + 2]), let two = Int(String(units: r[(i + 1)...(i + 2)])), two >= 1, two <= groupCount {
            out.append(contentsOf: text(m.range(at: two)))
            i += 3
            continue
          }
          let one = Int(next - 48)
          if one >= 1 && one <= groupCount {
            out.append(contentsOf: text(m.range(at: one)))
            i += 2
            continue
          }
        }
        out.append(dollar)
        i += 1
      }
    }
    return out
  }
}

/// The names of `(?<name>…)` groups in `pattern`, in order.
private func groupNames(_ pattern: String) -> [String] {
  let c = Array(pattern)
  var names: [String] = []
  var i = 0
  var inClass = false
  while i < c.count {
    if c[i] == "\\" {
      i += 2
      continue
    }
    if c[i] == "[" { inClass = true }
    if c[i] == "]" { inClass = false }
    if !inClass, c[i] == "(", i + 3 < c.count, c[i + 1] == "?", c[i + 2] == "<", c[i + 3] != "=", c[i + 3] != "!" {
      var j = i + 3
      var name = ""
      while j < c.count, c[j] != ">" {
        name.append(c[j])
        j += 1
      }
      names.append(name)
      i = j
    }
    i += 1
  }
  return names
}
