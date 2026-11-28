---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A function that does not await fits an `async` function type, as in Swift: `let one: () async -> Int = { 1 }` and `run(count)` with `func run(_ work: () async -> Int)` were B0201. A closure there is emitted `async`; a function value is wrapped (`async (...$args) => count(...$args)`), so the caller still gets a promise. **CheckResult (additive):** `async_wraps`, the expressions given as an `async` function, and a closure's `ClosureInfo.is_async` is `true` where an `async` type is expected, `await` or not.
