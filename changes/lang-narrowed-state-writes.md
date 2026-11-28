---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A narrowed `@State` narrows its reads only (a regression of `==` narrowing a literal union: `if step == "review" { step = "edit" }` was B0403): inside `if report != none { … }` or `if step == "review" { … }`, `report = none` (in a closure too) and `$report` are the state's, `$report` a binding of the narrowed type (TS's `[report, setReport]`). They were B0403 "cannot assign to `report`" and B0505 (Mention's MembershipContentCard).
