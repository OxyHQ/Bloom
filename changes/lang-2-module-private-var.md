---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A file-scope `private var x: T = v` (2.0): the file's own mutable value, emitted as a JS module `let`, which any of its functions, closures and effects may read and write (Mention's ChannelInfoDialog, FediverseInfoDialog and ActionMenu registry callbacks). It is no dependency and no state. `var` and `public var` at file scope stay B0106.
- Swift's optional call `f?()` calls `f` when it is present, as `f?.()` does (it was read as `f?`, an early return, then a call).
