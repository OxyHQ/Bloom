---
package: '@oxy.so/bloom-language'
bump: patch
section: Documented
---

- To move an app from 1.x, run `npx bloom-language-codemod imports . --write` (the codemod 0.8.0). It rewrites each TS import of a family's name from the root (`import { Row, TextField } from '@oxy.so/bloom-language'`) to the family's entry (`/containers`, `/inputs`), which 2.0.0 split out. Without the rewrite TypeScript reports `has no exported member 'Row'`, and at run time the name is `undefined`. The root keeps no re-export: one would load every family again.
