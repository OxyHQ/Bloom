---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `c ? name : d ? "s" : none` of a `String?` `name` is `String?`, not `String??`: two optional branches of one `T?` join to `T?`, as Swift's do, so `p ?? ""` is a `String` (Mention's UserName).
