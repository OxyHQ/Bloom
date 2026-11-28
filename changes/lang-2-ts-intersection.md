---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A TS parameter typed as an intersection of object types (`request: Req & { signal?: AbortSignal }`) is one record of both members' fields. A labelled call's arguments, and the literals in them, are now checked against each field's type. Before, the first element of a list literal typed the whole list, which gave B0205 "no field `color`".
