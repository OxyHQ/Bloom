---
package: '@oxy.so/bloom'
bump: patch
section: Fixed
---

- `BloomImage` draws with Bloom's native image view in an app whose Metro lists `ts` before `tsx` (Expo's default `sourceExts`). Its web half, `bloom-image-view-draw.ts`, was found before the native `bloom-image-view-draw.native.tsx`, because Metro tries each extension before each platform. So every `BloomImage` in Mention's Bloom build drew nothing, with no error. The web file is now `.tsx`, and a test holds every platform file in `src/` to its default file's extension.
