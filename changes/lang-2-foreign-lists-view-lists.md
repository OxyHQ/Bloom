---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A list of TS values fits a typed list (`[Foreign]` where `[Account]` is expected), and a function whose parameter is typed fits where TS passes it a TS value (`bans.map(renderBan)`); both are checked by `satisfies`, as a single TS value is.
- A `[View]` is a child: a conditional's branch (`c ? Text(…) : xs.map(f)`), a node's children argument, `Embed`'s value (`toElement(…)`), and a builder's last line, spread as its parent's children (`HStack(title, ...rows)`).
