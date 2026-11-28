---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `s.contains(try! Regex("…"))` is the standard library's `contains(_ regex: Regex)`, as `s.contains(regex)` of a `Regex` name already was: through `try`, `try!` and `try?` the regex was not seen, so the string's own `contains(String)` took the call (B0201).
