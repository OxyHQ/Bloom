// Bloom (regex): a pattern in ECMAScript's syntax, rewritten for ICU (`NSRegularExpression`) so
// it means what it means in JS. Bloom's regular expressions are ECMAScript's on every backend;
// the regex conformance corpus (`conformance/regex/`) pins what JS answers, and this is what
// makes ICU answer the same. What it rewrites:
//
// | JS | ICU, as JS reads it |
// |---|---|
// | `\d` `\w` `\b` `\B` (ASCII in JS) | `[0-9]`, `[A-Za-z0-9_]`, boundaries over those |
// | `\s` (JS's white space: U+FEFF, not U+0085) | the class of JS's white space |
// | `.` (no `s`: not `\n` `\r` U+2028 U+2029) | that class; `[\s\S]` with `s` |
// | `^` `$` (`$` is the end only without `m`; with `m` each of `\n` `\r` U+2028 U+2029 ends a line) | look-arounds over those |
// | `[]`, `[^]` | nothing, anything |
// | `[` `&&` in a class (literals in JS) | escaped |
// | a lone `{` or `}`, `{,n}` (literals in JS) | escaped |
// | `\Q` `\h` `\z` … without `u` (the letter in JS) | the letter |
// | `\0`, `[\b]`, `\u{…}` | `\x{0}`, a backspace, `\x{…}` |
// | `k`, `s`, `ß` under `i` (JS's simple folding: no Kelvin sign, no long s, no `SS`) | their JS classes |
// | an unbounded quantifier in a look-behind (JS's need not be bounded) | bounded at 1000 |
//
// What JS refuses and ICU takes is refused: `(?i)`, a possessive `a++`, an atomic `(?>…)`, a
// quantifier of a quantifier. What stays different is in
// `conformance/regex/known-differences.swift.json`.
import Foundation

struct RegexTranslation {
  /// The ICU pattern.
  var pattern: String
  /// `y`: every match starts where the last one ended.
  var sticky: Bool
}

enum RegexTranslate {
  static let word = "A-Za-z0-9_"
  static let space = "\\t\\n\\x{B}\\f\\r \\x{A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}\\x{FEFF}"
  static let lineEnd = "\\n\\r\\x{2028}\\x{2029}"
  /// ICU's metacharacters, escaped when they stand for themselves.
  static let meta: Set<Character> = ["\\", "^", "$", ".", "|", "?", "*", "+", "(", ")", "[", "]", "{", "}"]

