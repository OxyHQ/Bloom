---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `x?.0` is optional chaining to a tuple's member, as Swift's is (`location?.coordinates?.0`, JS's `?.[0]`). The lexer read `?.0` as `?` then `.0` (B0214), and `bloom fmt` refused it. A `?` with a space before it stays the ternary's (`c ? .5 : 1`). Mention: PostLocation.
