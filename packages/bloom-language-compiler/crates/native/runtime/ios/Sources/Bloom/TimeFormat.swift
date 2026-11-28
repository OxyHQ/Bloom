// Dates and relative times written for a locale, as the JS runtime writes them with
// `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` (both ICU underneath).
//
// - Dates: ICU's date/time styles through `DateFormatter` (on Linux too: Foundation formats
//   with its own ICU). Both styles `omitted` is Intl's default, the `yMd` skeleton.
// - Relative times: `RelativeDateTimeFormatter` on Apple platforms; on Linux, where
//   swift-corelibs-foundation has none, ICU's `ureldatefmt` itself (Foundation's ICU,
//   `_FoundationICU`), which is what V8's `Intl.RelativeTimeFormat` calls.
//
// The strings match when the ICU/CLDR data match: Node, Apple and the Swift toolchain each
// ship their own (`Tests/BloomTests/IntlParityTests.swift` lists where they differ).
import Foundation

#if !canImport(Darwin) && canImport(_FoundationICU)
import _FoundationICU
#endif

/// A formatter, shared by every call with the same settings (configured once, then only read).
private final class FormatterBox<F>: @unchecked Sendable {
  let formatter: F
  init(_ formatter: F) { self.formatter = formatter }
}

private let dateFormatters = Locked([String: FormatterBox<DateFormatter>]())

/// The locale `identifier` names (BCP 47, `es-ES`), or the device's for `""`.
func foundationLocale(_ identifier: String) -> Foundation.Locale {
  identifier.isEmpty ? Foundation.Locale.current : Foundation.Locale(identifier: identifier)
}

private func formatterStyle(_ style: String) -> DateFormatter.Style {
  switch style {
  case "short": return .short
  case "medium": return .medium
  case "long": return .long
  case "full": return .full
  default: return .none
  }
}

/// `Intl.DateTimeFormat(locale, { dateStyle, timeStyle, timeZone }).format(ms)`: a style is
/// `omitted`, `short`, `medium`, `long` or `full`; `timeZone` `""` is the device's.
func formatDate(_ ms: Double, _ locale: String, _ date: String, _ time: String, _ timeZone: String) -> String {
  // V8 writes U+202F (CLDR 42's space before "PM") as a plain space, for the web's sake.
  platformFormatDate(ms, locale, date, time, timeZone).replacingOccurrences(of: "\u{202F}", with: " ")
}

private func platformFormatDate(_ ms: Double, _ locale: String, _ date: String, _ time: String, _ timeZone: String) -> String {
  #if !canImport(Darwin) && canImport(_FoundationICU)
  return icuFormatDate(ms, locale, date, time, timeZone)
  #else
  let key = "\(locale)|\(date)|\(time)|\(timeZone)"
  let box = dateFormatters.withLock { cache -> FormatterBox<DateFormatter> in
    if let found = cache[key] { return found }
    let f = DateFormatter()
    let loc = foundationLocale(locale)
    f.locale = loc
    f.timeZone = timeZone.isEmpty ? .current : (TimeZone(identifier: timeZone) ?? .current)
    if date == "omitted" && time == "omitted" {
      f.dateFormat = DateFormatter.dateFormat(fromTemplate: "yMd", options: 0, locale: loc)
    } else {
      f.dateStyle = formatterStyle(date)
      f.timeStyle = formatterStyle(time)
    }
    let made = FormatterBox(f)
    cache[key] = made
    return made
  }
  return box.formatter.string(from: Date.fromMilliseconds(ms))
  #endif
}

#if !canImport(Darwin) && canImport(_FoundationICU)
/// An ICU object, closed with its owner.
private final class ICUHandle: @unchecked Sendable {
  typealias Pointer = UnsafeMutablePointer<UDateFormat?>
  let pointer: Pointer
  private let close: (Pointer) -> Void
  init(_ pointer: Pointer, close: @escaping (Pointer) -> Void) {
    self.pointer = pointer
    self.close = close
  }
  deinit { close(pointer) }
}

private let icuDateFormats = Locked([String: ICUHandle]())
private let icuLock = NSLock()

/// The ICU locale ID of a BCP 47 tag (`es-ES` is `es_ES`), the device's for `""`.
func icuLocale(_ tag: String) -> String {
  let bcp = tag.isEmpty ? Foundation.Locale.current.identifier.replacingOccurrences(of: "_", with: "-") : tag
  var buffer = [CChar](repeating: 0, count: 157)
  var status = U_ZERO_ERROR
  let n = swift_uloc_forLanguageTag(bcp, &buffer, Int32(buffer.count), nil, &status)
  guard status.rawValue <= 0, n > 0 else { return bcp }
  return String(decoding: buffer.prefix(Int(n)).map { UInt8(bitPattern: $0) }, as: UTF8.self)
}

/// What ICU writes into a buffer, grown once when it was too small.
private func icuString(_ write: (UnsafeMutablePointer<UChar>, Int32, inout UErrorCode) -> Int32) -> String? {
  var buffer = [UChar](repeating: 0, count: 256)
  var status = U_ZERO_ERROR
  var n = write(&buffer, Int32(buffer.count), &status)
  if status == U_BUFFER_OVERFLOW_ERROR {
    buffer = [UChar](repeating: 0, count: Int(n) + 1)
    status = U_ZERO_ERROR
    n = write(&buffer, Int32(buffer.count), &status)
  }
  guard status.rawValue <= 0 else { return nil }
  return String(decoding: buffer[0..<Int(n)], as: UTF16.self)
}

