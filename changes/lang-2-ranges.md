---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's ranges: `a..<b` and `a...b`, collections of `Int`s (`[Int]` to the checker), binding
  below `+` and above the comparisons. `for i in 0..<n` is a counting loop, and
  `(0..<n).map { … }`, a builder's `for i in 0..<n` and `Array(0..<n)` are each one
  `Array.from({ length })`; no range builds an array it does not return. `Array(xs)` and
  `Array(set)` copy a collection. `bloom fmt` writes ranges with no spaces.
