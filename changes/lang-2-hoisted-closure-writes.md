---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A silent lost write:** a closure that writes the view's `@State` only inside a `do`/`catch` (or a `guard`, a `defer`, a nested closure) was hoisted to module scope, where its setter is undefined: the write threw, a `catch` swallowed it, and the state never changed (Mention's EmojiPickerSheet recent emojis). A closure with any assignment stays inside the view function (mention13 hoisted-closure-state-write).
