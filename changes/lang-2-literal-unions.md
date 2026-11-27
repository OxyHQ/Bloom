---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `x as? Tab` with `Tab` a string literal union is `x` when it is one of `Tab`'s values and `none` otherwise, a membership test that reads `x` once. `x as! Tab` is the `Tab` itself: a dev build traps (`TypeError`) when it is not one, and a release build is TS's plain `as`. This is the form for TS's `as Tab` casts.
- A module constant's list of string literals keeps their union (`let TABS = ["videos", "following"]` is `["videos" | "following"]`, emitted `as const`), as TS's `as const` tab lists do.
- `x.formatted(fractionDigits: n)` on an `Int` or a `Float` is JS's `x.toFixed(n)`: exactly `n` decimals, never localized (`formatted(digits:)` stays the localized one).
