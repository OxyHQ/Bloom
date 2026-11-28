---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Added
---

- The Kotlin backend's runtime has the standard library's `Math` externs (`sqrt`, `pow`, `cbrt`,
  `exp`, `log`, the trigonometry, `PI`, …) under their Bloom names, with `StrictMath` (fdlibm), so a
  package importing `Bloom.Math` compiles through `--std Math` and computes JavaScript's doubles;
  the number formatters go through ICU. `Map()` / `Map(entries)` and Swift's `ClosedRange`
  `lowerBound` / `upperBound` are in the runtime, and `rounded()` is exact where `floor(x + 0.5)`
  was not. Bloom's colour engine written in Bloom (`packages/bloom-theme-engine`, private) is
  their first user: it compiles to TypeScript and to Kotlin and is held to the TypeScript engine's
  goldens on both.
