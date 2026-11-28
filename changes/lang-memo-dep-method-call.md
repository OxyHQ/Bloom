---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A memoized value that calls a method on an optional (`let t = title?.trimmed()`) depends on its receiver, `title`. It was keyed on `title?.trimmed`, the method's name read as a JS property (always `undefined`), so it computed once and never again (Mention's PostArticleModal never showed a fetched article).
