---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- What is expected reaches into a closure called at once and a generic method's result, as Swift's type checking does: `let all: [Item] = { if … { return a.map { … } }; return b.map { u in ({ id: u, uri: u }) } }()` checks each `return` against `[Item]`, and the record literals in `map`'s closure are `Item`s, a defaulted field left out. It was typed from the first `return` (B0201, Mention's FeedCard). Swift's closure signature writes the result type by hand: `{ () -> [Item] in … }`, `{ (n: Int) -> Int in n * 2 }`, and the formatter keeps it. Only a declared type (an annotation, a parameter's, a modifier's) reaches a generic method's result, never one inferred from a sibling: `[{ kind: "header", … }, ..xs.map { … ({ kind: "item", …, item }) }]` with no context is typed as before (explore/trending). A record a closure gives, its result type not written, takes an expected type with extra fields, as TS checks no excess property on a callback's result (`let avatars: [AvatarGroupItem] = useMemo({ xs.map { m in ({ id, color }) } }, deps)`, Feed/PostItem); a literal written where the type is declared is still checked for them.
