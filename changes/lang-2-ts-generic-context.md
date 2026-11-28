---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A TS generic parameter's constraint is the soft context of a literal given for it, as TS's inference reads it: `useAnimatedStyle(() => ({ transform: [{ scale: … }, { translateY: … }] }))` (`<Style extends DefaultStyle>`, Mention's ProfileHeader) checks the callback's result literal against `DefaultStyle` element by element, and `StyleSheet.create(video: { … })` each option against its member of the constraint. The type parameter is still TS's to infer from the literal, with no excess-field check. A literal given to any TS function Bloom cannot read is checked against that parameter's TS type the same way.
- A conditional where a TS type is expected checks each branch against it, never joining the branches: `minHeight: web ? "var(…)" : 384` (RN's `DimensionValue`, ContentSkeleton) was B0201.
- A generic TS interface named with the enclosing function's type parameter stays generic, so instantiating the function reaches its fields: `useSharedValue(0).value` is a `Float`, not the name `Value`.
