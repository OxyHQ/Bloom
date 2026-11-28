---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- One `try` (or `try!`) covers the whole expression to its right, as the spec says and Swift does: `try g(a) + h(b)`, `try ok() ? a() : b()` and `try g(a) == h(a)` mark every call in them. Before, a throwing call right of the first operand was B0223. A `try?` still covers its operand only (`try? f() ?? x` is `(try? f()) ?? x`).
