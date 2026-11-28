---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `@Transparent` structs (Rust's `#[repr(transparent)]`): a struct with exactly one stored `let` is that field at run time, and a type of its own to the checker. Its TS type is the field's (`export type UserID = string`), `UserID(raw: v)` is `v`, `id.raw` is `id`, `==` compares the field and a derived `Codable` is the field's codec. B0106 for none or a second stored property, a `var`, or the attribute on anything but a struct. `CheckResult.transparent` names them for the native backends (a Kotlin `@JvmInline value class`, a Swift struct). Spec 4.4.
- `UniqueID`, the standard library's identity: `@State private var id = UniqueID()` (a view's, or a hook function's `@State var`) is one `const id = useId()`, never set (B0403), read as `id.string`. `UniqueID()` anywhere else is B0420 (`CheckResult.unique_ids`).
