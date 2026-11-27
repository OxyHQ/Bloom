---
package: '@oxy.so/bloom-language'
bump: patch
section: Fixed
---

- A root that is the child of an `asChild` element (`<Link href={h} asChild>{toElement(…)}</Link>`, Mention's post time) dropped the props the element merged into it (the `href`, the press, the role), so it was no link. The root hands them to its outermost host, merged as a Slot merges them: both handlers run (the view's first), the styles stack, and a prop the view sets is its own.
