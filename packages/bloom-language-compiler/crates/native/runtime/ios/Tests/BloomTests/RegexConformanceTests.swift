import Foundation
import Testing
@testable import Bloom

/// Bloom's regex conformance corpus (`conformance/regex/`): every case's matches, captures,
/// whole match, replacement and split as the TypeScript runtime (ECMAScript's `RegExp`)
/// recorded them, against BloomRegex. Offsets are compared in characters (`startGraphemes`),
/// what Bloom's strings count on Swift.
@Suite struct RegexConformanceTests {
  struct Expected: Decodable {
    let replacement: String
    let results: [Case]
  }
  struct Case: Decodable {
    let pattern: String
    let flags: String
    let text: String
    let error: Bool
    let matches: [Match]?
    let whole: String?
    let replaced: String?
    let split: [String?]?
  }
  struct Match: Decodable, Equatable {
    let text: String
    let startGraphemes: Int
    let groups: [String?]
    let named: [String: String]
  }
  struct Known: Decodable {
    struct Entry: Decodable { let pattern: String; let flags: String; let text: String; let why: String }
    let cases: [Entry]
  }

  static let root = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent().appendingPathComponent("../../../../../../conformance/regex").standardized

  /// What BloomRegex answers that differs from the corpus, for one case (empty: conforms).
  static func differences(_ c: Case, _ replacement: String) -> [String] {
    var out: [String] = []
    let regex: BloomRegex
    do {
      regex = try BloomRegex.compile(c.pattern, flags: c.flags)
    } catch {
      return c.error ? [] : ["throws where JS compiles"]
    }
    if c.error { return ["compiles where JS throws"] }
    let found = regex.matches(in: c.text).map {
      Match(text: $0.text, startGraphemes: $0.start, groups: $0.groups, named: $0.named.dictionary)
    }
    if found != c.matches ?? [] { out.append("matches \(found.map(\.text)) where JS has \((c.matches ?? []).map(\.text))") }
    let whole = c.text.wholeMatch(of: regex)?.text
    if whole != c.whole { out.append("whole \(String(describing: whole)) where JS has \(String(describing: c.whole))") }
    let replaced = regex.replacing(in: c.text, with: replacement)
    if replaced != c.replaced { out.append("replaced \(replaced.debugDescription) where JS has \(String(describing: c.replaced))") }
    let split = regex.split(c.text)
    if split != (c.split ?? []).map({ $0 ?? "" }) { out.append("split \(split) where JS has \(String(describing: c.split))") }
    return out
  }

  @Test func matchesTheCorpus() throws {
    let expected = try JSONDecoder().decode(Expected.self, from: Data(contentsOf: Self.root.appendingPathComponent("expected.json")))
    let known = try JSONDecoder().decode(Known.self, from: Data(contentsOf: Self.root.appendingPathComponent("known-differences.swift.json")))
    for c in expected.results {
      let diff = Self.differences(c, expected.replacement)
      let listed = known.cases.contains { $0.pattern == c.pattern && $0.flags == c.flags && $0.text == c.text }
      if ProcessInfo.processInfo.environment["BLOOM_REGEX_REPORT"] != nil, !diff.isEmpty {
        print("REGEX-DIFF \(c.pattern.debugDescription) /\(c.flags) on \(c.text.debugDescription): \(diff.joined(separator: "; "))")
      }
      #expect(diff.isEmpty || listed, "\(c.pattern) /\(c.flags) on \(c.text.debugDescription): \(diff.joined(separator: "; "))")
      #expect(!(diff.isEmpty && listed), "\(c.pattern) /\(c.flags) conforms now: remove it from known-differences.swift.json")
    }
  }
}
