---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **`x ?? (c ? a : b)` is the branches' type:** with no `none` branch it is `Float`, as Swift's `T? ?? T` is `T`; it was `Float?`, so comparing or returning it was B0201 (mention15 coalesce-ternary-optional). A branch written `none` keeps it optional.
