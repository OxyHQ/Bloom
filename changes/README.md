# Changelog fragments

A pull request never edits a `CHANGELOG.md`. For each package it changes, it adds one file here,
`changes/<topic>.md`, named after its change (`avatar-group-halo.md`, `language-own-screen.md`):

```md
---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- `.ownScreen()`: a `screen()` branch that is a surface of its own (Bloom's `CallScreen`, a story
  viewer) is drawn as it is, with no Bloom `Screen` around it.
```

- `package`: `@oxy.so/bloom` or a published package under `packages/` (the compiler's platform
  packages follow the compiler and take none).
- `bump`: what the change asks of the package's next version. `patch` is a fix, `minor` a feature
  or a removal no app uses (with a `Breaking` entry), `major` a breaking change an app feels.
- `section`: the heading it goes under: `Compatibility`, `Breaking`, `Added`, `Changed`,
  `Deprecated`, `Performance`, `Documented` or `Fixed`.
- The body is one or more list items, written as the CHANGELOG reads them. A change with entries
  in two sections, or for two packages, adds a file for each.

The release PR compiles the fragments into each package's `CHANGELOG.md` and deletes them
(`bun run changelog:release`, [docs/releasing.mdx](../docs/releasing.mdx)). CI fails a pull request
that edits a `CHANGELOG.md` without releasing that package, and a fragment it cannot read
(`bun run changelog:check`).
