---
package: '@oxy.so/bloom'
bump: patch
section: Changed
---

- Surface's native edge (the rim's 1px lines and the sheen's inset glows) is computed in
  `src/surface/native-edge.ts`, free of React Native, so Bloom's native runtime (Compose, ADR 0003)
  is generated from the same numbers (`MaterialEdges` in `BloomTheme.generated.kt`). The
  `boxShadow`s Surface writes are unchanged.
