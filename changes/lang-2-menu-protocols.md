---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `struct X: MenuActions` and `struct X: MenuContent` (2.0): a menu's actions and content, conforming as a view conforms to `View`. `MenuActions`'s `body` is the tag → action table (`[String: () -> Unit]`), emitted `actions(function X(props) { …; return { tag: action } })`, and given as `Menu(…) { … }.actions(X(…))`. `MenuContent`'s `body` is the rows, emitted `menu(function X(props) { …; return rows })`, and given as a `Menu`'s child. Stored `let`s are the props, members may call hooks, and neither has a memo cache or takes a view's modifiers. The declarations are `(props) => MenuActionsView` / `MenuContentView`.
