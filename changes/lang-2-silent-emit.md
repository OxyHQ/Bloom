---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A member Bloom respells keeps its spelling through `?.`: `query.data?.count` with a generic `data: T?` and `T = [Post]` is `query.data?.length`, and `xs?.first` is `xs?.[0]`, where both stayed as written and read `undefined` in JS. A view's cache depends on the object, not on the respelled member, so it redraws when the data changes.
- A member that wraps its object, read through an optional chain (`feed?.items.isEmpty`, `feed?.tags.keys`, an extension's property, `feed?.name.toInt()`), is `none` when the object is, where it gave `false`, threw, or was handed `undefined`; the link after it carries the `?.`.
- A struct construction leaves a field out of the object when its default is `none` and the call leaves it out or gives `none`, where it wrote `field: undefined` and so overrode a library's merged defaults (TanStack Query's `staleTime`).
- A TS value given to a TS generic's type parameter (`mergeIdentity<T extends IdentityHolder>(actor: T, …): T` with a `Foreign` actor) makes `T` that value's type, where `T` was left unsolved and the result's members were B0205 (`_` has no member `name`).
- A module constant that names a view (`public let PostItem = PostItemContent`) is declared as that view (`typeof PostItemContent`, with a private view declared beside it), where its `.d.bloom.ts` was a function of the view's fields, so every TS `PostItem({ post })` failed tsc.
- An untyped `Foreign` (TS's `unknown`) stays untyped through a call, a member read and an index, where its TS type was `ReturnType<>` or `["name"]`, which Babel refuses ("Type argument list cannot be empty") in a hook's inferred return type.
