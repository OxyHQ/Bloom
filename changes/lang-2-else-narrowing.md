---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- The `else` of an `if` narrows as the `?:`'s other branch and an early return do: in `if x == none || x.isEmpty { … } else { use(x) }` (through `!`, parentheses and more `||` operands, and `else if`), `x` is present. Before, it stayed optional there and was B0201 (Mention's ProfileHoverCard, UserName).
