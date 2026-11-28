---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Added
---

- The Kotlin backend, `bloom-native emit --target kotlin-compose` (crate `crates/native`, not in
  the npm package; ADR 0003): a checked `.bloom` package as Kotlin and Jetpack Compose, with no
  JavaScript, and the Gradle project around it. It reads the same checked program the
  TypeScript emitter does (`bloom_lang::backend`: the tree and the checker's tables by
  expression id). Structs are data classes with value-semantic writes
  (`posts[i].likes += 1` rebuilds the list), enums are enum classes or sealed interfaces,
  protocols are interfaces with their implementations as `override` members, extensions'
  members live in their type's class, generic functions keep their bounds, `@Observable`
  classes hold snapshot state per field, and actors run on a serial dispatcher. Golden tests per
  construct, over the TypeScript emitter's own 2.0 fixtures, record what is not covered yet;
  `crates/native/scripts/compile-goldens.sh` compiles every golden with kotlinc.
