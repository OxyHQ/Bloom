import Foundation
import Testing
@testable import Bloom

private let utc = TimeZone(identifier: "UTC")!

@Suite struct Time {
  @Test func isoStringsAsToISOString() {
    for c in Fixtures.intl.iso {
      #expect(isoString(c.ms) == c.text, "\(c.ms)")
    }
    #expect(Date.fromMilliseconds(1_795_717_800_000).iso8601 == "2026-11-26T18:30:00.000Z")
    #expect(isoString(9e15) == "Invalid Date")
  }

  @Test func parsesAsDateParse() {
    for c in Fixtures.intl.parse {
      #expect(parseISOMilliseconds(c.text, timeZone: utc) == c.ms, "\(c.text)")
    }
    // A date and time without an offset is local time (here: UTC+1 in winter).
    let madrid = TimeZone(identifier: "Europe/Madrid")!
    #expect(parseISOMilliseconds("2026-01-10T10:00", timeZone: madrid) == parseISOMilliseconds("2026-01-10T09:00Z", timeZone: utc))
    #expect(Date.parse(iso8601: "2026-11-26T18:30:00Z")?.millisecondsSince1970 == 1_795_717_800_000)
    #expect(Date.parse(iso8601: "Nov 26 2026") == nil)
  }

  @Test func dateMembers() {
    let a = Date.fromMilliseconds(1000)
    let b = a.adding(.seconds(1.5))
    #expect(b.millisecondsSince1970 == 2500)
    #expect(a.duration(to: b) == .milliseconds(1500))
    #expect(a.isBefore(b) && b.isAfter(a))
    #expect(b.formatted(.iso8601) == "1970-01-01T00:00:02.500Z")
  }

  @Test func componentsAsJSGetters() {
    let d = Date.fromMilliseconds(Double(1_709_183_229_123))
    let c = d.components(utc: true)
    #expect(c == BloomDateComponents(year: 2024, month: 2, day: 29, hour: 5, minute: 7, second: 9, weekday: 5))
    let ny = dateParts(Date.fromMilliseconds(1_798_761_600_000).millisecondsSince1970, TimeZone(identifier: "America/New_York")!)
    #expect(ny == BloomDateComponents(year: 2026, month: 12, day: 31, hour: 19, minute: 0, second: 0, weekday: 5))
    let old = dateParts(-62_185_521_293_993, utc)
    #expect(old.year == -1 && old.month == 6 && old.day == 3)
  }

  @Test func calendar() {
    let cal = Calendar(utc: true)
    #expect(cal.utc)
    #expect(!Calendar(identifier: .gregorian).utc || TimeZone.current.secondsFromGMT() == 0)
    #expect(cal.date(year: 2026, month: 11, day: 26, hour: 18, minute: 30).iso8601 == "2026-11-26T18:30:00.000Z")
    #expect(cal.date(year: 2026, month: 13, day: 1).iso8601 == "2027-01-01T00:00:00.000Z")
    #expect(cal.date(year: 2026, month: 3, day: 0).iso8601 == "2026-02-28T00:00:00.000Z")
    let d = cal.date(year: 2026, month: 5, day: 4, hour: 13)
    #expect(cal.startOfDay(d).iso8601 == "2026-05-04T00:00:00.000Z")
    #expect(cal.isSameDay(d, cal.date(year: 2026, month: 5, day: 4, hour: 23, minute: 59)))
    #expect(!cal.isSameDay(d, cal.date(year: 2026, month: 5, day: 5)))
    var madrid = Calendar(identifier: .gregorian)
    madrid.timeZone = TimeZone(identifier: "Europe/Madrid")!
    #expect(madrid.date(year: 2026, month: 7, day: 1, hour: 12).iso8601 == "2026-07-01T10:00:00.000Z")
    #expect(!Calendar.deviceTimeZone.isEmpty)
  }

  @Test func durations() {
    #expect(Duration.milliseconds(300.0).milliseconds == 300)
    #expect(Duration.seconds(2.5).seconds == 2.5)
    #expect(Duration.minutes(1.5) == .seconds(90))
    #expect(Duration.hours(2) == .seconds(7200))
    #expect(Duration.days(1) == .seconds(86400))
    #expect(Duration(seconds: 1.25).milliseconds == 1250)
    #expect(Duration.seconds(1).plus(.milliseconds(500)) == .milliseconds(1500))
    #expect(Duration.seconds(2).times(1.5) == .seconds(3))
    #expect(Duration.zero.seconds == 0)
    #expect(Duration.seconds(65).clockText == "1:05")
    #expect(Duration.seconds(3723.9).clockText == "1:02:03")
    #expect(Duration.seconds(9).clockText == "0:09")
  }

  @Test func monotonicClock() async throws {
    let start = ContinuousClock.now
    try await Task.sleep(for: .milliseconds(15))
    #expect(start.elapsed >= .milliseconds(10))
    #expect(ContinuousClock.now.milliseconds > start.milliseconds)
    let at = ContinuousClock.Instant(milliseconds: 1234)
    #expect(Swift.abs(at.milliseconds - 1234) < 0.001)
  }

  @Test func abbreviatedAsTimelines() {
    let now = Date.fromMilliseconds(1_795_717_800_000)
    for c in Fixtures.intl.abbreviated {
      let date = now.adding(.seconds(c.seconds))
      #expect(date.formatted(.abbreviated, locale: "en-US", now: now) == c.text, "\(c.seconds)")
    }
  }
}
