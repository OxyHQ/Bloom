import Foundation
import Testing
@testable import Bloom

/// Dates, relative times, numbers and plural categories against what the TS runtime writes
/// with Node's `Intl` (`Fixtures/intl-fixtures.json`). Node's text is the expected one. Where
/// this platform's ICU data disagrees, the case is recorded with both strings in
/// `Fixtures/intl-known-differences.<platform>.json`; the test fails on any difference not
/// recorded there, and on a recorded one that no longer differs. `BLOOM_BLESS=1 swift test
/// --filter IntlParity` rewrites the record (inspect its diff).
@Suite struct IntlParity {
  struct Difference: Codable, Hashable, Comparable {
    let kind: String
    let input: String
    let node: String
    let swift: String

    static func < (a: Difference, b: Difference) -> Bool { (a.kind, a.input) < (b.kind, b.input) }
  }

  static var platform: String {
    #if canImport(Darwin)
    return "apple"
    #else
    return "linux"
    #endif
  }

  static func differences() -> [Difference] {
    let f = Fixtures.intl
    var out: [Difference] = []
    func check(_ kind: String, _ input: String, _ node: String, _ swift: String) {
      if node != swift { out.append(Difference(kind: kind, input: input, node: node, swift: swift)) }
    }
    for c in f.dates {
      check(
        "date", "\(c.locale) \(c.date)/\(c.time) \(c.timeZone) \(isoString(c.ms))", c.text,
        formatDate(c.ms, c.locale, c.date, c.time, c.timeZone))
    }
    for c in f.relative {
      check("relative", "\(c.locale) \(stringOfNumber(c.value)) \(c.unit)", c.text, formatRelative(c.value, c.unit, c.locale, "long"))
    }
    let now = Date.fromMilliseconds(1_795_717_800_000)
    for c in f.relativeDates {
      check(
        "relativeDate", "\(c.locale) \(stringOfNumber(c.seconds))s", c.text,
        now.adding(.seconds(c.seconds)).formatted(.relative, locale: c.locale, now: now))
    }
    for c in f.numberFormats {
      check("number", "\(c.locale) \(stringOfNumber(c.n)) digits \(c.digits)", c.text, formatNumber(c.n, c.locale, c.digits, c.digits))
    }
    for c in f.compact {
      check("compact", "\(c.locale) \(stringOfNumber(c.n))", c.text, formatCompact(c.n, c.locale))
    }
    for c in f.plural {
      check("plural", "\(c.locale) \(stringOfNumber(c.n))", c.category, pluralCategory(c.n, c.locale))
    }
    return out.sorted()
  }

  @Test func matchesNodeOrIsRecorded() throws {
    let found = IntlParity.differences()
    let file = Fixtures.directory.appendingPathComponent("intl-known-differences.\(IntlParity.platform).json")
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
    if ProcessInfo.processInfo.environment["BLOOM_BLESS"] == "1" {
      let header = "Node \(Fixtures.intl.node), ICU \(Fixtures.intl.icu), CLDR \(Fixtures.intl.cldr)"
      let record = KnownDifferences(expected: header, differences: found)
      try encoder.encode(record).write(to: file)
      return
    }
    guard let data = try? Data(contentsOf: file) else {
      Issue.record("\(found.count) cases differ from Node and none are recorded for \(IntlParity.platform): run BLOOM_BLESS=1 swift test --filter IntlParity, then inspect \(file.lastPathComponent)")
      return
    }
    let recorded = Set(try JSONDecoder().decode(KnownDifferences.self, from: data).differences)
    let now = Set(found)
    for d in now.subtracting(recorded).sorted() {
      Issue.record("new difference \(d.kind) [\(d.input)]: Node \(d.node.debugDescription), Swift \(d.swift.debugDescription)")
    }
    for d in recorded.subtracting(now).sorted() {
      Issue.record("recorded difference no longer seen \(d.kind) [\(d.input)]: re-bless")
    }
  }

  struct KnownDifferences: Codable {
    let expected: String
    let differences: [Difference]
  }

  /// The parts that must match everywhere (no ICU data involved, or data every ICU agrees on).
  @Test func exactWhereICUAgrees() {
    #expect(formatNumber(1234.5, "en-US", 1, 1) == "1,234.5")
    #expect(formatNumber(2.5, "en-US", 0, 0) == "3")
    #expect(formatNumber(-2.5, "en-US", 0, 0) == "-3")
    #expect(formatCompact(1234, "en-US") == "1.2K")
    #expect(formatRelative(-3, "minute", "es-ES", "long") == "hace 3 minutos")
    #expect(formatRelative(-1, "day", "en-US", "long") == "yesterday")
    #expect(formatRelative(0, "second", "en-US", "long") == "now")
    #expect(formatDate(1_795_717_800_000, "en-US", "omitted", "short", "UTC") == "6:30 PM")
    #expect(formatDate(1_795_717_800_000, "en-US", "omitted", "omitted", "UTC") == "11/26/2026")
    #expect(formatDate(1_795_717_800_000, "de-DE", "short", "short", "UTC") == "26.11.26, 18:30")
  }
}
