---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A binding's getter may be the value or `none`, as SwiftUI's optional selection is: `.selection(Binding(get: c ? "anyone" : none, set: { value in … }))` is no row chosen when it is `none`, and the setter still takes a chosen value (`ReplyPermission`, not `ReplyPermission?`). The setter is read first, and the getter is checked as its value's optional. It was B0201 in Mention's ReplySettingsMenu.
