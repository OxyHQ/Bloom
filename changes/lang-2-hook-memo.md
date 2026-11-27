---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Performance
---

- A hook function's (`func useX`) top-level `let`s are memoised in one cache on their exact dependencies, as a view's members are, and React's `useMemo`/`useCallback` there are plain `let`s: no hook slot each, as the React Compiler's cache for a custom hook did for the TS (PostItem's `usePostRowModel`: 45 of them). A `let` that calls a hook, a cheap read, a class instance and a value a later statement writes in place stay plain; a hook function with nothing to cache is emitted as before. A closure in a hook function that reads only module names is a module constant, as in a view, and each closure hoisted to module scope has a name of its own in the module (two could both be `$fn10`).
