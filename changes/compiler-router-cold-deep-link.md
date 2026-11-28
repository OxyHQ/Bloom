---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- The Bloom router opens the deep link that starts the app (`demo://post/3` with the app stopped) on its route: it reads the link before the stack's first frame, so the stack starts with the route. A push in the stack's first frames was lost, and the app stayed on the feed with the post rendered behind it.
