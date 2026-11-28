---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A narrowed `@State` narrows its reads only: inside `if report != none { … }`, `report = none` (in a closure too) and `$report` are the state's, `$report` a binding of the narrowed type (TS's `[report, setReport]`). They were B0403 "cannot assign to `report`" and B0505 (Mention's MembershipContentCard).
