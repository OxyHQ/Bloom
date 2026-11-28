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
      #expect(found.map(\.groups) == c.matches.map(\.groups), "\(c.pattern)")
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
    #expect(throws: RegexError.self) { try BloomRegex.compile("a", flags: "ii") }
    #expect(BloomRegex(pattern: "(\\d)(\\d)").replacing(in: "12", with: "$2$1$10") == "2110")
  }
}
