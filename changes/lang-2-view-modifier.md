---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- **`struct X: ViewModifier`**, SwiftUI's: `func body(content: Content) -> some View` wraps the view `.modifier(X(…))` is applied to, with a view's members (props, `@State`, `@Environment`, hook `let`s). A stateless one is called in place (`X({ … })(view)`), rows included; one that keeps state is called once per render at the top of the view applying it, so its state is that view's, and its result is the screen's root: `content` keeps its `.title`, and a gated state hides the header with `.header(false)` (Mention's `SupervisedFeatureGate`). B0421: `X(…)` outside `.modifier(…)`; B0422: a stateful one in a closure, a `for` row or a member, or reading a body-local name. Spec 7.2b. **IR (additive):** `ViewKind::Modifier`, `ViewDecl.content`, `CheckResult.view_modifiers`.
