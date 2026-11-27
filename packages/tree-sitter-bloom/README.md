# tree-sitter-bloom

The [tree-sitter](https://tree-sitter.github.io/) grammar for **Bloom, the language by Oxy**:
the `.bloom` files bloomc (the `bloom` CLI) compiles. It is not Berkeley's Bloom research
language of the same name.

It reads both generations of the surface: 0.x (`fn`, `pub`, `view`/`screen`/`layout`, `@state`,
`match … =>`, `${…}`) and 2.0 (`func`, `public`/`private(set)`, `struct X: View`, `class`, `actor`,
`protocol`, `extension`, `@State`/`@Observable`/`@Environment(\.k)`, `async`/`throws`/`try?`,
`switch`/`guard`/`do`–`catch`, ranges, `\(…)`), as
[the specification](../../docs/bloom-lang-spec.mdx) describes them and as the compiler's parser
(`packages/bloom-language-compiler/crates/lang/src/parser.rs`) reads them. Where the two differ,
the parser wins.

What ships:

| | |
|---|---|
| `grammar.js`, `src/scanner.c` | the grammar; the scanner applies the lexer's newline rules (a line ends a statement unless the next one starts with `.member` or a binary operator other than `-`, or the line ends inside `(`/`[` or after an operator), nested `/* */` comments, string bodies, and a `?` written against its operand (`f()?`, `T?`) |
| `queries/highlights.scm` | highlights, in the standard capture names (`@keyword.conditional`, `@function.method.call`, …), most general first: the last matching pattern wins |
| `queries/locals.scm`, `indents.scm`, `folds.scm`, `injections.scm`, `tags.scm` | scopes and definitions, indentation (nvim-treesitter's captures), folds, injections (comment markers, `Regex("…")` patterns) and code-navigation tags |
| `bindings/` | Node, Rust and Python bindings (`tree-sitter init`'s) |

## Use it

**Neovim** (nvim-treesitter), until Bloom is in its parser list:

```lua
require('nvim-treesitter.parsers').get_parser_configs().bloom = {
  install_info = {
    url = 'https://github.com/OxyHQ/Bloom',
    location = 'packages/tree-sitter-bloom',
    files = { 'src/parser.c', 'src/scanner.c' },
    branch = 'main',
  },
  filetype = 'bloom',
}
vim.filetype.add({ extension = { bloom = 'bloom' } })
```

Copy `queries/*.scm` to `~/.config/nvim/queries/bloom/`.

**Helix** (`languages.toml`):

```toml
[[language]]
name = "bloom"
scope = "source.bloom"
file-types = ["bloom"]
comment-token = "//"
block-comment-tokens = { start = "/*", end = "*/" }
indent = { tab-width = 2, unit = "  " }

[[grammar]]
name = "bloom"
source = { git = "https://github.com/OxyHQ/Bloom", rev = "<commit>", subpath = "packages/tree-sitter-bloom" }
```

Then `hx --grammar fetch && hx --grammar build`, and copy the queries to
`~/.config/helix/runtime/queries/bloom/`.

**Zed**: an extension's `extension.toml` names the repository, a commit and this directory
(`[grammars.bloom] repository = "https://github.com/OxyHQ/Bloom"`, `rev = "<commit>"`,
`path = "packages/tree-sitter-bloom"`).

**Node** (once published): `npm install tree-sitter tree-sitter-bloom`, then
`parser.setLanguage(require('tree-sitter-bloom'))`. **Rust**: the crate's `LANGUAGE`.
**Python**: `tree_sitter_bloom.language()`.

## Develop

The CLI is pinned (`tree-sitter-cli@0.27.2`) and run through `npx`; nothing here is a workspace of
the repository, so `bun install` at the root builds no addon.

```bash
cd packages/tree-sitter-bloom
bun run generate     # grammar.js → src/parser.c, src/grammar.json, src/node-types.json (committed)
bun run test         # the corpus (test/corpus), the highlight assertions (test/highlight),
                     # and every .bloom file in the repository (scripts/parse-repo.mjs)
```

`scripts/parse-repo.mjs` parses every `.bloom` file git tracks (the compiler's fixtures, the
standard library, the examples, the editor fixtures) and fails on any `ERROR` or `MISSING` node.
A file written to be broken is listed in it, and must stay broken. CI runs `generate` (the
committed parser must be current) and `test` in the Language packages job, so a language change
that the grammar does not read fails there.

A construct the compiler gains is added to `grammar.js` and to a corpus file; `tree-sitter test
-u` rewrites the expected trees, which are read before they are committed.

## Licence

The Breathe License, as the rest of the repository: see [LICENSE](LICENSE).
