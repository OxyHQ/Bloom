---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A cancelled task's request is cancellation only:** an HTTP call in a `.task` (it takes the task's cancellation, now through an extension method too: `api.send(.get, path)`) cancelled mid-flight rejected into the task's `catch`, which set an error state and reported a failure for a view that had moved on. A throw once the task is cancelled stops the task: no `catch` runs and nothing is set after it. Runtime tests abort a superseded request and one whose view left.
- **`fatal()` is `Never`:** `URL.parse(s) ?? fatal()` is a `URL`, not a `URL?` (`fatal` was generic in its result, which took the optional). `Never` is a type name: what does not return.
