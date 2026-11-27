---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A TS function component typed as emitted declarations type it (`function EngagementBar(props):
  import("react").JSX.Element`, every Bloom component) is a component again: drawn with a trailing
  builder, its lines are the component's `children` (or the one node prop it declares in their
  place). It was called as a plain function, and the builder's nodes were dropped, so the file
  compiled and drew an empty bar.
- A builder's nodes are never dropped silently: a component with no `children` and no node prop
  left for the builder is B0506, `children:` beside a builder is B0207, a trailing closure past a
  TS function's parameters is B0207, and a node on a line of its own outside a builder is B0506.
