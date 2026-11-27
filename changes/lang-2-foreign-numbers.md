---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A TS value compared with a number or a string is one (`item.pokeCount > 1`, `page.page < page.totalPages`), as are a TS value beside an `Int` (`2 * Math.PI`) and a negated one (`-event.translationY`); each is checked by `satisfies number` (or `string`).
- `a || b` of two optionals that are not `Bool`s is an optional (`user.username || user.handle` is a `String?`), where it was refused as `String?` given for `String`; a chain that ends in a present value is present, through parentheses and branches.
- A hook given directly as an argument of a view member's call is a view member's hook (`let account = useProfileAccount(useRoutedProfileUsername())`), where it was B0420.
- A hook in a ternary's branch or on the right of `&&`, `||` or `??` is B0420 even as a view member's value: it runs on only some renders. It used to pass when it was the member's first call.
- A TS `view()` of the embedded language is called with its props (`Badge({ label: "a" })`) where it was mounted as a React component, which put a node where React takes an element.
- A Bloom view in an optional React-element prop (`footer: bare ? none : Text("foot")`) and in a prop of a TS component whose props Bloom cannot read (Bloom's `Screen(header:)`) crosses as `toElement(…)`; a declaration's `import("./types.js").T` names that module's type.
- A `struct X: Screen` (or `Layout`) outside the app's router folder is its file's named export, not the default export only a route has.
- A presence test in parentheses narrows as one without (`(room.status != none) ? room.status : "scheduled"`).
- `String(localized:)` and `Text("key")` in a view read the locale through `useLocalization()` and are memoised on it, so `Locale.prefer` re-draws a mounted view in the new language.
- A plural lookup with a count of 0 takes the catalog's `zero` form where it has one, in every language (i18next's `_zero`), before the CLDR category.
- An UpperCamel arrow in a `.tsx` (`const List = (props: ListProps) => …`) is a component, and so is its `memo(List, eq)`: mounted with `$jsx`, where it was called as a function and drew nothing.