private func icuStyle(_ style: String) -> UDateFormatStyle {
  switch style {
  case "short": return UDAT_SHORT
  case "medium": return UDAT_MEDIUM
  case "long": return UDAT_LONG
  case "full": return UDAT_FULL
  default: return UDAT_NONE
  }
}

/// V8's own path: `DateFormat::createDateTimeInstance(dateStyle, timeStyle)`, or the `yMd`
/// skeleton's best pattern when both are omitted.
private func icuFormatDate(_ ms: Double, _ locale: String, _ date: String, _ time: String, _ timeZone: String) -> String {
  let zone = Array((timeZone.isEmpty ? TimeZone.current.identifier : timeZone).utf16)
  let key = "\(locale)|\(date)|\(time)|\(timeZone)"
  let handle = icuDateFormats.withLock { cache -> ICUHandle? in
    if let found = cache[key] { return found }
    let id = icuLocale(locale)
    var status = U_ZERO_ERROR
    var made: ICUHandle.Pointer?
    if date == "omitted" && time == "omitted" {
      guard let generator = swift_udatpg_open(id, &status) else { return nil }
      defer { swift_udatpg_close(generator) }
      let skeleton = Array("yMd".utf16)
      guard let pattern = icuString({ buffer, capacity, s in
        swift_udatpg_getBestPattern(generator, skeleton, Int32(skeleton.count), buffer, capacity, &s)
      }) else { return nil }
      let p = Array(pattern.utf16)
      made = swift_udat_open(UDAT_PATTERN, UDAT_PATTERN, id, zone, Int32(zone.count), p, Int32(p.count), &status)
    } else {
      made = swift_udat_open(icuStyle(time), icuStyle(date), id, zone, Int32(zone.count), nil, 0, &status)
    }
    guard let made, status.rawValue <= 0 else { return nil }
    let h = ICUHandle(made, close: { swift_udat_close($0) })
    cache[key] = h
    return h
  }
  guard let handle else { return isoString(ms) }
  icuLock.lock()
  defer { icuLock.unlock() }
  return icuString { buffer, capacity, status in swift_udat_format(handle.pointer, ms, buffer, capacity, nil, &status) } ?? isoString(ms)
}
#endif

/// `Intl.RelativeTimeFormat(locale, { numeric: "auto", style }).format(value, unit)`: `unit`
/// is `second`, `minute`, `hour`, `day`, `week`, `month` or `year`; `style` `long`, `short`
/// or `narrow`.
func formatRelative(_ value: Double, _ unit: String, _ locale: String, _ style: String) -> String {
  #if canImport(Darwin)
  let f = RelativeDateTimeFormatter()
  f.locale = foundationLocale(locale)
  f.dateTimeStyle = .named
  f.unitsStyle = style == "short" ? .short : style == "narrow" ? .narrow : .full
  // A component of `value` (an integer: Bloom rounds first).
  let n = clampedInt(value)
  var parts = DateComponents()
  switch unit {
  case "second": parts.second = n
  case "minute": parts.minute = n
  case "hour": parts.hour = n
  case "day": parts.day = n
  case "week": parts.weekOfMonth = n
  case "month": parts.month = n
  default: parts.year = n
  }
  return f.localizedString(from: parts)
  #elseif canImport(_FoundationICU)
  let units: [String: URelativeDateTimeUnit] = [
    "second": UDAT_REL_UNIT_SECOND, "minute": UDAT_REL_UNIT_MINUTE, "hour": UDAT_REL_UNIT_HOUR,
    "day": UDAT_REL_UNIT_DAY, "week": UDAT_REL_UNIT_WEEK, "month": UDAT_REL_UNIT_MONTH, "year": UDAT_REL_UNIT_YEAR,
  ]
  let icuStyle = style == "short" ? UDAT_STYLE_SHORT : style == "narrow" ? UDAT_STYLE_NARROW : UDAT_STYLE_LONG
  let name = locale.isEmpty ? Foundation.Locale.current.identifier : locale
  var status = U_ZERO_ERROR
  guard let f = swift_ureldatefmt_open(name, nil, icuStyle, UDISPCTX_CAPITALIZATION_NONE, &status), status.rawValue <= 0 else {
    return stringOfNumber(value) + " " + unit
  }
  defer { swift_ureldatefmt_close(f) }
  var buffer = [UChar](repeating: 0, count: 128)
  status = U_ZERO_ERROR
  let length = swift_ureldatefmt_format(f, value, units[unit] ?? UDAT_REL_UNIT_YEAR, &buffer, Int32(buffer.count), &status)
  if status == U_BUFFER_OVERFLOW_ERROR {
    buffer = [UChar](repeating: 0, count: Int(length) + 1)
    status = U_ZERO_ERROR
    _ = swift_ureldatefmt_format(f, value, units[unit] ?? UDAT_REL_UNIT_YEAR, &buffer, Int32(buffer.count), &status)
  }
  return String(decoding: buffer[0..<Int(length)], as: UTF16.self)
  #else
  return stringOfNumber(value) + " " + unit
  #endif
}
