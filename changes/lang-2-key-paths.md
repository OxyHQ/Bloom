---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's key paths in full: `\.field` and `\T.field` literals, `KeyPath<T, V>` and `WritableKeyPath<T, V>`, and `x[keyPath: k]` read and written on a value type's `var` copy or a `@State` (`next[keyPath: key] = value`), so a TS computed-key update (`{ ...prev, [key]: value }` with `key: keyof T`) has its Bloom form. In TS a key path is its field's name (`$KeyPath<T, V>`): the read is `x[key]`, the write `{ ...x, [key]: value }`. **AST (additive):** `ExprKind::KeyPathIndex(object, key)`. **CheckResult (additive):** `AssignRes::KeyPath { local, state }`. tree-sitter-bloom: a `subscript_expression` may take the `keyPath:` label.
