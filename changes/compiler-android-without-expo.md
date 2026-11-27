---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `bloom build android` writes and drives its own Gradle project (no Expo prebuild, CLI or modules): the manifest from `Package.bloom`'s new `app: App(…)` (id, version, permissions, icon, splash, deep-link schemes), signing from a local keystore under `~/.bloom/keystores/`, React Native core (Fabric, Hermes), the React Native libraries it autolinks itself, and Metro driven by `bloom` (`bloom-metro.js`). `--with-expo` keeps the Expo path; `--generate` writes the project for Android Studio and stops.
- `extern native "Name" { … }` declares a Bloom native module's interface once; `bloom` generates React Native's TurboModule spec (the Kotlin side is checked against it) and a lazy bridge. `.native("Name", kotlin:, swift:)` targets in `Package.bloom`.
- The standard library's `KeyValueStore`, `SecureStore` and `FileStore` keep their values in Bloom's native storage module on Android (`BloomStorage`: SQLite, a Keystore-held AES-GCM key, the app's files), behind the same interface.
