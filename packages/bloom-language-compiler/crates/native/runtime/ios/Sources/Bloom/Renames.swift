// Bloom name -> Swift name
// AsyncStream -> BloomAsyncStream
// Calendar.timeZone -> Calendar.deviceTimeZone
// Character -> String
// Codec<T> -> T.Type
// ContinuousClock -> ContinuousClock.Instant
// DateComponents -> BloomDateComponents
// DecodingError -> BloomDecodingError
// Locale -> BloomLocale
// Regex -> BloomRegex
// Result -> BloomResult
// Set -> OrderedSet
// Task<T> -> Task<T, any Error>
// TaskGroup -> BloomTaskGroup
// URL -> BloomURL
// URLQueryItem -> BloomURLQueryItem
// [String: V] -> OrderedDictionary<String, V>
// Date.distance(to:) -> Date.duration(to:)
// Double.rounded() -> Double.bloomRounded()
// String.capitalized -> String.capitalizedFirst
//
// The table above is what the emitter reads: one `Bloom name -> Swift name` per line, types
// first, then members (`Type.member` on both sides). Everything else in the standard library
// keeps its Bloom name and labels. Why each is renamed:
//
// - `AsyncStream`, `TaskGroup`, `Regex`, `Result`, `DateComponents`, `DecodingError`, `URL`,
//   `URLQueryItem`, `Locale`: Swift or Foundation has a type of that name with other semantics
//   (a single-consumer stream; a group living only inside `withTaskGroup`; typed captures; an
//   `Error`-only failure; optional fields; an enum of contexts; unnormalised optional parts; an
//   optional value; the device's locale without `prefer`).
// - `Tab` keeps its name (BloomUI's request); where SwiftUI is imported too, write `Bloom.Tab`.
// - `Character` is Bloom's alias of `String` (a grapheme cluster as a string).
// - `Codec<T>`: Swift's `Codable` needs no codec value; `Post.self` is the metatype, which every
//   API here takes (`JSON.decode(Post.self, from:)`), and `Array.codec(Post.self)` is `[Post].self`.
// - `Task<T>`: Swift's `Task` has two parameters; Bloom's throws `any Error`.
// - `ContinuousClock`: Bloom's clock value is Swift's `ContinuousClock.Instant`
//   (`ContinuousClock.now.milliseconds` works as written).
// - `[String: V]`, `Set<T>`: insertion-ordered, as JS's (`Collections.swift`).
// - `Calendar.timeZone`: a static beside Foundation's instance `timeZone` hides it.
// - `Date.distance(to:)`: Foundation's (`-> TimeInterval`) would make every call ambiguous.
// - `Double.rounded()`: Swift's returns a `Double` and rounds -2.5 to -3; Bloom's is `Int` and
//   rounds halves up (`Math.round`). `floor()`, `ceil()`, `truncated()` keep their names.
// - `String.capitalized`: Foundation's capitalizes every word.
//
// Spellings the emitter must keep (no rename, but Swift needs them written out):
// - `Date.formatted(_:locale:now:)`, `Double.formatted(digits:locale:)`, `Int.formatted(locale:)`:
//   pass at least one argument (`formatted()` alone is Foundation's own).
// - `String.compare(_:locale:)`: always pass `locale:` (`""` for the device's), else
//   Foundation's `compare(_:)` answers with a `ComparisonResult`.
// - `fatal()` traps (`fatalError`) instead of throwing.
// - `refreshAction(_:_:)` (Concurrency.bloom) takes a SwiftUI `Binding`: it belongs to BloomUI
//   (SwiftUI's `.refreshable` does it), not to this module.
// - `JSON.parse`, `JSON.decode`, `HTTPResponse.json/decode`, `Regex.compile` and `orThrow` throw
//   (`try`); `JSON.encode` and `JSON.stringify` do not.
