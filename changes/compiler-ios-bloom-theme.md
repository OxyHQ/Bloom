---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Added
---

- The iOS runtime's `BloomTheme` (crate `crates/native/runtime/ios`, not in the npm package):
  Bloom's theming on Foundation, the colour engine, policy, presets, scopes, the ambient accent and
  persistence, byte-identical to `src/theme` against its goldens. Its data is generated from the
  TypeScript (`bun run generate:swift-theme`, run with the token JSON in `prebuild`); the goldens
  the native ports match are `bun run generate:theme-native-golden`, never in `prebuild`.
