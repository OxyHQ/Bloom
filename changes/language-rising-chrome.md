---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- **Screen chrome rises from any drawn view**, as SwiftUI's `navigationTitle` and `toolbar` preferences do: a view's `.title`, `.titleDisplay`, `.subtitle`, `.toolbar`, `.toolbarLeading`, `.backLabel` and `.scrollEdge` (on its call or its body's root, a `view()` or an inlined view) title the screen that draws it, at any depth, for what the screen's root does not say itself. The root's own wins, and an outer view's over an inner one's. Only views rise (a menu section's own `.title` stays its own), and a view that changes its title redraws only the screen's header (`rising-chrome.ts`, read by `ScreenHost` through `useSyncExternalStore`). Mention's lists/[id] and events/[id] set their title from the view they load.