  /// `pattern` with `flags` as ICU reads it, or the message JS gives for an invalid one.
  static func translate(_ pattern: String, flags: String) -> Result<RegexTranslation, RegexError> {
    let s = Array(pattern.unicodeScalars).map { Character($0) }
    let unicode = flags.contains("u")
    let ignoreCase = flags.contains("i")
    let dotAll = flags.contains("s")
    let multiline = flags.contains("m")
    func fail(_ why: String) -> Result<RegexTranslation, RegexError> {
      .failure(RegexError(pattern: pattern, message: "Invalid regular expression: /\(pattern)/\(flags): \(why)"))
    }
    var out = ""
    var i = 0
    /// Whether the last thing written can take a quantifier, and whether it was one.
    var quantifiable = false
    var lastWasQuantifier = false
    /// The last quantifier was made lazy (`a+?`): another `?` is a quantifier of a quantifier.
    var lazy = false
    /// The open groups: whether each is a look-behind.
    var groups: [Bool] = []
    var lookBehinds: Int { groups.filter { $0 }.count }

    func hex(_ at: Int, _ count: Int) -> String? {
      guard at + count <= s.count else { return nil }
      let digits = String(s[at..<at + count])
      return digits.allSatisfy(\.isHexDigit) ? digits : nil
    }
    /// `{n}`, `{n,}`, `{n,m}` at `at`: its length.
    func braceQuantifier(_ at: Int) -> Int? {
      var j = at + 1
      var digits = 0
      while j < s.count, s[j].isASCII, s[j].isNumber { j += 1; digits += 1 }
      guard digits > 0, j < s.count else { return nil }
      if s[j] == "}" { return j - at + 1 }
      guard s[j] == "," else { return nil }
      j += 1
      while j < s.count, s[j].isASCII, s[j].isNumber { j += 1 }
      return j < s.count && s[j] == "}" ? j - at + 1 : nil
    }
    func literal(_ c: Character) -> String {
      if ignoreCase {
        switch c {
        case "k", "K": return unicode ? "(?-i:[kK\\x{212A}])" : "(?-i:[kK])"
        case "s", "S": return unicode ? "(?-i:[sS\\x{17F}])" : "(?-i:[sS])"
        case "ß": return unicode ? "(?-i:[ß\\x{1E9E}])" : "(?-i:ß)"
        case "\u{1E9E}": return unicode ? "(?-i:[ß\\x{1E9E}])" : "(?-i:\\x{1E9E})"
        default: break
        }
      }
      return meta.contains(c) ? "\\\(c)" : String(c)
    }
    /// An escape outside a class (`at` is the `\`): what it is in ICU, and its length.
    func escape(_ at: Int, inClass: Bool) -> Result<(String, Int), RegexError> {
      guard at + 1 < s.count else {
        return .failure(RegexError(pattern: pattern, message: "Invalid regular expression: /\(pattern)/\(flags): \\ at end of pattern"))
      }
      let c = s[at + 1]
      let bad = RegexError(pattern: pattern, message: "Invalid regular expression: /\(pattern)/\(flags): Invalid escape")
      switch c {
      case "d": return .success((inClass ? "0-9" : "[0-9]", 2))
      case "D": return .success(("[^0-9]", 2))
      case "w": return .success((inClass ? word : "[\(word)]", 2))
      case "W": return .success(("[^\(word)]", 2))
      case "s": return .success((inClass ? space : "[\(space)]", 2))
      case "S": return .success(("[^\(space)]", 2))
      case "b" where inClass: return .success(("\\x{8}", 2))
      case "b": return .success(("(?:(?<=[\(word)])(?![\(word)])|(?<![\(word)])(?=[\(word)]))", 2))
      case "B" where !inClass: return .success(("(?:(?<=[\(word)])(?=[\(word)])|(?<![\(word)])(?![\(word)]))", 2))
      case "n", "r", "t", "f", "v":
        let code = ["n": "A", "r": "D", "t": "9", "f": "C", "v": "B"][String(c)]!
        return .success(("\\x{\(code)}", 2))
      case "0" where !(at + 2 < s.count && s[at + 2].isASCII && s[at + 2].isNumber):
        return .success(("\\x{0}", 2))
      case "1"..."9" where !inClass:
        var j = at + 1
        while j < s.count, s[j].isASCII, s[j].isNumber { j += 1 }
        return .success(("\\" + String(s[(at + 1)..<j]), j - at))
      case "c":
        if at + 2 < s.count, s[at + 2].isASCII, s[at + 2].isLetter { return .success(("\\c\(s[at + 2])", 3)) }
        return unicode ? .failure(bad) : .success(("\\\\c", 2))
      case "x":
        if let h = hex(at + 2, 2) { return .success(("\\x{\(h)}", 4)) }
        return unicode ? .failure(bad) : .success(("x", 2))
      case "u":
        if unicode, at + 2 < s.count, s[at + 2] == "{", let close = s[(at + 3)...].firstIndex(of: "}") {
          let digits = String(s[(at + 3)..<close])
          guard !digits.isEmpty, digits.allSatisfy(\.isHexDigit) else { return .failure(bad) }
          return .success(("\\x{\(digits)}", close - at + 1))
        }
        if let h = hex(at + 2, 4) { return .success(("\\x{\(h)}", 6)) }
        return unicode ? .failure(bad) : .success(("u", 2))
      case "p" where unicode, "P" where unicode:
        guard at + 2 < s.count, s[at + 2] == "{", let close = s[(at + 3)...].firstIndex(of: "}") else { return .failure(bad) }
        return .success(("\\\(c){\(String(s[(at + 3)..<close]))}", close - at + 1))
      case "k" where !inClass && (unicode || pattern.contains("(?<")):
        guard at + 2 < s.count, s[at + 2] == "<", let close = s[(at + 3)...].firstIndex(of: ">") else { return .failure(bad) }
        return .success(("\\k<\(String(s[(at + 3)..<close]))>", close - at + 1))
      case "-" where inClass:
        return .success(("\\-", 2))
      default:
        if c.isASCII && (c.isLetter || c.isNumber) {
          // An identity escape of a letter: the letter in JS without `u`, an error with it.
          return unicode ? .failure(bad) : .success((inClass ? classLiteral(c) : literal(c), 2))
        }
        return .success((inClass ? classLiteral(c) : "\\\(c)", 2))
      }
    }
    func classLiteral(_ c: Character) -> String {
      switch c {
      case "[", "]", "\\", "&", "-", "^", "{", "}", "$": return "\\\(c)"
      default: return String(c)
      }
    }

    while i < s.count {
      let c = s[i]
      switch c {
      case "\\":
        switch escape(i, inClass: false) {
        case .failure(let e): return .failure(e)
        case .success(let (text, length)):
          out += text
          quantifiable = !(s[i + 1] == "b" || s[i + 1] == "B")
          lastWasQuantifier = false
          i += length
        }
        continue
      case "[":
        var j = i + 1
        var negated = false
        if j < s.count, s[j] == "^" { negated = true; j += 1 }
        if j < s.count, s[j] == "]" {
          out += negated ? "[\\s\\S]" : "(?!)"
          i = j + 1
          quantifiable = true
          lastWasQuantifier = false
          continue
        }
        var set = negated ? "[^" : "["
        var closed = false
        while j < s.count {
          let d = s[j]
          if d == "]" { closed = true; j += 1; break }
          if d == "\\" {
            switch escape(j, inClass: true) {
            case .failure(let e): return .failure(e)
            case .success(let (text, length)):
              set += text
              j += length
            }
            continue
          }
          if d == "-" { set += "-"; j += 1; continue }
          set += classLiteral(d)
          j += 1
        }
        if !closed { return fail("Unterminated character class") }
        out += set + "]"
        i = j
        quantifiable = true
        lastWasQuantifier = false
        continue
      case "(":
        if i + 1 < s.count, s[i + 1] == "?" {
          let rest = String(s[(i + 2)...].prefix(2))
          if rest.hasPrefix(":") || rest.hasPrefix("=") || rest.hasPrefix("!") {
            out += "(?" + String(s[i + 2])
            groups.append(false)
            i += 3
          } else if rest == "<=" || rest == "<!" {
            out += "(?" + rest
            groups.append(true)
            i += 4
          } else if rest.hasPrefix("<") {
            guard let close = s[(i + 3)...].firstIndex(of: ">") else { return fail("Invalid capture group name") }
            out += "(?<" + String(s[(i + 3)..<close]) + ">"
            groups.append(false)
            i = close + 1
          } else {
            // `(?i:…)` / `(?-i:…)` (ES2025's modifiers); `(?i)`, `(?>…)`, `(?#…)` are not JS.
            var j = i + 2
            while j < s.count, "imsx-".contains(s[j]) { j += 1 }
            guard j > i + 2, j < s.count, s[j] == ":" else { return fail("Invalid group") }
            out += "(?" + String(s[(i + 2)...j])
            groups.append(false)
            i = j + 1
          }
        } else {
          out += "("
          groups.append(false)
          i += 1
        }
        quantifiable = false
        lastWasQuantifier = false
        continue
      case ")":
        guard !groups.isEmpty else { return fail("Unmatched ')'") }
        let wasLookBehind = groups.removeLast()
        out += ")"
        // A look-ahead may be quantified in JS without `u`; a look-behind may not.
        quantifiable = !wasLookBehind
        lastWasQuantifier = false
        i += 1
        continue
      case "*", "+", "?":
        if lastWasQuantifier && !lazy && c == "?" {
          out += "?"  // lazy
          lazy = true
          i += 1
          continue
        }
        guard quantifiable else { return fail("Nothing to repeat") }
        if lookBehinds > 0 && c != "?" {
          out += c == "*" ? "{0,1000}" : "{1,1000}"
        } else {
          out.append(c)
        }
        quantifiable = false
        lastWasQuantifier = true
        lazy = false
        i += 1
        continue
      case "{":
        if let length = braceQuantifier(i) {
          guard quantifiable else { return fail("Nothing to repeat") }
          let text = String(s[i..<(i + length)])
          if lookBehinds > 0, text.hasSuffix(",}") {
            out += text.dropLast() + "1000}"
          } else {
            out += text
          }
          quantifiable = false
          lastWasQuantifier = true
          lazy = false
          i += length
          continue
        }
        if unicode { return fail("Incomplete quantifier") }
        out += "\\{"
        quantifiable = true
        lastWasQuantifier = false
        i += 1
        continue
      case "}":
        if unicode { return fail("Lone quantifier brackets") }
        out += "\\}"
        quantifiable = true
        lastWasQuantifier = false
        i += 1
        continue
      case ".":
        out += dotAll ? "[\\s\\S]" : "[^\(lineEnd)]"
      case "^":
        out += multiline ? "(?:^|(?<=[\(lineEnd)]))" : "^"
        quantifiable = false
        lastWasQuantifier = false
        i += 1
        continue
      case "$":
        out += multiline ? "(?=[\(lineEnd)]|(?![\\s\\S]))" : "(?![\\s\\S])"
        quantifiable = false
        lastWasQuantifier = false
        i += 1
        continue
      case "|":
        out += "|"
        quantifiable = false
        lastWasQuantifier = false
        i += 1
        continue
      case "]":
        if unicode { return fail("Lone quantifier brackets") }
        out += "\\]"
      default:
        out += literal(c)
      }
      quantifiable = true
      lastWasQuantifier = false
      i += 1
    }
    if !groups.isEmpty { return fail("Unterminated group") }
    return .success(RegexTranslation(pattern: out, sticky: flags.contains("y")))
  }
}
