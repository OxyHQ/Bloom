---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A dictionary's element written in place (`table[key] = value` on a `var`) is `{ ...table, [key]: value }`. It was a list's `$at(table, key, value)`, which threw at run time (`items.slice is not a function`).
