---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- One `try` (or `try!`, `try?`) covers the whole expression to its right, as the spec says and Swift does: `try g(a) + h(b)`, `try ok() ? a() : b()` and `try g(a) == h(a)` mark every call in them. Before, a throwing call right of the first operand was B0223. `try? f() ?? x` is Swift's `try? (f() ?? x)`; of an `f()` that is never `none` the `??` never falls back, which is B0225, a warning whose fix is `(try? f()) ?? x`. Migrated code that meant the fallback of the `try?` writes the parentheses.
