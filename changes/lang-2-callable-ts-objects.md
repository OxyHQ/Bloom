---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- **A TS value callable beside its members is typed:** an object type with call signatures and members (zustand 5's store hook, `UseBoundStore<S>`: `(): S`, `<U>(selector: (state: S) => U): U`, `getState(): S`) keeps each signature, as a Swift value with `callAsFunction` overloads: a call takes the first signature its arguments fit, generic ones instantiated, so `useTrendsStore { s in s.trends }` is `[Trend]`, a Bloom list with Swift's members (`enumerated()`, `isEmpty`), and `useTrendsStore.getState()` stays a member. It was `Foreign`, and a Swift list method on its result B0601 (mention13 foreign-enumerated). A generic TS alias of an object type (`type UseBoundStore<S> = { … }`) is mapped with its arguments, and a type argument the module exports is named `import("…").Name` in the emitted TS.
