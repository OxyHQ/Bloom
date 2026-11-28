---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A closure parameter whose type a TS generic leaves to TS to infer is a TS value, read as TS reads it: `useTrendsStore(useShallow { state in ({ trends: state.trends }) })` was B0205 "`_` has no member `trends`" (zustand's `useShallow<S, U>`). Only a TS generic's type variables read this way; a Bloom generic's unsolved one stays an error. A spread TS list's items are TS's items (`[..stats.columns]`). Mention: TrendsWidget, InsightsDashboard, lists/[id]/edit and three more.
