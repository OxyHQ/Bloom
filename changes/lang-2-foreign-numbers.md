---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A TS value compared with a number or a string is one (`item.pokeCount > 1`, `page.page < page.totalPages`), as are a TS value beside an `Int` (`2 * Math.PI`) and a negated one (`-event.translationY`); each is checked by `satisfies number` (or `string`).
