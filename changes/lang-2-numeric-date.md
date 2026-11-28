---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `Date.formatted(date: .numeric, …)` writes what Swift writes, the numeric date with the full year ("11/26/2026" in English, "26/11/2026" in Spanish), not Intl's `short` style ("11/26/26"). With a time it is Intl's numeric fields too ("11/26/2026, 6:05 PM").
