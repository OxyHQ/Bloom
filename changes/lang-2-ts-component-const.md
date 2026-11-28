---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A runtime crash:** a TS component declared as a function const and exported through `typeof` (react-native 0.81+'s `declare const Switch: (props) => ReactNode; declare const $$Switch: typeof Switch`) was called, `Switch({ … })`, so its hooks ran in the caller and React threw "Rendered more hooks" when it was drawn in a branch. It is an element, `Embed($jsx(Switch, { … }))`, as an `FC`, a `memo`, a `forwardRef` or a `NamedExoticComponent` is (mention13 ts-component-called).
