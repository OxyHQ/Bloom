---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Compose islands (ADR 0003). A module marked `.module("FeedIsland", native: .island)` in `Package.bloom` is also compiled to Kotlin + Jetpack Compose. `bloom build android` then writes the Gradle library `:bloom-islands`, and the app links it like Bloom's native modules. It holds the islands' Kotlin (from the native backend, `bloom-native`), Bloom's Kotlin runtime, a generated `IslandRegistry` and `BloomIslandPackage`, whose `BloomIsland` view draws an island by name (`island`) from its props (`props`, JSON) and sends its intents back as `onIslandEvent` (`{ name, payload }`). Compose (1.12.1, its compiler plugin) and coroutines (1.10.2) come in that library only.
