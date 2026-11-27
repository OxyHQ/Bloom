// node --test test/: highlight.js's markup tests (test/markup/bloom/X.txt highlights to
// X.expect.txt, as highlight.js's own test/markup does), the language spec's examples, and the
// two builds in dist/. `UPDATE=1 node --test test/*.test.mjs` rewrites the .expect.txt files.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import hljs from 'highlight.js/lib/core';
import bloom from '../src/languages/bloom.js';

const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const markup = join(root, 'test/markup/bloom');
hljs.registerLanguage('bloom', bloom);

for (const name of readdirSync(markup).filter(
  (f) => f.endsWith('.txt') && !f.endsWith('.expect.txt'),
)) {
  test(`markup: ${name}`, () => {
    const code = readFileSync(join(markup, name), 'utf8');
    const actual = hljs.highlight(code, { language: 'bloom', ignoreIllegals: false }).value;
    const expectFile = join(markup, name.replace(/\.txt$/, '.expect.txt'));
    if (process.env.UPDATE) writeFileSync(expectFile, actual);
    assert.equal(actual, readFileSync(expectFile, 'utf8'));
  });
}

test("the language spec's ```bloom and 2.0 ```swift examples highlight, keywords marked", () => {
  const spec = readFileSync(join(root, '../../docs/bloom-lang-spec.mdx'), 'utf8');
  const blocks = [...spec.matchAll(/^```(bloom|swift)\n([\s\S]*?)^```$/gm)].map((m) => m[2]);
  assert.ok(blocks.length >= 9);
  for (const code of blocks) {
    const result = hljs.highlight(code, { language: 'bloom', ignoreIllegals: false });
    assert.equal(result.illegal, false);
    for (const word of ['func', 'struct', 'switch', 'guard', 'match', 'view', 'let'])
      if (new RegExp(`^\\s*(?:public |pub )?${word}\\b`, 'm').test(code))
        assert.match(result.value, new RegExp(`<span class="hljs-keyword">${word}</span>`));
  }
});

test('auto-detection tells Bloom 2.0 from the languages it resembles', async () => {
  const { default: swift } = await import('highlight.js/lib/languages/swift');
  const { default: typescript } = await import('highlight.js/lib/languages/typescript');
  const auto = hljs.newInstance();
  auto.registerLanguage('bloom', bloom);
  auto.registerLanguage('swift', swift);
  auto.registerLanguage('typescript', typescript);
  const code = readFileSync(join(markup, 'view-0x.txt'), 'utf8');
  assert.equal(auto.highlightAuto(code).language, 'bloom');
});

test('dist/bloom.cjs is the grammar for require()', () => {
  const fromCjs = require('../dist/bloom.cjs');
  assert.equal(typeof fromCjs, 'function');
  const viaCjs = hljs.newInstance();
  viaCjs.registerLanguage('bloom', fromCjs);
  const code = readFileSync(join(markup, 'swift-2.txt'), 'utf8');
  assert.equal(
    viaCjs.highlight(code, { language: 'bloom' }).value,
    hljs.highlight(code, { language: 'bloom' }).value,
  );
});

test('dist/bloom.min.js registers `bloom` on the global hljs, as a CDN <script> does', () => {
  const page = hljs.newInstance();
  vm.runInNewContext(readFileSync(join(root, 'dist/bloom.min.js'), 'utf8'), { hljs: page });
  assert.ok(page.getLanguage('bloom'));
  assert.match(page.highlight('let x = 1', { language: 'bloom' }).value, /hljs-keyword/);
});
