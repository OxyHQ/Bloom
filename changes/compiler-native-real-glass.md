---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Added
---

- The native runtime's material draws real glass (ADR 0003, M3b-2). `.glass()` is bloom-lens's
  lens where the device has the engine (Android 13+): in the page it is drawn in its place against
  the surface it sits on, one shared still per look at rest and the live lens under the jelly
  while pressed, exactly as Bloom's React Native lens base draws a control in a scroll; in a
  `FloatingRegion`, and for `.blur()`, the window draws it over its backdrop (`GlassBackdrop`)
  with the view's content drawn after it, so the page it samples never holds the glass. Below
  Android 13, and dimmed, it stays the tint rendition.
- An island draws in its host's resolved theme: the generated `BloomPalette.with(colors)` and
  `BloomThemeProvider(colors:)` take React Native's `useColorTokens()` over the preset's colours,
  with the avatar tints and `backing` (the surface the island sits on) beside them.
- `Avatar(url, { name:, initials: })` draws Bloom's initials disc when there is no picture
  (`getInitial`, `avatarTintForName`, `avatarInitialsType`).
- A `VStack` in an `HStack` with a full-width child is as wide as its content (React Native's
  column in a row), and `dict[key] = value` on a local dictionary writes a map, not a list.
