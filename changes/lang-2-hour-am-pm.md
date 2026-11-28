---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's hour symbol in the standard library's `Date.FormatStyle`: `.hour(.defaultDigits(amPM: .abbreviated))`, `.hour(.twoDigits(amPM: .wide))` and `.defaultDigitsNoAMPM` / `.twoDigitsNoAMPM` (`HourStyle`, `AMPMStyle`). As in Swift, the hour is in the locale's clock, with its AM/PM where that clock has one: TS's `{ hour: '2-digit' }` is `.hour(.twoDigits(amPM: .abbreviated))`, "06 PM" in English and "18" in Spanish. `amPM: .omitted` drops the day period ("6" in English). Intl has one width of the AM/PM, so `.narrow`, `.abbreviated` and `.wide` write the same. `hour(_:)` takes a `HourStyle?` now, not a `DigitStyle`.
- A style's locale and clock: `DateFormat.locale(_:)` (Swift's `Date.FormatStyle.locale(_:)`) writes for that `Locale` over `formatted`'s `locale:`, and `Locale(identifier:hourCycle:)` with an `HourCycle` (Swift's `Locale.HourCycle`: `.zeroToEleven`, `.oneToTwelve`, `.zeroToTwentyThree`, `.oneToTwentyFour`) chooses its clock. TS's `hour12: true` is `.locale(Locale(identifier: locale, hourCycle: .oneToTwelve))`, Intl's `hourCycle: 'h12'`. The field map handed to `formatDateFields` may carry `locale`, `hourCycle` (`h11`, `h12`, `h23`, `h24`) and `amPM: "omitted"`, which a native runtime reads too.
