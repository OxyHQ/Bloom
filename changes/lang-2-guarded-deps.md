---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A render-time crash:** a cache's dependency on a TS value's field (`job.id`, read by a handler only after its own guard) was read as `job.id` in the cache's test, which runs at every render, before any guard: with `job` undefined (a query still loading) the view threw. A dependency read through a TS value (or an optional) is `job?.id` (mention13 memo-dep-guarded-read).
