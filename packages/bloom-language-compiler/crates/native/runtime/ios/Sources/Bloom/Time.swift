// Bloom (time): `Date` is Foundation's `Date`, `Duration` is Swift's `Duration`, the
// monotonic clock is `ContinuousClock.Instant` and `Calendar` is Foundation's `Calendar`;
// these are Bloom's members on them, with the JS runtime's semantics (proleptic Gregorian
// fields, `Date.parse`'s ISO 8601, `toISOString`).
import Foundation

// MARK: - Date

extension Date {
  /// The instant `ms` milliseconds after 1970 (what JS APIs and many servers send).
  public static func fromMilliseconds(_ ms: Double) -> Date { Date(timeIntervalSince1970: ms / 1000.0) }

  /// The instant an ISO 8601 string names (`2026-11-26T18:30:00Z`, `2026-11-26`), or `none`.
  /// JS's `Date.parse` for the ISO forms: a date alone is UTC, a date and time without an
  /// offset is the device's local time. (The non-ISO forms V8 also guesses at,
  /// `"Nov 26 2026"`, are `none`.)
  public static func parse(iso8601 text: String) -> Date? {
    parseISOMilliseconds(text, timeZone: .current).map { Date.fromMilliseconds($0) }
  }

  /// Milliseconds since 1970.
  public var millisecondsSince1970: Double { timeIntervalSince1970 * 1000.0 }

  /// The instant as ISO 8601 in UTC, with milliseconds (`2026-11-26T18:30:00.000Z`: JS's
  /// `toISOString`).
  public var iso8601: String { isoString(millisecondsSince1970) }

  /// The instant `duration` later (earlier when negative).
  public func adding(_ duration: Duration) -> Date { Date(timeIntervalSince1970: timeIntervalSince1970 + duration.seconds) }

  /// How long from this instant to `other` (negative when `other` is earlier): Bloom's
  /// `distance(to:)`, which Foundation's `distance(to:) -> TimeInterval` would shadow.
  public func duration(to other: Date) -> Duration { Duration(seconds: other.timeIntervalSince1970 - timeIntervalSince1970) }

  /// Whether this instant is before `other`.
  public func isBefore(_ other: Date) -> Bool { self < other }

  /// Whether this instant is after `other`.
  public func isAfter(_ other: Date) -> Bool { self > other }

  /// The date written for a person in `locale` (`""`: the device's), relative to `now` for
  /// `.relative` and `.abbreviated`; the same text as the JS runtime's `Intl`.
  /// (Always pass the format: `formatted()` alone is Foundation's own.)
  public func formatted(_ format: DateFormat = .dateTime(.medium, .short), locale: String = "", now: Date = Date()) -> String {
    switch format {
    case .relative:
      return relativeText(timeIntervalSince1970 - now.timeIntervalSince1970, locale, "long")
    case .abbreviated:
      return abbreviatedText(now.timeIntervalSince1970 - timeIntervalSince1970)
    case .dateTime(let date, let time):
      return formatDate(millisecondsSince1970, locale, date.rawValue, time.rawValue, "")
    case .iso8601:
      return iso8601
    }
  }

  /// The calendar fields in the device's time zone (in UTC with `utc`).
  public func components(utc: Bool = false) -> BloomDateComponents {
    dateParts(millisecondsSince1970, utc ? TimeZone(identifier: "UTC")! : .current)
  }
}

/// How much of a date or a time a format shows.
public enum DateStyle: String, Sendable, Hashable, CaseIterable {
  case omitted
  case short
  case medium
  case long
  case full
}

/// How `Date.formatted(_:)` writes a date.
public enum DateFormat: Sendable, Hashable {
  /// "2 minutes ago", "in 3 days", "yesterday".
  case relative
  /// "2m", "3h", "4d": the short form timelines use.
  case abbreviated
  /// The date and the time, each in its style.
  case dateTime(DateStyle, DateStyle)
  /// `2026-11-26T18:30:00.000Z`.
  case iso8601
}

/// Bloom's `DateComponents`: the calendar fields of a date, all present (`month` 1–12,
/// `weekday` 1 = Sunday … 7). Foundation's `DateComponents` has optional fields.
public struct BloomDateComponents: Equatable, Hashable, Sendable {
  public let year: Int
  public let month: Int
  public let day: Int
  public let hour: Int
  public let minute: Int
  public let second: Int
  public let weekday: Int

