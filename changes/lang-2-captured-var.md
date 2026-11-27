---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A closure may capture, read and write a function's own `var`, as Swift's does (a closure's or a handler's too): `var handlers: [String: () -> Unit] = [:]; let add = { tag in handlers[tag] = … }` records into the table, and the function reads every write once the closure ran (Mention's PostMenu). A write is a new value, as any `var` write is. A `var` of a view's render or of a hook function stays B0402: their closures are cached across renders.
