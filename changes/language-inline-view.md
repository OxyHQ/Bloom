---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- `inlineView(body)`: a view with no component of its own, what the language compiler emits for a stateless view whose body is one node. Calling it builds the body there, and the view is drawn in its caller's tree with no fiber, hook slot or context read of its own; modifiers chained on it apply around its body, as around a `view()`'s, and its `.id()` is its key. The body must call no hook.
