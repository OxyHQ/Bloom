---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A thrown JS `Error` is the standard library's `JSError` (`name`, `message`, `stack`): `error as? JSError` and `catch let e as JSError`.
- `error.jsValue: JSONValue?`, the thrown value itself, with lenient `JSONValue` reads: `value["key"]` / `value[i]` (an object's own member, an array's element, `none` at a missing key, a value of another type or `null`) and `.string`, `.number`, `.int`, `.bool`, `.array`, `.object` (`none` on a mismatch). `error.jsValue?["response"]?["data"]?["error"]?.string` reads an Axios error's server message and never throws (mention11 http-error-shape). `CheckResult.json_reads` marks the subscripts.
- Swift's `===` / `!==`: the same object, for class instances, TS objects and errors (JS's `===`); on a value type it is B0210. `BinaryOp::Identical` / `NotIdentical` in the AST.
