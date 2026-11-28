---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A TS `T | undefined` whose `T` may be `undefined` already (`c ? undefined : server`, with `server?: ReturnType<typeof read>` and `read` returning `{ title } | undefined`) crosses in as one optional, `{…}?`, not an optional of an optional, so `p.server?.title ?? "fallback"` checks. It was B0201 "`{…}?` may be `none`" (Mention: ChannelScreen, `profileSEOPolicy(…).server`).
