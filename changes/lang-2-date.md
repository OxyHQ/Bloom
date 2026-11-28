---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- The standard library's `Date` is a plain JS `Date` (zero cost), no longer a `{ timeIntervalSince1970 }` struct. It crosses the TS boundary as a JS `Date` in both directions, as Swift's `Date` bridges to `NSDate`: a TS function's `Date` parameter takes it and a TS `Date` result is one (lang-mention-11, about 12 corpus files).
  - Swift's API: `Date()`, `Date.now`, `Date(timeIntervalSince1970:)`, `Date(millisecondsSince1970:)`, `try? Date(text, strategy: .iso8601)` (JS's `Date.parse`; throws a `DateParseError`), `.timeIntervalSince1970`, `addingTimeInterval(_:)`, `timeIntervalSince(_:)`, and `date + seconds` / `date - seconds`, besides `formatted(…)`.
  - Two `Date`s are `==` at the same instant (a struct holding one compares it so), and they compare with `<`.
  - A built-in type's `init`s are told apart by their labels (`Date$$init$timeIntervalSince1970`), and each body gives the value it makes.
  - A `"js"` import of `Date` no longer shadows the standard library's.
