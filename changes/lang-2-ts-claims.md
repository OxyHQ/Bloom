---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- TS's types are claims, Bloom's are guarantees. A `?.`, `?[…]` or `??` written on a value whose type comes from TS (a `Foreign`, a type read from a `.d.ts`, or what is read from one) keeps its runtime form where TS says the value is always there (`viewPost?.authors?.map { … } ?? []`), where it was B0201. On a Bloom type it stays B0201.
- `xs?[i]` is Swift's optional subscript, emitted `xs?.[i]` (it read as `xs?` then `[i]`, an early return).