  public init(year: Int, month: Int, day: Int, hour: Int, minute: Int, second: Int, weekday: Int) {
    self.year = year
    self.month = month
    self.day = day
    self.hour = hour
    self.minute = minute
    self.second = second
    self.weekday = weekday
  }
}

/// "in 3 minutes" / "2 hours ago": the largest unit that fits (Time.bloom's `relativeText`).
func relativeText(_ seconds: Double, _ locale: String, _ style: String) -> String {
  let size = Swift.abs(seconds)
  func f(_ v: Double, _ unit: String) -> String { formatRelative(Double(v.bloomRounded()), unit, locale, style) }
  if size < 60.0 { return f(seconds, "second") }
  if size < 3600.0 { return f(seconds / 60.0, "minute") }
  if size < 86400.0 { return f(seconds / 3600.0, "hour") }
  if size < 604800.0 { return f(seconds / 86400.0, "day") }
  if size < 2629800.0 { return f(seconds / 604800.0, "week") }
  if size < 31557600.0 { return f(seconds / 2629800.0, "month") }
  return f(seconds / 31557600.0, "year")
}

/// "now", "5m", "3h", "2d", "4w", "1y": how long ago, in a timeline's short form.
func abbreviatedText(_ ago: Double) -> String {
  let s = Swift.abs(ago)
  if s < 60.0 { return "now" }
  if s < 3600.0 { return "\((s / 60.0).floor())m" }
  if s < 86400.0 { return "\((s / 3600.0).floor())h" }
  if s < 604800.0 { return "\((s / 86400.0).floor())d" }
  if s < 31557600.0 { return "\((s / 604800.0).floor())w" }
  return "\((s / 31557600.0).floor())y"
}

// MARK: - Calendar arithmetic (JS's: proleptic Gregorian, integer milliseconds)

private let msPerDay = 86_400_000.0

private func floorDiv(_ a: Int, _ b: Int) -> Int { a >= 0 ? a / b : -((-a + b - 1) / b) }

/// Days since 1970-01-01 of a proleptic Gregorian date (month 1–12).
func daysFromCivil(_ year: Int, _ month: Int, _ day: Int) -> Int {
  let y = month <= 2 ? year - 1 : year
  let era = floorDiv(y, 400)
  let yoe = y - era * 400
  let mp = month > 2 ? month - 3 : month + 9
  let doy = (153 * mp + 2) / 5 + day - 1
  let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
  return era * 146_097 + doe - 719_468
}

/// The proleptic Gregorian date of a day since 1970-01-01.
func civilFromDays(_ days: Int) -> (year: Int, month: Int, day: Int) {
  let z = days + 719_468
  let era = floorDiv(z, 146_097)
  let doe = z - era * 146_097
  let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365
  let doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
  let mp = (5 * doy + 2) / 153
  let d = doy - (153 * mp + 2) / 5 + 1
  let m = mp < 10 ? mp + 3 : mp - 9
  return (yoe + era * 400 + (m <= 2 ? 1 : 0), m, d)
}

/// JS's `MakeDay` + `MakeTime`, in milliseconds of "local" time: months and days overflow
/// into the next ones (`month: 13` is January of the next year).
func makeMilliseconds(_ year: Int, _ month: Int, _ day: Int, _ hour: Int, _ minute: Int, _ second: Int, _ ms: Double = 0) -> Double {
  let m0 = month - 1
  let y = year + floorDiv(m0, 12)
  let m = m0 - floorDiv(m0, 12) * 12 + 1
  let days = daysFromCivil(y, m, 1) + day - 1
  return Double(days) * msPerDay + Double(hour) * 3_600_000 + Double(minute) * 60_000 + Double(second) * 1000 + ms
}

/// The UTC milliseconds of local milliseconds `local` in `zone` (JS's `UTC(t)`; in a gap the
/// earlier offset applies).
func utcMilliseconds(fromLocal local: Double, in zone: TimeZone) -> Double {
  let guess = Double(zone.secondsFromGMT(for: Date.fromMilliseconds(local))) * 1000
  let first = local - guess
  let actual = Double(zone.secondsFromGMT(for: Date.fromMilliseconds(first))) * 1000
  return actual == guess ? first : local - actual
}

