# highlightjs-bloom

A [highlight.js](https://highlightjs.org) grammar for **Bloom, the language by Oxy** (`.bloom` files,
compiled by `bloomc`; the
[language specification](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-lang-spec.mdx)). It
highlights Bloom 0.x (`fn`, `pub view`, `@state`, `match … =>`, `${}`) and 2.0 (`func`, `struct X: View`,
`class`, `protocol`, `extension`, `@State`, `async`/`throws`/`try?`, `switch`, `guard`, `do`/`catch`,
generics, ranges, `\(…)` interpolation, key paths, `$0`, implicit members, `extern module`, `test`).

## Use

With a bundler or Node:

```js
import hljs from 'highlight.js/lib/core';
import bloom from 'highlightjs-bloom';

hljs.registerLanguage('bloom', bloom);
hljs.highlight('@State private var count = 0', { language: 'bloom' }).value;
```

`require('highlightjs-bloom')` gives the same function (`dist/bloom.cjs`).

From a CDN, after highlight.js itself (the file registers `bloom` on the global `hljs`):

```html
<script src="https://unpkg.com/@highlightjs/cdn-assets@11.12.0/highlight.min.js"></script>
<script src="https://unpkg.com/highlightjs-bloom/dist/bloom.min.js"></script>
<script>hljs.highlightAll();</script>
```

Then mark blocks `<pre><code class="language-bloom">`.

## Develop

`src/languages/bloom.js` is the grammar; `bun run build` writes `dist/` from it, and `bun run test`
runs the markup tests (`test/markup/bloom/*.txt` against `*.expect.txt`, as highlight.js's own
are; `UPDATE=1 node --test test/*.test.mjs` rewrites them), every example of the language spec, and
both builds.

License: [The Breathe License](LICENSE), as the rest of Bloom.
