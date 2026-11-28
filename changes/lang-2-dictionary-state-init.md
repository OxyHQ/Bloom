---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A view's `@State var counts: [String: Int] = [:]` starts as `{}`. It was emitted as `useState(() => {})`, a function that returns nothing.
