---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's protocol composition in a constraint: `where T: P & Q` (as `<T: P & Q>` already was), and a module's `type PQ = P & Q` named in one (`<T: PQ>`, `where T: PQ`), each one constraint per protocol, with a witness each. A composition is not a value's type (B0232); `any P & Q` and an imported composition alias are deferred (ADR 0002).
