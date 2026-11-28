---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A stateless `struct X: View` whose body is one node is drawn in its caller's tree, with no component (fiber) of its own: it holds no `@State`, environment, `let` member, method, effect, comparator or observed model, and its body is one chain with no `.task`/`.onChange` and no `.id()` of its own. It is emitted as `inlineView(function X(props) { return …; })` (no memo cache: the caller's caches the call), keeps a view's semantics (modifiers on it apply around its body, its `.id()` is its key), and needs `@oxy.so/bloom-language` with `inlineView`. Measured with the cost harness on Mention's PostErrorBoundary, a struct around Bloom's `ErrorBoundary` in a feed row: 1 fiber, 1 hook slot and 3 context reads fewer per row than as a `view()`, and the same as TS's boundary class (`test/bloom.cost.test.tsx`). Golden `emit/inline_view`.
