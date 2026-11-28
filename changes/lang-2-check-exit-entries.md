---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- The exit check (`crates/lang/tests/tsc/check-exit.sh`) maps the language's family entries (`@oxy.so/bloom-language/inputs`, …) as the fixture check does, so an exit-demo module importing one type-checks (it failed with "Cannot find module").
