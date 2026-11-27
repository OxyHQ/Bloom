---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Bloom 2.0, from the Mention corpus (phase D):
  - a closure that returns nothing, or one that awaits, fits TS's `() => Promise<void> | void`;
  - `c ? s : opt?.x` joins to the optional;
  - a TS literal union compares with a `String`;
  - a token modifier whose TS value takes `undefined` (`.tint(c ? "success" : none)`) takes `none`, from the new generated `noneModifiers` table;
  - a module constant's record literal keeps its string literals' types (emitted `as const`);
  - TanStack Query's data type flows through a generic binding module (`useQuery<T>`).
