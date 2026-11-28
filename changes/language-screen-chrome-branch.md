---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- **A screen's chrome from the branch it draws:** a screen whose root is a `Group` drawing one branch (`Group { if loading { Skeleton().header(false) } else { Page().title("Job") } }`) takes the header the drawn branch declares (`.title`, `.header`, `.toolbar`, …), read synchronously as the root's is, as SwiftUI's `.navigationTitle` works from any branch; the `Group`'s own chrome comes first. A screen like jobs/[id] showed an empty default header.
