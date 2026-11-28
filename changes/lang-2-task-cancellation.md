---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- **`await Task.cancellation`:** in a `.task`, it returns once the task is cancelled (its id changes, the view leaves), so a setup's teardown is a `defer` before it and runs exactly when React's effect cleanup did: `.task(id: room) { let s = socket.join(room); defer { socket.leave(s) }; await Task.cancellation }`. A `defer` with nothing awaited after it still runs when the body returns, as spec 8 says; migrated effects whose cleanup ran at once (polling stopped, a debounce cleared, a socket left right after joining) take this form (mention15 task-defer-runs-at-once).
- **A `.task`'s work takes its cancellation:** a Bloom call in a `.task` that takes `cancellation: TaskSignal?` and is given none takes `Task.signal` (`sleep(for:)`, `HTTPClient`'s calls), as Swift's child work is cancelled with its task: a superseded debounce (`.task(id: query) { try? await sleep(for: .milliseconds(300)); search(query) }`) stops waiting. `CheckResult.implicit_signals`.
- **Implicit static functions:** `.milliseconds(300)` where a `Duration` is expected calls `Duration.milliseconds(300)`, as Swift's implicit member expression reads a static function giving the type (it was B0205, "a struct, with no `milliseconds`").
