---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's trailing row for a `VirtualList`, as SwiftUI's `List(data) { item in … }`: `VirtualList(posts) { post in … }` is handed each item, and `VirtualList(posts.enumerated()) { i, post in … }` its index and item, with no pairs built. It is emitted as one row function that reads FlashList's `{ item, index }` (`({ item: post, index: i }) => …`), hoisted to module scope when it reads nothing of the view, so the list's `renderItem` keeps its identity. A row closure passed as the argument, a function value and TS's `renderItem` keep FlashList's `{ item, index }`. A trailing row with the wrong number of parameters is B0503.
