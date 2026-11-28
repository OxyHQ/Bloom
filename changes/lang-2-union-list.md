---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A list literal where a `[T]?` is expected is a `[T]`, its literals taking `T`: `post.metadata?.replyPermission ?? ["anyone"]` beside a TS `ReplyPermission[]` (a string literal union) fits, and so does `["nobody"]` given to a `[ReplyPermission]?` parameter. It was B0201 (`found [String]`).
