---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **`as? JSError` on a TS value:** `(error as? JSError)?.message ?? fallback` on a TS value Bloom does not type (a `.catch` callback's error, a `JSONValue`) was B0601 "a `Foreign` value flows into `Error`". The cast tests it at run time, as Swift's `Any as? Error` (`JSError.cast(error as unknown as Error)`); `HTTPError` likewise (mention15 foreign-as-jserror). `CheckResult.foreign_casts`.
