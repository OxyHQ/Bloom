---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A conditional given to a TS component's prop is TS's to check branch by branch, as each branch given alone is: `onLayout: IS_WEB ? none : { event in … event.nativeEvent … }` types `event` from TS (it was `_`, B0205), and `header: drawing ? Text(…) : routeHeader` of a `View?` crosses each branch as an element where the prop takes a `ReactNode` (it was B0201 "expected `View`, found `View?`"). Mention: ProfileShell.
