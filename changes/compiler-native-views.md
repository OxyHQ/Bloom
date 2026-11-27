---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `extern native` declares native views: a function that returns `View` is a Fabric component,
  its parameters the props (strings, numbers, booleans, unions of strings, arrays and optionals of
  them) and its `on…` closures the events, with a record of the event's fields. `bloom build
  android` writes its component spec, links it as a Fabric component and registers its
  component descriptor; the bridge draws it as an embedded view.
- The standard library's native image view, `BloomImage` (`stdlib/Bloom/Image.bloom`, Kotlin over
  React Native's image pipeline): memory and disk caches, decoding at the view's size,
  `contentFit`, cross-fades, placeholders, cache policies, recycling keys, tint and blur.
  `ImageCache.prefetch`, `ImageCache.size(of:)` and `ImageCache.clear` reach its cache.
