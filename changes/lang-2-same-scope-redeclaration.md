---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **Invalid JS emitted:** a name declared twice in one scope (`let { data: xs } = load()` then `let xs = xs ?? []` in a view's body, or two `let y` in one block) was accepted, and the memoized emit declared `let xs` twice ("Identifier 'xs' has already been declared"). It is Swift's invalid redeclaration, B0217, with a fix-it renaming the first. A shadow of a parameter, a prop or an outer scope's local stays one (`let x = x ?? 0`) (mention13 same-scope-shadow).
