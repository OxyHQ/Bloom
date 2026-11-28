---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- The spec's typed object kinds: an object parameter may declare `fields` (each key's type, `?` when it may be left out) in place of `keys`, and a parameter `[name]` is a list of that object. The first is `dialogButton` (Bloom's `DialogAction`), with the token set `dialogActionColor` (`default`, `cancel`, `destructive`), which `Dialog().buttons(…)` takes as `[dialogButton]`. The reference documents both.
