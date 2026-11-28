---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- An `if … else` or a `switch` on a line of its own, and the last one of a closure TS calls whose type Bloom does not know (`.onPress { if let id { work(id) } else { … } }`), is a statement: each branch's lines are statements, and an async call in one is B0430 at that call. It was checked as a value, B0430 on the whole `if` and B0201 on the other branch (lang-mention-11's handler-tail-if: Mention's settings/pages/privacy blocked and restricted).
