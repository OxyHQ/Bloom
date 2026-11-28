// Bloom (i18n): `String.localized`, the catalogs `bloom build` registers, plural rules and
// Bloom's `Locale`, as the TS runtime does them: a key's string in the preferred locale, else its
// language's, else English's, else the key; `{name}`s replaced from `args`, and the plural form
// of `count` by CLDR's rules (`PluralRules.swift`).
import Foundation

/// Bloom's `Locale`: a language and region as BCP 47 writes it (`en`, `es-ES`, `pt-BR`), and the
/// locale strings are shown in. (Foundation's `Locale.current` is the device's and its
/// `languageCode` is optional; Bloom's `current` honours `prefer(_:)`.)
public struct BloomLocale: Equatable, Hashable, Sendable, Codable {
  public let identifier: String

  public init(identifier: String) { self.identifier = identifier }

  /// The locale strings are shown in: the one set with `prefer`, else the device's.
  public static var current: BloomLocale { BloomLocale(identifier: preferredLocale()) }

  /// Shows strings in `locale` from now on (a language setting in the app).
  public static func prefer(_ locale: BloomLocale) { localization.withLock { $0.preferred = locale.identifier.isEmpty ? nil : locale.identifier } }

  /// The language part (`es` of `es-ES`).
  public var languageCode: String { identifier.split("-").first ?? identifier }

  /// The region part (`ES` of `es-ES`), or `none`.
  public var regionCode: String? { identifier.split("-").at(1) }

  /// The CLDR plural category of `n` here: `zero`, `one`, `two`, `few`, `many` or `other`.
  public func pluralCategory(_ n: Double) -> String { Bloom.pluralCategory(n, identifier) }

  /// The locale as Foundation's.
  public var foundationLocale: Foundation.Locale { Foundation.Locale(identifier: identifier) }
}

private struct Localization {
  var preferred: String?
  var catalogs: [String: OrderedDictionary<String, JSONValue>] = [:]
}

private let localization = Locked(Localization())

/// The device's locale, as BCP 47 (`en-US`).
func deviceLocale() -> String {
  let id = Foundation.Locale.current.identifier(.bcp47)
  return id.isEmpty || id == "und" ? "en-US" : id
}

/// The preferred locale (`Locale.prefer`), else the device's.
func preferredLocale() -> String { localization.withLock { $0.preferred } ?? deviceLocale() }

/// Registers a catalog (`bloom build` registers the package's own at startup): an object of
/// keys to strings, or to plural forms by CLDR category.
public func registerLocalizations(_ locale: String, _ catalog: JSONValue) {
  localization.withLock { $0.catalogs[locale] = catalog.objectValue ?? [:] }
}

extension String {
  /// The string for `key` in the current locale, `{name}`s replaced from `args` and the plural
  /// form chosen by `count` (`{count}` replaced too); `key` itself when missing. (Bloom's
  /// `String(localized:)`; Foundation's `String(localized:)` initializer is its own.)
  public static func localized(_ key: String, args: OrderedDictionary<String, String> = [:], count: Double? = nil) -> String {
    localize(key, args, count)
  }
}

private func lookup(_ key: String, _ locale: String) -> JSONValue? {
  localization.withLock { state in
    if let exact = state.catalogs[locale]?[key] { return exact }
    let language = locale.split("-").first ?? locale
    if let general = state.catalogs[language]?[key] { return general }
    return state.catalogs["en"]?[key]
  }
}

/// The runtime's `localize`.
func localize(_ key: String, _ args: OrderedDictionary<String, String>, _ count: Double?) -> String {
  let locale = preferredLocale()
  let text: String
  switch lookup(key, locale) {
  case nil:
    text = key
  case .string(let s)?:
    text = s
  case .object(let forms)?:
    let category = count.map { pluralCategory($0, locale) } ?? "other"
    text = forms[category]?.stringValue ?? forms["other"]?.stringValue ?? key
  default:
    text = key
  }
  // `{name}` → args[name] (or the count), else kept as written.
  var out = ""
  var rest = Substring(text)
  while let open = rest.firstIndex(of: "{") {
    out += rest[..<open]
    let after = rest[rest.index(after: open)...]
    let name = after.prefix { $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "_") }
    guard !name.isEmpty, name.endIndex < after.endIndex, after[name.endIndex] == "}" else {
      out += "{"
      rest = after
      continue
    }
    let close = after.index(after: name.endIndex)
    if let value = args[String(name)] {
      out += value
    } else if name == "count", let count {
      out += stringOfNumber(count)
    } else {
      out += rest[open..<close]
    }
    rest = rest[close...]
  }
  return out + rest
}
