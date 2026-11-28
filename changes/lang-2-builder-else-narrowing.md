---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A builder `if`'s `else` narrows where its test fails, as an `if` value's does: in a view body, `if item.origin == "server" { … } else { Text(item.draft.id) }` reads the TS discriminated union's other member (it was B0205 "has no field `draft`"). A read behind such a narrowing is a memo dependency through its narrowed name (`$[1] !== item`): the cache's test runs before the branch, and `item.draft.id` of a server item would throw. Mention: DraftsList.
