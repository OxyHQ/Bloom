---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A `View?` fits where TS takes a React element that may be nothing, as Swift's `Optional<View>` is a view: a TS render callback's `ReactElement | null` result, a `ReactNode` prop, and a `VirtualList`'s row (`if item == "tabs" { stickyTabs } else { nativeContent }` of optional views was B0201 "expected `View`, found `View?`"). An absent view crosses as `null`, which both TS types take (it was `undefined`, which `ReactElement | null` refuses). Mention: ProfileShell.
