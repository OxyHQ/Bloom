---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- The standard library's formatting takes Swift's `FormatStyle` shapes over Intl, each writing exactly what the TS it replaces writes (tested against Intl in English, Spanish, Japanese and Arabic):
  - `Double.formatted(fractionDigits: 0...3, locale:)`: JS's `toLocaleString()` is `0...3`, `{ maximumFractionDigits: n }` is `0...n`. `formatted(digits:)` stays, and `formatted(fractionDigits: n)` stays JS's `toFixed(n)`.
  - `Double.formatted(currency: "USD", locale:)` and `Int.formatted(currency:locale:)`: Intl's currency style.
  - `Date.formatted(.dateTime.month(.abbreviated).day(), locale:, timeZone:)`, field by field (`year`, `month`, `day`, `weekday`, `hour`, `minute`, `second`, each in Swift's styles), and `Date.formatted(date: .abbreviated, time: .shortened, locale:, timeZone:)`. `locale` and `timeZone` default to the device's.
  - **Breaking (pre-1.0):** `DateFormat` is now a struct, Swift's `FormatStyle`. `.relative`, `.abbreviated` and `.iso8601` read as before. `.dateTime(.medium, .short)` is now `formatted(date: .abbreviated, time: .shortened)`, `DateStyle` takes Swift's names (`numeric`, `abbreviated`, `long`, `complete`), and `TimeStyle` is new. `formatted()` with no arguments is Swift's `.dateTime`: the numeric date and the time.
- A range `a...b` where a `ClosedRange` is expected is that value (`ClosedRange<Bound>`, in the standard library), and an implicit member chain (`.dateTime.month(.abbreviated)` where a `DateFormat` is expected) starts from the expected type's static member, as Swift's does. An implicit member also reads a struct's static members (`.relative`).
