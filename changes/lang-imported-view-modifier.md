---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A `struct X: ViewModifier` imported from another `.bloom` module is applied with `.modifier(X())`, as one of the same file is: it was B0421 "`X` is a modifier, applied to a view". A stateful modifier (`@State` in it) is never hoisted to module scope, where its hooks ran at import and threw ("Cannot read properties of null (reading 'useSyncExternalStore')"): it runs per render in the view applying it. Mention: every gated route (feeds, lists, lists/[id], lists/create, feeds/marketplace, communities/[id]/bans).
