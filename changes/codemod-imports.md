---
package: '@oxy.so/bloom-language-codemod'
bump: minor
section: Added
---

- `bloom-language-codemod imports <dir> [--write]` moves each TS import of the language to the entry that exports it now. Since 2.0.0's family entries, `Row` comes from `@oxy.so/bloom-language/containers`, `TextField` from `/inputs` and `VirtualList` from `/list`. The language's `package.json#exports` is the source of truth, for values and types. Aliases and `type` imports are kept, and a second run changes nothing. Mention's 139 files moved 352 names.
