---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `bloom routes [--app <dir>] [--platform android|ios|web] [--out <file>] [paths…]`: an Expo Router app's route tree as `bloom` reads it from `app/` (groups, `index`, `[param]`, `[...rest]`, `+not-found`, the `_layout` chain, platform files, tests and web-only files left out), the patterns two routes share, and the route each given path opens; with `--out <file>`, the tree as a module for the Bloom router (layouts, then routes most specific first, each screen a lazy `require`). It is the first piece of an adopted app's routes on the Bloom router: Mention's 124 routes read as Expo Router draws them.
