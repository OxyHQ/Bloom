---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A TS value compared with a number or a string is one (`item.pokeCount > 1`, `page.page < page.totalPages`), as are a TS value beside an `Int` (`2 * Math.PI`) and a negated one (`-event.translationY`); each is checked by `satisfies number` (or `string`).
- `a || b` of two optionals that are not `Bool`s is an optional (`user.username || user.handle` is a `String?`), where it was refused as `String?` given for `String`; a chain that ends in a present value is present, through parentheses and branches.
- A hook given directly as an argument of a view member's call is a view member's hook (`let account = useProfileAccount(useRoutedProfileUsername())`), where it was B0420.
