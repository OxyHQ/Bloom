---
package: '@oxy.so/bloom-data'
bump: minor
section: Added
---

- `sqlitePersister(open, remove, { json: false })`: a SQLite without its JSON functions (Android's
  own before API 34) reads a list as its row and then its records by id, and the prune passes the
  kept types as parameters. The default (`json: true`, expo-sqlite's) is unchanged.
