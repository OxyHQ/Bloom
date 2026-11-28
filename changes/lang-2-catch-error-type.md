---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A caught error is TS's `Error` in the emitted TS, as Bloom's `Error` is everywhere else: `catch { isRetryable(error) }` with `func isRetryable(_ e: Error)` was refused by tsc, since a JS catch binding is `unknown`. The emit binds it as `const error = $error as Error` (a type only; the value is the thrown one, so `error.jsValue` and `as? JSError` read what was thrown).
