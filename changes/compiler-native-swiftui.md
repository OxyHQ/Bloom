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
- On core12's IR, the Swift backend gained:
  - ViewModifier as SwiftUI's own;
  - hook state (`@State var` in a hook function) as a `DynamicProperty`;
  - flow narrowing from the checker, and `@Transparent` coded as its field;
  - `with(field:)`, `===`, JSON's lenient reads;
  - `await Task.cancellation`, and a cancelled task's `catch` that runs nothing;
  - a Swift-shaped Regex that reads ECMAScript patterns as JS does, held to a cross-backend
    conformance corpus (`conformance/regex/`, 58 of 59 on Swift).

  55 of 67 Swift goldens type-check. The material's effects are on BloomUI: the scrubbable tab
  bar with boundary haptics, the header scrim, the detached sheet, the progressive blur band and
  menu rows. Mention's feed island (`FeedRow`, `FeedIsland`) compiles to SwiftUI, with its island
  entry and the iOS host on Android's contract (the `BloomIsland` view, the `BloomIslands`
  module, `BloomIslandEvent`).
