---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Performance
---

- `BloomVideo`: the players' first buffering goes in the order they were made, at most 3 at once,
  while the ones already playing load only the 2 s that keep them playing. On the 8-video bench
  this brought the first video's first frame and the 8th's ~65 ms earlier.
