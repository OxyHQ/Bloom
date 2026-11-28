---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Performance
---

- Smaller memo caches. Member `let`s (and `fn`s) written one after another on the same
  dependencies share one test, so Mention's ContentWarning's three `t(…)` strings are one `if`.
  A leaf (a node and its modifiers, with no child view, closure or call among its arguments)
  that reads its one dependency once is built with its parent instead of in slots of its own.
  ContentWarning drops from 35 slots to 27 and is 142 B smaller minified. Every golden that
  changed got smaller (the largest by 147 B), and the cost gate is unchanged.
