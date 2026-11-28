---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Operators as functions (Swift's): an arithmetic or comparison operator passed as an argument (`xs.reduce(0, +)`, `xs.sorted(by: >)`) or in parentheses (`let add: (Int, Int) -> Int = (+)`) is the closure `{ $0 + $1 }`, typed by the function type expected there. **AST (additive):** `Closure.operator: Option<BinaryOp>` marks it; its `params` (`$0`, `$1`) and `body` (the binary) are an ordinary closure's, so a backend needs nothing new, and `bloom fmt` prints the operator back. tree-sitter-bloom: `operator_function`.
