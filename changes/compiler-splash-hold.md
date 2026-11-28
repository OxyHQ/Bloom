---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A Bloom build holds its launch splash until the app's first content appears, as an Expo build does with expo-splash-screen. The window draws no frame of the loading app, so the JS bundle and the first screen get the threads those frames took. On Mention's hybrid build this brought startup to the Expo build's or below: JS `main`, the first feed row and the first feed image. The standard library's `Splash` (`preventAutoHide()`, `hide()`, over the new native module `BloomSplash`) keeps the splash up until the app hides it. An adopted app's `expo-splash-screen` calls reach it through the hybrid build's shim.
