---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **The grammars read what bloomc reads:** the tree-sitter grammar parses labelled loops (`outer: for … { break outer }`, `continue outer`), a hook function's `@State var`, `===`/`!==`, a protocol composition (`Named & Counted`) and a closure with its signature (`{ () -> [Row] in … }`), and highlights `===`/`!==` and loop labels; every tracked `.bloom` file parses again. The language server offers the 2.0 contextual keywords (`func`, `guard`, `break`, `continue`, `do`/`catch`, `try`/`throw`, `extension`, `protocol`, `class`, `actor`, …) beside the reserved ones (`bloom_lang::CONTEXTUAL_KEYWORDS`).
