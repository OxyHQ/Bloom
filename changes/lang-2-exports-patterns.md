---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A package's `exports` subpath patterns resolve as Node and TS resolve them (`"./icons/Ri*"`:
  the longest matching prefix, its `*` replaced; a conditions object read `types`, then
  `react-native`, `import`, `default`; a list's first entry that resolves). Every Bloom icon
  (`@oxy.so/bloom/icons/RiHeart3Line`) was B0602 and `Foreign`; it is now its declared
  component.
