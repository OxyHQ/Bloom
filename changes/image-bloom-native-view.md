---
package: '@oxy.so/bloom'
bump: minor
section: Changed
---

- `BloomImage` draws with Bloom's own native image view (`BloomImageView`) in a build that links
  it (`bloom build android`), before expo-image and react-native's `Image`; `prefetchImage` and
  `getImageSize` use its cache. Its props and events are unchanged, and an Expo build still draws
  with expo-image.
