---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Bloom 2.0's generic views: `struct ProfileGridList<T: ProfileGridEntry>: View` (or `where T: P`) compiles to one `view()` fiber whose body is generic, with `ProfileGridListProps<T extends ProfileGridEntry>` in the `.d.bloom.ts`. A type parameter bounded by a shape (a struct, a record type or a TS interface) is TS's `T extends Shape`: read directly, with no witness, and checked at the call site (B0232); a protocol bound passes its witness as a prop. A data struct's type parameters take no constraints (B0106).
