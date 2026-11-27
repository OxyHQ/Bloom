# prism-bloom

A [Prism](https://prismjs.com) component for **Bloom, the language by Oxy** (`.bloom` files,
compiled by `bloomc`; the
[language specification](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-lang-spec.mdx)). It
registers `Prism.languages.bloom`, for Bloom 0.x (`fn`, `pub view`, `@state`, `match … =>`, `${}`)
and 2.0 (`func`, `struct X: View`, `class`, `protocol`, `extension`, `@State`, `async`/`throws`/`try?`,
`switch`, `guard`, `do`/`catch`, generics, ranges, `\(…)` interpolation, key paths, `$0`, implicit
members, `extern module`, `test`).

## Use

```js
const Prism = require('prismjs');
require('prism-bloom'); // registers Prism.languages.bloom on the Prism prismjs made global

Prism.highlight('@State private var count = 0', Prism.languages.bloom, 'bloom');
```

In a page, load it after Prism's own script, then mark blocks `<pre><code class="language-bloom">`:

```html
<script src="https://unpkg.com/prismjs@1.30.0/prism.js"></script>
<script src="https://unpkg.com/prism-bloom/prism-bloom.js"></script>
```

The module's value is the component function itself, `bloom(Prism)`, so it also registers with
refractor (`refractor.register(require('prism-bloom'))`) or any other Prism instance.

Tests (`bun run test`) run it in the real prismjs: Prism's own test format in
`test/languages/bloom/*.test` (`UPDATE=1 node --test test/*.test.mjs` rewrites the token streams),
and every example of the language spec.

License: [The Breathe License](LICENSE), as the rest of Bloom.
