---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- `Int` is a 64-bit signed integer, Swift's (ADR 0003's native backends compile it to Kotlin's `Long` and Swift's `Int`). The JS backend keeps it a JS `number`, exact within ±(2^53 − 1), and a dev build now traps an `Int` `+`, `-` or `*` (and `+=`, `-=`, `*=`) whose result leaves that range (`$int`, a `RangeError`), as Swift traps an overflow; a release build emits the plain arithmetic. An integer literal outside the range stays B0105, now worded for the JS backend. The spec's 4.1 and 4.3 say so.
