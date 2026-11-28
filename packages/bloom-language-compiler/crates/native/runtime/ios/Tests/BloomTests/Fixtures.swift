import Foundation

/// The TS runtime's answers (`Fixtures/make-intl-fixtures.mjs` wrote them), read from the
/// source tree.
enum Fixtures {
  static let directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("Fixtures")

  static func data(_ name: String) -> Data {
    (try? Data(contentsOf: directory.appendingPathComponent(name))) ?? Data()
  }

  static let intl: IntlFixtures = try! JSONDecoder().decode(IntlFixtures.self, from: data("intl-fixtures.json"))
}

struct IntlFixtures: Decodable {
  struct DateCase: Decodable { let ms: Double; let locale: String; let timeZone: String; let date: String; let time: String; let text: String }
  struct RelativeCase: Decodable { let value: Double; let unit: String; let locale: String; let text: String }
  struct RelativeDateCase: Decodable { let seconds: Double; let locale: String; let text: String }
  struct AbbreviatedCase: Decodable { let seconds: Double; let text: String }
  struct ISOCase: Decodable { let ms: Double; let text: String }
  struct ParseCase: Decodable { let text: String; let ms: Double? }
  struct NumberCase: Decodable { let n: Double; let locale: String; let digits: Int; let text: String }
  struct CompactCase: Decodable { let n: Double; let locale: String; let text: String }
  struct PluralCase: Decodable { let n: Double; let locale: String; let category: String }
  struct Parts: Decodable, Equatable { let href, scheme, host, port, path, query, fragment: String }
  struct URLCase: Decodable { let text: String; let base: String?; let parts: Parts? }
  struct ComponentCase: Decodable { let text, encoded, decoded: String }
  struct URLs: Decodable { let parsed: [URLCase]; let resolved: [URLCase]; let components: [ComponentCase] }
  struct NumberText: Decodable { let n: Double; let text: String }
  struct JSONCase: Decodable { let value: String; let indent: Int; let text: String }
  struct RouteTable: Decodable { let root: String; let routes: [String: [String]] }
  struct RouteValue: Decodable {
    let tag: String
    let values: [String: String]
    init(from decoder: Decoder) throws {
      if let s = try? decoder.singleValueContainer().decode(String.self) {
        tag = s
        values = [:]
        return
      }
      var all = try decoder.singleValueContainer().decode([String: String].self)
      tag = all.removeValue(forKey: "tag") ?? ""
      values = all
    }
  }
  struct RouteCase: Decodable { let route: RouteValue; let path: String }
  struct Found: Decodable { let tag: String; let params: [String: String] }
  struct PathCase: Decodable { let path: String; let route: Found? }
  struct Routing: Decodable { let table: RouteTable; let routes: [RouteCase]; let paths: [PathCase] }

  let node, icu, cldr: String
  let dates: [DateCase]
  let relative: [RelativeCase]
  let relativeDates: [RelativeDateCase]
  let abbreviated: [AbbreviatedCase]
  let iso: [ISOCase]
  let parse: [ParseCase]
  let numberFormats: [NumberCase]
  let compact: [CompactCase]
  let plural: [PluralCase]
  let urls: URLs
  let numberTexts: [NumberText]
  let json: [JSONCase]
  let routing: Routing
  let regexes: [RegexCase]
  let localized: [LocalizedCase]

  struct RegexMatchCase: Decodable { let text: String; let start: Int; let groups: [String]; let named: [String: String] }
  struct RegexCase: Decodable {
    let pattern, flags, text: String
    let error: Bool
    let matches: [RegexMatchCase]
    let replaced: String
    let split: [String?]
  }
  struct LocalizedCase: Decodable { let locale, key: String; let args: [String: String]; let count: Double?; let text: String }
}
