---
package: '@oxy.so/bloom-language'
bump: patch
section: Fixed
---

- An `Image` of a ratio (`.aspectRatio(16 / 9)`) with no width or height of its own takes the width its column offers, as SwiftUI's does: in a `VStack(alignment: .leading)` (or `.center`, `.trailing`) it was drawn with no width, since an image has none until it loads. It stretches itself (`alignSelf: 'stretch'`, its pressable host's when it takes presses) unless it is placed (`.alignSelf`) or in an `HStack`.
