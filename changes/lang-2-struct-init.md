---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's initializers for structs, enums and built-in types. `init(…)` sets `self` field by field (`self.celsius = v`, or `celsius = v`) or whole (`self = …`), starting from the fields' defaults, and the call gives `self`. Every stored field without a default is set on every path before it returns, and none is read before it is set (B0405, definite initialization). `init?(…)` is failable: it gives `T?`, and `return none` fails it. A struct whose own body declares an `init` has no memberwise one (B0207), while an `init` in an extension keeps it. An enum's `init` is called by its labels, `Size(count: 3)`. The standard library's `Date` and `Regex` inits now write `self = …`. **CheckResult:** `Def.own_init` is new.
