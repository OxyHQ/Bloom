---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A generic call's witnesses are imported where the source does not name them: a `<T: Codable>` call passes another file's `Page$$codec(Post$$self)`, and `FeedModel(…)` its `FeedModel$$init`, so a module that uses a type of another file without naming its codec or `init` builds. ADR 0002's three Mention examples compile as written (`examples/Mention`), and their emitted TypeScript passes a strict tsc check.
