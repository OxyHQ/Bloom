---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `(typeof C)[number]` of an `as const` list of strings is their literal union, as tsc reads it (`type MembershipBenefit = (typeof MEMBERSHIP_BENEFITS)[number]`), so it keys a record of exactly those fields: `benefitLabels[benefit]` was B0601. An `as const` list written in a `.ts` source (not only a declared `readonly [...]`) is that tuple too.
