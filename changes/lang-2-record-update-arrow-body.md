---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A record update of a TS interface state parses:** `draft = { ..draft, enabled: false }` on a `@State` of a TS interface type emitted React's functional update with the object literal as the arrow's body unparenthesised (`setDraft((draft) => { families: … })`), which TS reads as a block, so the module did not parse. It is `setDraft((draft) => ({ … }))` (mention14 record-update-arrow-body).
