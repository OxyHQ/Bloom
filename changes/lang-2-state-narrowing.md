---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A `@State` optional narrows as a local does: `selected == none ? "All" : label(selected)`, `if rating != none { onSubmit(rating) }` in a handler, a member chain of one (`draft.title != none`). A state's value is the render's, and a handler that writes it and reads it again is already B0410. It was B0201 (`found String?`) in Mention's saved posts and feed rating screens.
