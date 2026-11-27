---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A TS discriminated union of object types (`{ kind: "sources"; … } | { kind: "lane"; … }`) is typed, not `Foreign`: a `match`/`switch` on its tag is exhaustive over the members' tags (B0301 names a missing one), and each arm reads its member's own fields (`rows.sources`, a Bloom list), as an `if rows.kind == "sources"` block and the rest after an early-returning `!=` do. It was B0601 (Mention's PostMenu `submenuRows`). The emitted tests are on the tag, which TS narrows the same way. A field every member has with one type is the union's too (`block.domain`, read without narrowing), and a member chain narrows on its tag as a name does (`item.media.mode == "override" ? item.media.media : none`).
- An element of a TS value Bloom does not map (`patch[key] = "show"`, a `Partial<Record<K, V>>`) is written in place as TS writes it, and `{}` where such a TS object type is expected is the empty object, not an empty closure.
