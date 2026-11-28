---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- **`Regex` in Swift's shape**, the one type: `try Regex("^\\d+$")` (throws a `RegexError` on an invalid pattern), `s.wholeMatch(of:)`, `s.firstMatch(of:)`, `s.matches(of:)`, `s.contains(r)`, `s.replacing(r, with:)` and `s.split(separator: r)`, beside `Regex(pattern:flags:)` and its methods. A group that did not take part in a match is `none` (`group(n)`, JS's `undefined`), where it was `""`; `RegexMatch.groups` is `[String?]`. Runtime tests compare each with JS's `RegExp`.
- **A struct's `init` in an extension** (`extension Regex { init(_ pattern: String) throws { … } }`) is called by its labels, beside the memberwise one, as Swift keeps both; its body gives the value it makes, as a built-in type's does.
