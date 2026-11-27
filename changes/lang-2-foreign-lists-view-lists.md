---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A list of TS values fits a typed list (`[Foreign]` where `[Account]` is expected), and a function whose parameter is typed fits where TS passes it a TS value (`bans.map(renderBan)`); both are checked by `satisfies`, as a single TS value is.
- A `[View]` is a child: a conditional's branch (`c ? Text(…) : xs.map(f)`), a node's children argument, `Embed`'s value (`toElement(…)`), and a builder's last line, spread as its parent's children (`HStack(title, ...rows)`).
- A list of TS values, an optional list (`c ? rows : none`) and a list literal line are children too.
- A TS indexed access type (`FeedPostSlice['socialContext']`) is the member it names, so its fields are typed; an optional member's parts are named through `NonNullable<…>`.
- `x ?? e` whose two sides both fit what is expected is that type (`[Author]? ?? []` where `[Person]` is taken).
- String literals given for a generic parameter are read after the call's typed arguments, so `T` is a TS literal union rather than `String` (`choices(["a", "b"], chosen, onChoose)`).
