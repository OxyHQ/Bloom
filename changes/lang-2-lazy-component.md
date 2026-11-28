---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A runtime crash:** a React `lazy` component whose loader was not exactly `import("./X")` (a chain on it, `lazy { import("pkg").then { m in ({ default: m.Text }) } }`, or a named loader, `lazy(load)`) was a plain value, called as `Lazy({ … })`, and a `LazyExoticComponent` is not callable (a TypeError at the draw). Whatever its loader, `lazy`'s result is a component, drawn as `$jsx(Lazy, { … })` (mention13 lazy-component-called).
