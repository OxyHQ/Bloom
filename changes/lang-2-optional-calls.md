---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A silent miscompile:** an optional call of a method lowered to a function of its receiver dropped its `?.` guard, so `p?.twice(2) ?? 0` emitted `P$twice(p, 2) ?? 0` and a `none` receiver ran the method on `undefined` (`d?.formatted(…)` and `d?.timeIntervalSince(x)` on a `Date?` threw). An extension method, a standard library method and a protocol witness called through `?.`, or through an earlier `?.` of the chain (`a?.b()?.c()`, `a?.b.c()`), now read the receiver once and run only when it is not `none`, as their getters already did.
- A subscript is a link of an optional chain, as Swift's is: `q?.xs[0]` is `Int?` (it was B0201 on `[Int]?`), and a subscript after a guarded call reads through `?.[`.
- An implicit member after `??` takes the left side's type, as in Swift: `x ?? .nan`, `d?.timeIntervalSince1970 ?? .nan`, `n ?? .zero` (B0212 before). An implicit member reads a built-in type's static members (`let z: Double = .infinity`). `Int.zero` and `Double.zero` are new.
