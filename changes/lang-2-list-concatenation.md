---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's `+` on arrays: `a + b` of two arrays of one element type is a new array, `a`'s elements then `b`'s, and `xs += ys` (on a `var` and a `@State`) is `xs = xs + ys`. The TS is a spread with a literal's items in place (`["first"] + a + ["last"]` is `["first", ...a, "last"]`). Before, both were B0201. The checked tree is a `Binary(Add)` typed `[T]`: Kotlin's and Swift's own `+` on lists.
