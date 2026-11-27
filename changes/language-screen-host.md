---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- `@oxy.so/bloom-language/screen-host`: `drawScreen(root, { back })` and `ScreenHost`, what `screen()` draws its body with (a Bloom `Screen` with the root's `.title`, `.toolbar`, `.header`, `.footer` and `.sheet` as its chrome), for a navigator that is not expo-router's. Nothing it reaches imports expo-router. `back` is the Back a pushed screen's header offers when its root names none. A test walks its imports on every platform.
