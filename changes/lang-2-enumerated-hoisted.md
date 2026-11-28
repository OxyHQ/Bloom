---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A wrong index at runtime:** `xs.enumerated().map { (i, x) in … }` in a view, whose closure captures nothing and is hoisted out of the view, was passed only the element (`xs.map((v0) => $fn0(v0))`), so every index was `undefined` ("NaN. Bloom"). The call passes the index too.
