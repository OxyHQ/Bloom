---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Bloom 2.0, from the Mention corpus: an unannotated TS hook's result is read from its body, and `ReturnType<typeof useX>` resolves through it (for a `.bloom` hook too); a TS optional parameter takes `T?`; a conditional ending in `none` is the optional of its branches, at any depth and as a list item; `.id()` works on every node; a TS type named through re-exports is its declaration, so a callback alias types a closure's parameters; `catch let e as T` tests the error and `e as? T` casts it, through `T`'s `static func cast`; TS object types fit structurally; a record indexed by a union of its keys is the type of those fields; react-i18next's `t` gives a `String`; and a Bloom view where TS takes a React element is emitted as `toElement(view)`.
