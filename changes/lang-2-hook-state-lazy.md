---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A hook function's `@State var x = f()` computes its initial value once, on the first call (`useState(() => f())`), as a view's `@State` does; it ran `f()` on every render.
