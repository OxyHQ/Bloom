---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `bloom routes [--app <dir>] [--platform android|ios|web] [--out <file>] [paths…]`: an Expo Router app's route tree as `bloom` reads it from `app/` (groups, `index`, `[param]`, `[...rest]`, `+not-found`, the `_layout` chain, platform files, tests and web-only files left out), the patterns two routes share, and the route each given path opens; with `--out <file>`, the tree as the Bloom router's table: `root`, `routes` (each route's parameters, its tag its file) and `paths` (its pattern, most specific first), with `layouts` and `screens` (each a lazy `require`) for what draws each tag. Mention's 124 routes read as Expo Router draws them.
- The Bloom router's table takes `paths`, each route's path pattern (`name`, `:param`, `*rest`, `*`): a deep link or web URL opens the first pattern it matches and a route's path is its pattern filled in, so the table `bloom routes --out` writes is one the router (and later the native backends' navigation) reads. A table without `paths` (an app's `Routable` enum) works as before.
