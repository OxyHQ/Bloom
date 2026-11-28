---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `BLOOM_LINK` with both `@oxy.so/bloom-language` and `@oxy.so/bloom-language-compiler`: packing
  the first no longer deletes the second's fresh tarball (the stale-pack cleanup matched by
  prefix), which failed `bloom build` at `bun install` with `ENOENT extracting tarball`.
