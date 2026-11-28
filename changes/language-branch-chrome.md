---
package: '@oxy.so/bloom-language'
bump: patch
section: Fixed
---

- A screen whose root `Group` draws one branch takes that branch's chrome, as SwiftUI reads it from any branch: its `.sheet`s, and its `.footer`, `.floatingAction` and `.testID` where the root has none of its own (the title and toolbar already were). They were dropped (Mention's feeds FAB, PostDetailScreen's reply footer and `post-screen` test id). The branch's test id names the screen and is taken off the branch inside it, so it is found once.
