---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Performance
---

- React's `useMemo` and `useCallback` written as a view's members (TS the codemod kept) are plain members, memoised in the view's one cache on their exact dependencies: no hook slot each, as the React Compiler folded them for the TS. `let f = useCallback({ … }, deps)` is `let f = { … }`, and `let x = useMemo({ e }, deps)` is `let x = e`. A hook function keeps its calls.
