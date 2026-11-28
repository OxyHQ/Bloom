---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's hour symbol in the standard library's `Date.FormatStyle`: `.hour(.defaultDigits(amPM: .abbreviated))`, `.hour(.twoDigits(amPM: .wide))` and `.defaultDigitsNoAMPM` / `.twoDigitsNoAMPM` (`HourStyle`, `AMPMStyle`). A shown AM/PM is the 12-hour clock, as Intl's `hour12: true` writes it in every locale (TS's `{ hour: '2-digit', hour12: true }` is `.hour(.twoDigits(amPM: .abbreviated))`); `amPM: .omitted` is the locale's clock without the day period ("6" in English, "18" in Spanish). `.hour()` stays the locale's clock. Intl has one width of the AM/PM, so `.narrow`, `.abbreviated` and `.wide` write the same. `hour(_:)` takes a `HourStyle?` now, not a `DigitStyle`. The field map handed to `formatDateFields` may carry `hour12: "true"` and `amPM: "omitted"`, which a native runtime reads too.
