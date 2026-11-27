---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Performance
---

- A tree of TS components alone (`Suspense(fallback: none) { Panel(…) }`: no modifier, no Bloom node, no branch) where TS takes a React element is the TS element itself, `$jsx(Suspense, { children: $jsx(Panel, …) })`, as the TS wrote it. Before, it was `toElement(Embed(($render) => …))`, a `LanguageRoot` with an `Embed` per component, so TS could not read its props (`render(close).props.children.props.title`) and it mounted more fibers than the TS. Inside a Bloom tree, such a tree is one `Embed` of the TS element, with no render function. Several children are `jsxs`.
