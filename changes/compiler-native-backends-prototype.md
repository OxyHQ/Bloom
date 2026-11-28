---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Added
---

- An experimental native backend, `bloom-native emit --target kotlin-compose` (crate
  `crates/native`, not in the npm package): a checked `.bloom` package as Kotlin and Jetpack
  Compose, with no JavaScript, and the Gradle project around it. A measured prototype for
  ADR 0003; `--target swiftui` is reported, not built.
