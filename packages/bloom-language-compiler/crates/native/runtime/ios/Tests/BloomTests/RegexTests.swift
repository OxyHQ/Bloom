import Foundation
import Testing
@testable import Bloom

@Suite struct RegexTests {
  @Test func matchesReplacesAndSplitsAsJS() throws {
    for c in Fixtures.intl.regexes {
      if c.error {
        #expect(throws: RegexError.self) { try BloomRegex.compile(c.pattern, flags: c.flags) }
        continue
      }
      let re = try BloomRegex.compile(c.pattern, flags: c.flags)
      let found = re.matches(in: c.text)
      #expect(found.map(\.text) == c.matches.map(\.text), "\(c.pattern)")
      #expect(found.map(\.start) == c.matches.map(\.start), "\(c.pattern)")
      // The fixtures record a group that did not take part as "" (Node's recorder); Bloom's is `nil`.
      #expect(found.map { $0.groups.map { $0 ?? "" } } == c.matches.map(\.groups), "\(c.pattern)")
      #expect(found.map { $0.named.dictionary } == c.matches.map(\.named), "\(c.pattern)")
      #expect(re.replacing(in: c.text, with: "[$&|$1|$$|$<user>]") == c.replaced, "\(c.pattern)")
      #expect(re.split(c.text) == c.split.map { $0 ?? "" }, "\(c.pattern)")
    }
  }

  @Test func members() throws {
    let mention = BloomRegex(pattern: "@(\\w+)")
    #expect(mention.isMatch("hi @a"))
    #expect(!mention.isMatch("hi"))
    let m = try #require(mention.firstMatch(in: "😀 @nate"))
    #expect(m.start == 2 && m.end == 7)
    #expect(m.group(0) == "@nate" && m.group(1) == "nate" && m.group(2) == nil)
    #expect(throws: RegexError.self) { try BloomRegex.compile("a", flags: "x") }
    // Swift's shape: `try Regex("…")`, `wholeMatch(of:)`, optional captures.
    let digits = try BloomRegex("\\d+")
    #expect("123".wholeMatch(of: digits) != nil && "12a".wholeMatch(of: digits) == nil)
    #expect(throws: RegexError.self) { try BloomRegex("(") }
    let pair = try BloomRegex("(a)|(b)")
    let found = try #require("b".firstMatch(of: pair))
    #expect(found.group(1) == nil && found.group(2) == "b" && found.group(3) == nil)
    let comma = try BloomRegex("\\s*,\\s*")
    let spaces = try BloomRegex("\\s+")
    let digit = try BloomRegex("[0-9]")
    let handle = try BloomRegex("@(\\w+)")
    #expect("a, b ,c".split(separator: comma) == ["a", "b", "c"])
    #expect("a  b".replacing(spaces, with: " ") == "a b")
    #expect("x1".contains(digit) && "@a @b".matches(of: handle).compactMap { $0.group(1) } == ["a", "b"])
    #expect(throws: RegexError.self) { try BloomRegex.compile("a", flags: "ii") }
    #expect(BloomRegex(pattern: "(\\d)(\\d)").replacing(in: "12", with: "$2$1$10") == "2110")
  }
}
