---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A TS component given by name to a TS component's prop (`EmptyState(icon: RiLinkM)`, the prop a `ComponentType`) is passed as it is. Where Bloom cannot read the props, every view among them crossed as an element, the named component too (`icon: toElement(RiLinkM)`), so the receiver got an element where it takes a component (Mention's SourcesSheet).
