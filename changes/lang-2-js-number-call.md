---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A JS global imported from `"js"` is called as the function it is, never as a TS component, whatever its case: `Number(capacity) > 1000000` (JS's conversion) and `String(n)` were B0207 ("a component takes its props by name"). Mention's EventEditor.
