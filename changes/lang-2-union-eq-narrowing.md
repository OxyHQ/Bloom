---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `==` and `!=` on a literal union narrow it in both branches, through `||`, `&&` and `!`, and after a guard that returns, as TS narrows it: `mode == "adaptive" || mode == "system" ? "system" : mode` gives the other branch `"light" | "dark"` (lang-mention-10's union-eq-narrowing, Mention's appearance page). The branch where a TS discriminated union's tag test fails is the other member, when one is left (`item.origin == "server" ? item.post.title : item.draft.name`, DraftsList).
