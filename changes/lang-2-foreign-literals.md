---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A list or record literal where a TS type is expected (an annotation, a TS function's parameter) has each element and each field checked by TS on its own, as TS checks a literal against its context: `let s: Style = { transform: [{ scale: 0.5 }, { translateY: y }] }` was B0205 "`{ scale: Float }` has no field `translateY`", the first element typing the rest. So is a literal given to a prop Bloom cannot read, or to an optional TS prop (`style: [TABS, { borderColor }]` on React Native's `ScrollView`, whose props extend `ViewProps`: lang-mention-11's style-list-records, Mention's EmojiPickerSheet).
