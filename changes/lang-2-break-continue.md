---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Swift's `break` and `continue` in `for` and `while` (2.0), with named loops: `outer: for row in grid { … break outer … }`. An unnamed `break` in a `switch` case leaves the `switch`, as Swift's does (its `if` chain takes a label). Outside a loop, inside a closure whose loop is outside it, or with a name no loop around it has, either is B0219. They were read as names (B0202 "cannot find `continue`", lang-mention-11's loop-continue: Mention's MediaGrid, VideosGrid, SuggestedUsers). The formatter keeps them.
