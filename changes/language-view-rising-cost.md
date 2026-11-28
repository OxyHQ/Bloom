---
package: '@oxy.so/bloom-language'
bump: patch
section: Performance
---

- A `view()` body that declares no screen chrome costs no hook and reads no context, as before: the rising chrome (`Post().title(…)`) is written through a wrapper only when the body declares some. The cost gate's `view()` body measured 2 contexts and 3 hooks where its memo component costs 1 and 0.
