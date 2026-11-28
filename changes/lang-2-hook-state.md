---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A hook function's state is `@State var x = v` at the top of its body, as a view's `@State` is: one `useState`, read as `x`, written as `x = …` (or `x += 1`, a functional update) in its closures, and `$x` its binding (a `@Binding` view writes it). The setter never surfaces as a value (no `Foreign<Dispatch>`). Written in the body itself it is B0401; in a branch, a loop, a closure or a function that is not a hook it is B0420. The formatter keeps it.
