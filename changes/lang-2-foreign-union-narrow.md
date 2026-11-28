---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A TS union kept as it is (`width: Foreign<"number | '100%'">?`) narrows by `==` and `!=` on its literals, as TS narrows it: where `width == "100%"` holds it is that literal, where it fails the other members, read as Bloom reads them (`number` is `Float`). A frame's side may be `none` (Swift's `frame(width: CGFloat?)`), and a conditional given to a points parameter is a token or points branch by branch, so TS's `.frame({ width: width === '100%' ? 'full' : width })` compiles as written (Mention's CommerceCard).
