---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- Swift's key path kinds: the key path of a struct's stored `var` is a `WritableKeyPath<S, V>`, which fits wherever a `KeyPath<S, V>` is expected. A `let`'s, and a class field's, is a `KeyPath`, which reads only. `next[keyPath: key] = v` through a `KeyPath` is B0403 "cannot assign through `KeyPath<S, V>`: it is read-only". `+=` (and `-=`, `*=`) through a writable key path writes as on any place, emitted as `next = { ...next, [key]: next[key] + v }`. A struct's stored `let` is set once, when the struct is made: `next.id = 4` outside the struct's own `init` is B0403 "cannot assign to `id`: it is a `let`". **CheckResult:** `Ty::KeyPath(root, value, writable)` takes a third field, and `FieldDef.mutable` is new: `false` for a struct's `let`, `true` for every TS and record field.
