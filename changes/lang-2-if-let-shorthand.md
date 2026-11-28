---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift 5.7's optional binding shorthand: `if let name { … }` and `guard let items else { … }` unwrap the name into itself (`if let name = name`). `bloom fmt` keeps the short form, and tree-sitter-bloom parses it. The checked tree is the long form: a `Cond::Let` whose value is the name, with the pattern's span.
