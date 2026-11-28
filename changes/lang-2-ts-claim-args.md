---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- An optional only by a guard Bloom kept on a TS value TS types as present fits a TS parameter: `postPermalink(viewPost?.id)` with a TS `viewPost: HydratedPost`, directly, through a chain (`post?.user.name`) or through a `let`. TS's own type there is `string`, and TS checks it where it lands; a cache of such a `let` declares no type, so TS's is the one it reads. A TS value TS types as optional (`metadata?.slug`) stays B0201. It was B0201 in Mention's postMenuActions.
