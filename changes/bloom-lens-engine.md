---
package: '@oxy.so/bloom-lens'
bump: minor
section: Changed
---

- The glass engine is its own Gradle project, free of React Native and Expo (`android-engine`,
  linked through `expo-module.config.json`'s `projects`): the renderer and its shaders and fields,
  the window backdrop and its lenses, the jelly, the springs, the press feedback and the four
  configuration records, as plain Kotlin. `android/` keeps the Expo adapter (the menu, the chrome,
  the surface nodes and their modules), which takes the JavaScript props as `…Props` records and
  hands the engine its own (`toEngine()`). Bloom's native runtime (Compose, ADR 0003) draws its
  material through the same engine. `sync-from-upstream.sh` makes the split itself
  (`split-engine.mjs`), and a fresh sync reproduces the tree. Nothing changes for an app: Mention's
  glass menu draws the same pixels before and after (hangar-test-36).
