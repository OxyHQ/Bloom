---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `@Model` records persist in a `bloom build` without Expo: BloomData's persister runs over Bloom's
  native storage module (`BloomStorage`'s new `sql…` functions, Android's own SQLite with WAL and
  compiled statements), with no `expo-sqlite`. `--with-expo` keeps expo-sqlite.
