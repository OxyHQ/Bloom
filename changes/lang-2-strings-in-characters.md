---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A string counts user-perceived characters, as Swift's does, on the TS backend as on the native ones: `"👍🏽".count` is 1 (it was JS's `length`, 4), and `slice(a, b)`, `firstIndex(of:)`, `lastIndex(of:)`, `paddingStart(to:)`/`paddingEnd(to:)` and a regex match's `start`/`end` are character offsets, so one read off one API indexes another. `s.count` compiles to `characterCount(s)` (no segmenting for a string with nothing at or past U+0300).
- `s.utf16`, Swift's `UTF16View` (`@Transparent`, the string itself at run time), has JS's UTF-16 units for what counts them (a server's length limit): `count`, `isEmpty`, `slice`, `prefix`/`suffix`, `firstIndex(of:)`/`lastIndex(of:)`, `paddingStart`/`paddingEnd`.
- The regex conformance corpus (`conformance/regex/`) is this package's; `record.mjs` records Node's `RegExp` on its own, and `test/regex-conformance.test.ts` runs the TS runtime against it (every case conforms, offsets in characters).
