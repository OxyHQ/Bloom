---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- **Swift's slices:** `suffix(_:)` and `dropLast(_:)` on lists, `dropFirst()`/`dropLast()` dropping one, and `dropFirst(_:)`/`dropLast(_:)` on `String` (user-perceived characters, as its `prefix`/`suffix`). Past either end they give what there is and a count below zero takes or drops none, never JS `slice`'s negative-index reading (the codemod writes `slice(-n)` as `suffix(n)`). A list's `dropFirst(n)` clamps a negative `n` likewise.
