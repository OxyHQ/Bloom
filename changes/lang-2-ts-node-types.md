---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- The language's node types read as views of their kind: a `ScrollViewNode` (`import { type ScrollViewNode } from "@oxy.so/bloom-language"`, what `ScrollView(…)` returns) is a scroll view. A prop of it takes the `ScrollView { … }` a caller builds, it takes a scroll view's modifiers (`content.screenScroll("content")`), and it is emitted as `ScrollViewNode`. `ViewNode` and `AnyView` stay `View` (Mention: AccountInfoScreen, OperatedAccountSettingsScreen).
