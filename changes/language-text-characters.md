---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- `characterCount`, `characters`, `characterSlice`, `characterBoundaries`, `characterOffset` and `utf16Offset`: strings in user-perceived characters, what compiled `.bloom` code counts by. They use `Intl.Segmenter` where the engine has it and UAX #29's rules (GB3 to GB13, over a generated break table, `scripts/generate-graphemes.mjs`) where it does not, as on Hermes; tested against `Intl.Segmenter` on emoji ZWJ sequences, skin tones, flags, combining marks, Hangul and CR LF.