/// JS's `toISOString` of `ms` (`Invalid Date` past ±8.64e15).
func isoString(_ ms: Double) -> String {
  guard ms.isFinite, Swift.abs(ms) <= 8.64e15 else { return "Invalid Date" }
  let t = Int(ms.rounded(.towardZero)) + 0
  let days = floorDiv(t, 86_400_000)
  let inDay = t - days * 86_400_000
  let (y, m, d) = civilFromDays(days)
  let year: String
  if y >= 0 && y <= 9999 {
    year = pad(y, 4)
  } else {
    year = (y < 0 ? "-" : "+") + pad(Swift.abs(y), 6)
  }
  let h = inDay / 3_600_000
  let mi = inDay / 60_000 % 60
  let s = inDay / 1000 % 60
  let milli = inDay % 1000
  return "\(year)-\(pad(m, 2))-\(pad(d, 2))T\(pad(h, 2)):\(pad(mi, 2)):\(pad(s, 2)).\(pad(milli, 3))Z"
}

private func pad(_ n: Int, _ width: Int) -> String {
  let s = String(n)
  return s.count >= width ? s : String(repeating: "0", count: width - s.count) + s
}

/// The calendar fields of `ms` in `zone`, as JS's `Date` getters read them.
func dateParts(_ ms: Double, _ zone: TimeZone) -> BloomDateComponents {
  let t = ms.rounded(.towardZero)
  let offset = Double(zone.secondsFromGMT(for: Date.fromMilliseconds(t))) * 1000
  let local = Int(t + offset)
  let days = floorDiv(local, 86_400_000)
  let inDay = local - days * 86_400_000
  let (y, m, d) = civilFromDays(days)
  let weekday = ((days % 7) + 7 + 4) % 7 + 1 // 1970-01-01 was a Thursday
  return BloomDateComponents(
    year: y, month: m, day: d, hour: inDay / 3_600_000, minute: inDay / 60_000 % 60, second: inDay / 1000 % 60, weekday: weekday)
}

/// JS's `Date.parse` of the ISO 8601 forms (and V8's leniencies: lower-case `t`/`z`, a space
/// for `T`, any number of fraction digits, an offset without its colon), in milliseconds.
func parseISOMilliseconds(_ text: String, timeZone: TimeZone) -> Double? {
  let c = Array(text.utf8)
  var i = 0
  func digits(_ n: Int) -> Int? {
    guard i + n <= c.count else { return nil }
    var v = 0
    for k in 0..<n {
      let ch = c[i + k]
      guard ch >= 48 && ch <= 57 else { return nil }
      v = v * 10 + Int(ch - 48)
    }
    i += n
    return v
  }
  func peek(_ ch: Character) -> Bool { i < c.count && c[i] == ch.asciiValue! }
  // Year: YYYY or ±YYYYYY.
  var year: Int
  if peek("+") || peek("-") {
    let negative = peek("-")
    i += 1
    guard let y = digits(6) else { return nil }
    if negative && y == 0 { return nil }
    year = negative ? -y : y
  } else {
    guard let y = digits(4) else { return nil }
    year = y
  }
  var month = 1
  var day = 1
  if peek("-") {
    i += 1
    guard let m = digits(2), (1...12).contains(m) else { return nil }
    month = m
    if peek("-") {
      i += 1
      guard let d = digits(2), (1...31).contains(d) else { return nil }
      day = d
    }
  }
  var hour = 0
  var minute = 0
  var second = 0
  var fraction = 0.0
  var hasTime = false
  var offsetMs: Double?
  if i < c.count && (peek("T") || peek("t") || peek(" ")) {
    i += 1
    hasTime = true
    guard let h = digits(2), peek(":") else { return nil }
    i += 1
    guard let mi = digits(2) else { return nil }
    hour = h
    minute = mi
    if peek(":") {
      i += 1
      guard let s = digits(2) else { return nil }
      second = s
      if peek(".") {
        i += 1
        var scale = 100.0
        var any = false
        while i < c.count && c[i] >= 48 && c[i] <= 57 {
          fraction += Double(c[i] - 48) * scale
          scale /= 10
          i += 1
          any = true
        }
        if !any { return nil }
        fraction = fraction.rounded(.down)
      }
    }
    guard hour < 24 || (hour == 24 && minute == 0 && second == 0 && fraction == 0), minute < 60, second < 60 else {
      return nil
    }
    if peek("Z") || peek("z") {
      i += 1
      offsetMs = 0
    } else if peek("+") || peek("-") {
      let sign: Double = peek("-") ? -1 : 1
      i += 1
      guard let oh = digits(2) else { return nil }
      if peek(":") { i += 1 }
      guard let om = digits(2), oh < 24, om < 60 else { return nil }
      offsetMs = sign * Double(oh * 3_600_000 + om * 60_000)
    }
  }
  guard i == c.count else { return nil }
  let local = makeMilliseconds(year, month, day, hour, minute, second, fraction)
  let ms: Double
  if let offsetMs {
    ms = local - offsetMs
  } else if hasTime {
    ms = utcMilliseconds(fromLocal: local, in: timeZone)
  } else {
    ms = local
  }
  return Swift.abs(ms) <= 8.64e15 ? ms : nil
}

