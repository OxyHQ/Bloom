---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A call that returns `Never` (`fatal(…)`, or any `func … -> Never`) ends a path as `return` and `throw` do: as a function's or closure's last statement, in a `guard`'s `else`, and in each `catch` of a `do` that ends a function, so `do { return try f() } catch { if retry { return 0 }; fatal("…") }` needs no value after it. Before, only a call named `fatalError` did, and a `do`/`catch` ending in `fatal(…)` was B0201 "this block gives no value".
