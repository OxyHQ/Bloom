---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A narrowed name is its source's dependency. Inside `if sliceKey != none` (or `if x is T`), a child cached on what it reads depended only on its other reads, so a recycled row kept drawing the first `sliceKey` it saw (Mention's `ThreadHoverOverlay`). `if let`, `guard let`, `switch` patterns, `for` and `as?` bind locals of the body, which a child's cache never reads, and were not affected.
