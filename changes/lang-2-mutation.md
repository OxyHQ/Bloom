---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Breaking
---

- The standard library's BloomData `Action` is now `Mutation` (`Mutation.make(name, optimistic:) { … }`, `run(input)`), so BloomUI's `Action` node in an `ActionBar` is no longer shadowed. The standard library's `HTTPError` gains `response` and `static func cast(_:)`, which also reads an Axios error.
