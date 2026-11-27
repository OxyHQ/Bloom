---
package: '@oxy.so/bloom-language'
bump: patch
section: Changed
---

- `spec/language.json` lists `noneModifiers`, generated from `Node`'s methods: the modifiers whose value takes `undefined`. The language compiler lets a `.bloom` token argument be `none` there.
