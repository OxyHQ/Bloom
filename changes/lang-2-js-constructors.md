---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `Map(pairs)` and `Set(xs)` from `"js"` are `new Map(pairs)` and `new Set(xs)`, as `Date(x)` already was: emitted without `new` they threw "Constructor Map requires 'new'" at run time (Mention's lists/[id]/edit). The typed arrays, the observers, `File`, `FileReader`, `DOMParser`, `Event`, `Proxy`, `WeakRef`, the remaining `Error` kinds and the other built-ins that only `new` makes are constructed too. `String(x)`, `Number(x)` and the other converting functions stay calls.
