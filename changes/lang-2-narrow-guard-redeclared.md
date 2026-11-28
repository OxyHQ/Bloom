---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A narrowing is not a second declaration:** after a guard (`if amount == none { return none }`), the narrowed `amount` was reported "declared twice in one scope" (B0217), both labels on one span, so the file did not compile (mention14 narrow-guard-redeclared, 12 corpus files). B0217 is for two declarations only.
