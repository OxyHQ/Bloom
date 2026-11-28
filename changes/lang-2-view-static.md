---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- **A view's `static let` read qualified:** `struct Card: View { static let fallback = "Untitled" }` is the type's constant (`Card$$fallback`), so `Card.fallback` reads it in the view and outside it, as Swift's static does (it was B0205); the body still reads `fallback` unqualified.
