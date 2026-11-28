---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A list or record literal is checked against its context, as Swift checks one: each element and each ternary branch against the expected type, never against its sibling's (lang-mention-10's record-context: Mention's BoostScreen, CaptureReview). A spec object parameter is now an expected type: `.accessibilityValue(c ? { text } : { min, max, now })` types both branches by `accessibilityValue`'s keys, where the first branch had typed the second (B0205).
- Typed object kinds in the spec (`objects.<name>.fields`: each key's type, `?` when it may be left out), and a parameter `[name]`, a list of one. `Dialog().buttons(…)` takes `[dialogButton]` (`label`, `color?` a `dialogActionColor` token, `onPress?`, `disabled?`, `loading?`, `shouldCloseOnPress?`, `initialFocus?`, `testID?`, Bloom's `DialogAction`), so a button without `onPress` is no longer B0206 for being unlike the first, a button without `label` is, and a key it does not take is B0205.
