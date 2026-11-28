---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- `characterCount`, `characters`, `characterSlice`, `characterBoundaries`, `characterOffset` and `utf16Offset`: strings in user-perceived characters, what compiled `.bloom` code counts by. They use `Intl.Segmenter` where the engine has it and UAX #29's rules (GB3 to GB13, Indic conjuncts' GB9c included, over generated break and Indic_Conjunct_Break tables, `scripts/generate-graphemes.mjs`) where it does not, as on Hermes; tested against `Intl.Segmenter` on emoji ZWJ sequences, skin tones, flags, combining marks, Indic conjuncts, Hangul and CR LF.
