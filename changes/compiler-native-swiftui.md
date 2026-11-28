---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Added
---

- The Swift backend, `bloom-native emit --target swiftui` (crate `crates/native`, not in the npm
  package; ADR 0003, [Native iOS](../docs/native-ios.mdx)): a checked `.bloom` package as Swift 6
  and SwiftUI, with no JavaScript, from the same checked program as the TypeScript and Kotlin
  backends. `--ios-project` writes the Xcode project of a pure SwiftUI app (SwiftPM modules,
  XcodeGen, Bloom's fonts, a UI-test target that measures the bench). The iOS runtime
  (`runtime/ios`) is `Bloom` (the standard library on Foundation), `BloomTheme` (Bloom's colour
  engine, byte-identical to the TS goldens) and `BloomUI` (BloomUI on SwiftUI: Yoga's flex layout,
  the feed's and Settings' nodes, the one material, the router, islands). Golden tests per
  construct; `crates/native/scripts/typecheck-swift.sh` type-checks every golden and the bench with
  swiftc. Tokens, glyphs and the node table are generated (`generate-swift-tokens.mjs`,
  `crates/native/scripts/icons.py`).
