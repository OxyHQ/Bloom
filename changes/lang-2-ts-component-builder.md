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
- react-native's `View` (`declare const $$View: typeof View`) and a namespace's components
  (`import * as Skeleton`, `Skeleton.Region { … }`) and a component's UpperCamel static
  (`Button.Group { … }`) are components too, their builders their
  children. An `if` without `else` passed where a modifier takes a value
  (`.accessory(if open { row })`) is an optional child.
- One line of text in a TS component's builder (`TextFieldLabel { label }`) is its text children,
  as JSX's `<TextFieldLabel>{label}</TextFieldLabel>`.
