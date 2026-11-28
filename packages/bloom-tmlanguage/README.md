# @oxy.so/bloom-tmlanguage

The TextMate grammar of **Bloom, the language by Oxy** (`.bloom` files, compiled by `bloomc`; the
[language specification](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-lang-spec.mdx)), as a
[Shiki](https://shiki.style) language registration. It is the grammar the Bloom VS Code extension
uses, generated from its one source,
[`packages/bloom-vscode/syntaxes/bloom.tmLanguage.json`](https://github.com/OxyHQ/Bloom/blob/main/packages/bloom-vscode/syntaxes/bloom.tmLanguage.json).

```js
import { createHighlighter } from 'shiki';
import bloom from '@oxy.so/bloom-tmlanguage';

const highlighter = await createHighlighter({ themes: ['github-dark'], langs: [bloom] });
const html = highlighter.codeToHtml('@State private var count = 0', { lang: 'bloom', theme: 'github-dark' });
```

The registration is `name: "bloom"`, `displayName: "Bloom"`, `scopeName: "source.bloom"`. It works
with both of Shiki's regex engines, and anywhere a `LanguageRegistration` is taken (VitePress
`markdown.languages`, Astro `shikiConfig.langs`, rehype-pretty-code, `@shikijs/rehype`). The plain
grammar is `@oxy.so/bloom-tmlanguage/bloom.tmLanguage.json`, for any other TextMate engine.

It covers Bloom 0.x (`fn`, `pub`, `view`/`screen`/`layout`, `@state`, `match … =>`, `${}`) and 2.0
(`func`, `public`/`private(set)`, `struct X: View`, `class`, `actor`, `protocol`, `extension`, `@State`,
`@Environment(\.k)`, `async`/`throws`/`try?`, `switch`/`case`/`where`, `guard … else`, `do`/`catch`,
generics with constraints, ranges, `\(…)` interpolation, key paths, `$0`, `$binding`, implicit
members, `some`/`any`, `test("…") {}`, `extern module "…" {}`).

Do not edit `bloom.tmLanguage.json` or `index.js`: edit the extension's grammar and run
`bun run generate` here (`bun run test` fails while they differ).

License: [The Breathe License](LICENSE), as the rest of Bloom.
