---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A TS promise is covariant, as TS's is: a closure returning `Promise<Unit>` (`openExternal(url)`) fits TS's `(url: string) => Promise<unknown>`. It was B0201 (Mention's useOpenInAllo).
