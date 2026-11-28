---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A silent change to JSON:** a struct's `static let` (`static let empty: [Post] = []`) was one of its fields, so `Post(…)` took it as an argument with its default and derived `Codable` wrote and read an `"empty"` key. It is the type's (`Post$$empty`), never a field. Classes and enums already kept theirs apart; a view's `static let` stays a constant of its body.
