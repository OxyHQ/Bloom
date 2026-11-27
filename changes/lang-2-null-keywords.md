---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- Bloom 2.0 at the TS boundary:
  - a struct field whose default is `none` is optional in the emitted TS and `.d.bloom.ts` (`readonly boosts?: number`);
  - a TS `T | null` reads as `T?` (it was `Foreign`), and every test of an optional is loose (`!= null`), so a TS `null` is `none`;
  - `x || d` of a non-`Bool` optional is JS's `||`;
  - a keyword may name a struct's or a protocol's property (`let none: String`, read `copy.none`).
  - a TS value checked as a `T?` reads TS's `null` as `none` (`(x ?? undefined) satisfies T | undefined`), except in a record literal's field, whose check takes the `null` (`satisfies T | undefined | null`); a `??` chain already ending in such a check gets no second `?? undefined`.
