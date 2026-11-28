---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's overloading by argument labels: free functions, and one type's static functions and methods, may share a name when their labels differ (`describe(count:)` beside `describe(name:)`, `formatted(digits:)` beside `formatted(currency:)`). A call takes the overload its labels fit (a default may be left out; the one leaving out fewest wins); none fitting, or two fitting equally, is B0207 listing the overloads. Same labels stay B0217 (overloads differ by labels, not types), and an overloaded name read without a call is B0202. Each overload is emitted named by its labels (`describe$0$count`); a name declared once keeps its name. Overloads are declared in one file of a module.
