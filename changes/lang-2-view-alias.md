---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A silent wrong render:** a view called through a `let` alias of it (`public let PostItem = PostItemContent`, from its own module or another) was emitted with positional arguments, `PostItem(post, open)`, so the view's props were the post itself. An alias of a view is that view: `PostItem({ post, openPostEngagement: open })` (mention13 view-alias-call).
