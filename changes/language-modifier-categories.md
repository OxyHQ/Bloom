---
package: '@oxy.so/bloom-language'
bump: patch
section: Added
---

- The spec gives each modifier a category (`modifierCategories` in `spec/language.json`), for a backend that draws modifiers itself, the native runtimes of ADR 0003: `layout`, `paint`, `text`, `interaction`, `accessibility`, `motion`, `presentation`, `screen`, `environment` and `identity` for the universal modifiers, each listed (the reference generator fails on one that is not), and `node` for every other, an option its node's own implementation reads. The modifiers reference shows each one's category.
