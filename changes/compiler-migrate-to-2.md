---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `bloom migrate <paths…>` takes embedded-language `.tsx` modules to Bloom 2.0. A file is migrated only when its 2.0 text compiles with 0 errors in the migration mode, and the rest are refused with reasons (`--report`). The forms it writes:
  - `struct X: View`, typed tokens, SwiftUI's names and effects as `.onAppear`/`.task(id:)`/`.onChange(of:)`;
  - `do`/`catch` and `String(localized:)`;
  - `xs.at(i)` where TS read past the end, `x!` where TS's flow proved a value present, and `Ref(v)`/`ViewRef<T>()` for refs;
  - React's stale reads as snapshots;
  - JS's member names kept on `Foreign` values.
