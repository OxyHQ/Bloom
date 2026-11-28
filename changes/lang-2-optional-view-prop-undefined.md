---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- An absent `View?` handed to a TS prop crosses as `undefined` again, as every Bloom optional does, so an unset prop stays unset (`'k' in props`, and a default prop applies). Only a function's result crosses as `null`: its expression body, a `return`, its last line, or a function value's wrapper. A render callback's `ReactElement | null` takes that. Before, every absent view crossed as `null` (Mention: MediaGrid and VideosGrid's `listHeaderComponent`).
