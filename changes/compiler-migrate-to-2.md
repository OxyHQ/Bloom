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
- `bloom migrate --from 0.x` writes a `pub default view X` as the named `public struct X`, and the TS files that import or `jest.mock` it take it by name.
- The migration mode in a build: `@oxy.so/bloom-language-compiler/jest` takes `{ allowTsImports: true }` and `withBloomLanguage(config, { allowTsImports: true })` passes it to Metro (`bloom-lang-dts --allow-ts-imports` for the declarations), so an app with a `Package.bloom` can run `bloom migrate`'s output (which still imports TS by path) while its port is under way.
- `bloom migrate --write` draws a migrated view's JSX in the files that import it as `toElement(X({ … }))` (a `key` is `toElement`'s second argument), importing `toElement` where needed.
- A view that hands its props on whole has them written out, and passes each one (`Row(post: post, …)`). Rest props (`{ label, ...menu }: P & { label }`) are one stored property of `P`. A local function of one destructured object takes labelled parameters.
- TanStack's `useQuery({ queryKey, queryFn })` is drawn with an app's `TanStackQuery` binding module (`useQuery(QueryOptions(…))`) when the file reads only the options and result fields the binding declares.
- `actions(function …)` and `menu(function …)` are `struct X: MenuActions` and `struct X: MenuContent`, and a generic component is `struct X<T>: View`. An intersection alias of the file's object types is one struct. A menu's row list, `{c && xs?.map(…)}` and a setter in a statement's `?:` or `&&` are written as builder lines and `if`s.
- More TS forms with a 2.0 spelling:
  - an inline `as const` string list is a module constant of its literals' union, and an `as const` list of pairs is a list of tuples;
  - `padStart`/`padEnd` are `paddingStart`/`paddingEnd`;
  - `Boolean(x?.trim())` and a value `a && "…"` keep JS's truthiness;
  - `[value, onValueChange]` is a `Binding`;
  - a keyed write is a subscript set, and a `switch` that returns from every case has no `case _`.
- Round 10 (lang-mention-10):
  - reads TS had typed are spelled as Bloom types them: `x as T['k']` where a union is expected, a called `Record` read (`ICONS[k]!`), `s.slice(n)`, i18next's `t(key, "default", { … })`, optional members tested for their truthiness (narrowed), and a type-guard `filter` (`compactMap`);
  - a value built by a local closure is one member; a closure's optional parameter is `T?`, passed as `none`;
  - a `defineModifier` made in place, or inside another, is a modifier value; a list pattern with defaults reads `at(i) ?? d`; `function f<T>` keeps its type parameters, and a generic view's members are 2.0's;
  - a `switch`'s `never` default is Swift's exhaustive `switch`; a TS component's `aria-pressed` is `..["aria-pressed": x]`; `ReadonlySet` is `Set`; `Embed(<></>)` is an empty `Group`;
  - a module `let` of one file is a file-scope `private var` (needs the compiler's #1058).
