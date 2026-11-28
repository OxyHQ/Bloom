---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A value `||` whose last right side is present is present, in parentheses or not: `handle(u) || (u.displayName || "user")`, a TS `string | null` beside a TS optional member, is a `String`, as JS's `||` with a non-empty literal last never gives `undefined`. A TS value on the left of the inner `||` made it `String?` (Mention's postMenuActions).
