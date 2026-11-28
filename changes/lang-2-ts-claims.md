---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- TS's types are claims, Bloom's are guarantees. A `?.`, `?[…]` or `??` written on a value whose type comes from TS (a `Foreign`, a type read from a `.d.ts`, or what is read from one) keeps its runtime form where TS says the value is always there (`viewPost?.authors?.map { … } ?? []`), where it was B0201. On a Bloom type it stays B0201.
- `xs?[i]` is Swift's optional subscript, emitted `xs?.[i]` (it read as `xs?` then `[i]`, an early return).
- `{}` is the empty record where a struct's optional is expected too (`viewPost?.metadata ?? {}`), where it was read as a closure.
- `ts.state ?? {}` where the TS type has required fields is TS's `State | {}`: a `Partial<State>`, whose fields read as optional (emitted `{} as Partial<State>`).
- A `let`, and a view's `let` member, keep the claim of the TS value they hold (`let path = usePathname(); path?.endsWith(…)`).
- A closure's parameter may be wider than the one expected (`{ file: File? in … }` where `(File) -> Unit` is taken), as Swift's `(T?) -> U` fits `(T) -> U`.
