---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Arrays and dictionaries are written in place (copy-on-write, Swift's value semantics). A local `var` of a `[T]` or a `[String: V]` that is written in place owns its storage, and on TypeScript each write is one JS write, O(1). These writes are `xs[i] = v`, `xs[i] += 1`, `table[k] = v`, `xs += ys`, a mutating member, and passing `&xs`. The `var` is copied only where its storage could be shared: when it is set from a value another name may hold, and where its value escapes (bound to another name, passed, stored, or a closure's result). A write is never seen through another name. 35,937 element writes went from 3 s to milliseconds.
- Swift's mutating members on a `var`, a `@State` or a field.
  - On an array: `append(_:)`, `append(contentsOf:)`, `insert(_:at:)`, `remove(at:)`, `removeFirst()`, `removeLast()`, `removeFirst(_:)`, `removeLast(_:)`, `popLast()`, `removeAll()`, `removeAll(where:)`, `swapAt(_:_:)`, `sort()`, `sort(by:)` and `reverse()`. An index out of range traps.
  - On a dictionary: `removeValue(forKey:)`, `updateValue(_:forKey:)` and `removeAll()`.
  - On a `let`, a mutating member is B0403.
- `Array(repeating:count:)`.
- `inout` parameters (Swift's), passed as `&place` and written back when the call returns.
  - A missing `&`, a stray `&`, and `inout` in an `async` function are B0406.
  - An array passed from a `var` is that `var`'s own storage, written in place.
  - On TypeScript, the function returns the parameters after its result: `xs`, `[a, b]` or `[result, xs]`.
- **CheckResult:**
  - New: `CallRes::Mutating`, `CallRes::ArrayRepeating`, `CheckResult::mutations` and `CheckResult::inouts`.
  - `ParamTy.inout` and `Param.inout`.
  - `ExprKind::InOut`.
