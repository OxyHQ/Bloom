---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Performance
---

- Fewer emitted bytes: a `match` over a fieldless enum whose every arm reads or patches the field named like its case is one keyed access (`prefs[key]`, `{ [key]: v }`), a view body that is a hoisted tree returns it with no memo slot, a short string `let` of names is recomputed rather than cached, and a child that is a name has no cache slot. The cost gate's fixtures go from 1868 / 1341 / 3995 bytes (minified / gzip / Hermes bytecode) to 1709 / 1251 / 3707, below TypeScript with the React Compiler's 1684 / 1234 / 3804 in gzip; Mention's Notifications module from 4912 / 1792 / 7669 to 4598 / 1694 / 7386.
- Fewer emit allocations: a fragment's first piece is moved in, blocks, joins and wraps are built at their final size, and the token vector and the source map's mappings are sized once.
