---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's numeric initializers of a number: `Int(x)` truncates a `Double` toward zero (`Math.trunc`), and `Double(n)` / `Float(n)` of an `Int` is the number, so `Double(a) / Double(b)` divides exactly; neither is optional. `Int(s)` / `Double(s)` of a string stay its number or `none`. Anything else is B0201. **IR (additive):** `CallRes::Convert { int }`.
