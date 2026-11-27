---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Fixed
---

- A name imported from "js" is emitted as the JS global itself: `import { Infinity } from "js"` was emitted `Infinity_`, a keyword's mangling, which threw a `ReferenceError` at run time.
- `Double.infinity` and `Double.nan` (the standard library) are JS's `Infinity` and `NaN`, with no "js" import.
