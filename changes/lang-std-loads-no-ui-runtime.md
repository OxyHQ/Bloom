---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- Counting a string no longer loads the UI runtime. The standard library carries the language's string helpers (`text.ts` and its break table, the same source, written to `.bloom/std/Bloom/`), and its `runtime.ts` and a package's emitted `s.count` / character slices import them from there, not from `@oxy.so/bloom-language`'s index, which loads `render.tsx` and every Bloom component. Every std module (Core, Localization, JSON, …) loaded it before, an app load cost, and in Jest it ran before a test's `jest.mock('@oxy.so/bloom/button', …)`, so the mock was not drawn (Mention's commercePickerPaging, PostArticleModal, FeedInterstitial, TrendsWidget, savedScreenRevalidation). A file outside a package keeps the index. No new export subpath.
