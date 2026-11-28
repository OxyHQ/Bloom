---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A Bloom struct fits a TS object type it satisfies, as TS checks it (`normalizedHandle(card)` with `user: UserHandleInput`, `AccountAvatar(account: card)`): each of the TS type's required fields is a stored field of the struct of a fitting type, optional ones may be missing, and an all-optional TS type needs one field in common. A struct is a plain object of its fields, so nothing is converted. Bloom to Bloom stays nominal; a `@Transparent` struct and a class do not fit this way.
