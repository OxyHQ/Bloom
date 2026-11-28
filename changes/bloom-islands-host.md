---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- An island (`BloomIsland`) composes once it is attached: Fabric may create and measure it
  off-window (a screen mounted early), where Compose has no window recomposer and threw
  `Cannot locate windowRecomposer` (found with Mention's feed island on the Pixel 8a).
- An island draws in the app's theme: `themePreset` (an `AppColorName`) and `themeScheme`
  (`light`, `dark`, or the system's), Bloom's default preset when none is given.
