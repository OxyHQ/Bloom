---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- The Bloom router draws each route with the language's screen host (`@oxy.so/bloom-language/screen-host`): a route's `.title()`, `.toolbar()`, `.header()`, `.footer()` and `.sheet()` are its Bloom `Screen`'s chrome, as under expo-router's `screen()`, and a pushed route's header offers Back. It needs the `@oxy.so/bloom-language` release that ships the subpath.