// MARK: - Duration

extension Duration {
  /// A duration of `seconds` (Bloom's `Duration(seconds:)`).
  public init(seconds: Double) { self = .seconds(seconds) }

  /// The length in seconds.
  public var seconds: Double { Double(components.seconds) + Double(components.attoseconds) / 1e18 }

  /// The length in milliseconds.
  public var milliseconds: Double { Double(components.seconds) * 1000.0 + Double(components.attoseconds) / 1e15 }

  /// `n` minutes.
  public static func minutes(_ n: Double) -> Duration { .seconds(n * 60.0) }

  /// `n` hours.
  public static func hours(_ n: Double) -> Duration { .seconds(n * 3600.0) }

  /// `n` days of 24 hours.
  public static func days(_ n: Double) -> Duration { .seconds(n * 86400.0) }

  /// The two durations added.
  public func plus(_ other: Duration) -> Duration { self + other }

  /// The duration `factor` times over.
  public func times(_ factor: Double) -> Duration { self * factor }

  /// "1:05", "1:02:03": as a player shows it.
  public var clockText: String {
    let total = seconds.floor()
    let h = total / 3600
    let m = (total % 3600) / 60
    let sec = total % 60
    let mm = h > 0 ? "\(m)".paddingStart(to: 2, with: "0") : "\(m)"
    let ss = "\(sec)".paddingStart(to: 2, with: "0")
    return h > 0 ? "\(h):\(mm):\(ss)" : "\(mm):\(ss)"
  }
}

// MARK: - ContinuousClock

/// The start `ContinuousClock.Instant.milliseconds` counts from.
private let clockStart = ContinuousClock.now

extension ContinuousClock.Instant {
  /// Bloom's `ContinuousClock(milliseconds:)`: the instant `ms` milliseconds after an
  /// arbitrary start.
  public init(milliseconds ms: Double) { self = clockStart.advanced(by: .milliseconds(ms)) }

  /// Milliseconds since an arbitrary start (the same for every instant of a run).
  public var milliseconds: Double { clockStart.duration(to: self).milliseconds }

  /// How long since this instant.
  public var elapsed: Duration { ContinuousClock.now - self }
}

// MARK: - Calendar

extension Calendar {
  /// Bloom's `Calendar(utc:)`: the Gregorian calendar in UTC, or in the device's time zone.
  public init(utc: Bool) {
    self.init(identifier: .gregorian)
    self.timeZone = utc ? TimeZone(identifier: "UTC")! : .current
  }

  /// Whether the calendar's time zone is UTC.
  public var utc: Bool { timeZone.secondsFromGMT() == 0 && ["UTC", "GMT", "Etc/UTC", "Etc/GMT"].contains(timeZone.identifier) }

  /// The device's time zone (`Europe/Madrid`): Bloom's `Calendar.timeZone`, which Swift
  /// cannot declare beside Foundation's instance `timeZone`.
  public static var deviceTimeZone: String { TimeZone.current.identifier }

  /// The date of these fields in the calendar's time zone (`month` 1–12; fields overflow
  /// into the next, as JS's `new Date(y, m, d, …)`). Always Gregorian, as Bloom's is.
  public func date(year: Int, month: Int, day: Int, hour: Int = 0, minute: Int = 0, second: Int = 0) -> Date {
    let local = makeMilliseconds(year, month, day, hour, minute, second)
    return Date.fromMilliseconds(utcMilliseconds(fromLocal: local, in: timeZone))
  }

  /// Midnight at the start of `date`'s day.
  public func startOfDay(_ date: Date) -> Date {
    let c = dateParts(date.millisecondsSince1970, timeZone)
    return self.date(year: c.year, month: c.month, day: c.day)
  }

  /// Whether `a` and `b` fall on the same day.
  public func isSameDay(_ a: Date, _ b: Date) -> Bool { startOfDay(a) == startOfDay(b) }
}
