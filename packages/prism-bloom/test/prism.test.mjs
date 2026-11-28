// node --test test/: the component in the real prismjs. test/languages/bloom/*.test are Prism's
// own test format (the code, a line of dashes, the simplified token stream as JSON);
// `UPDATE=1 node --test test/*.test.mjs` rewrites their token streams.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { ALL_KEYWORDS } from '../../bloom-vscode/test/keywords.mjs';

const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const cases = join(root, 'test/languages/bloom');
const Prism = require('prismjs');
const bloom = require('../prism-bloom.js');
const SEPARATOR = '\n----------------------------------------------------\n';

/** Prism's TokenStreamTransformer.simplify: [type, content] pairs, blank strings dropped. */
function simplify(stream) {
  return stream
    .map((token) => {
      if (typeof token === 'string') return token.trim() ? token : null;
      const content = Array.isArray(token.content)
        ? simplify(token.content)
        : typeof token.content === 'string'
          ? token.content
          : simplify([token.content]);
      return [token.type, content];
    })
    .filter((token) => token !== null);
}

test('requiring it after prismjs registers Prism.languages.bloom, and exports the refractor function', () => {
  assert.ok(Prism.languages.bloom);
  assert.equal(typeof bloom, 'function');
  assert.equal(bloom.name, 'bloom');
});

for (const name of readdirSync(cases).filter((file) => file.endsWith('.test'))) {
  test(`token stream: ${name}`, () => {
    const file = join(cases, name);
    const [code, expected] = readFileSync(file, 'utf8').split(SEPARATOR);
    const actual = simplify(Prism.tokenize(code, Prism.languages.bloom));
    if (process.env.UPDATE) {
      writeFileSync(file, `${code}${SEPARATOR}${JSON.stringify(actual, null, '\t')}\n`);
      return;
    }
    assert.deepEqual(actual, JSON.parse(expected));
  });
}

test('every keyword and 2.0 contextual keyword of the lexer is marked in the token streams', () => {
  const KEYWORD_TOKENS = new Set(['keyword', 'boolean', 'nil', 'self-keyword']);
  const marked = new Set();
  /** The words of every keyword-like token in `stream`, nested ones too. */
  const visit = (stream) => {
    for (const [type, content] of stream.filter(Array.isArray))
      if (typeof content !== 'string') visit(content);
      else if (KEYWORD_TOKENS.has(type)) for (const word of content.match(/\w+/g)) marked.add(word);
  };
  for (const name of readdirSync(cases).filter((file) => file.endsWith('.test')))
    visit(JSON.parse(readFileSync(join(cases, name), 'utf8').split(SEPARATOR)[1]));
  assert.deepEqual(
    ALL_KEYWORDS.filter((word) => !marked.has(word)),
    [],
  );
});

test("the language spec's ```bloom and 2.0 ```swift examples tokenize, keywords marked", () => {
  const spec = readFileSync(join(root, '../../docs/bloom-lang-spec.mdx'), 'utf8');
  const blocks = [...spec.matchAll(/^```(bloom|swift)\n([\s\S]*?)^```$/gm)].map((m) => m[2]);
  assert.ok(blocks.length >= 9);
  const KEYWORDS = new Set(
    'func fn struct class protocol extension switch guard match view let var return case import async await throws try public private static'.split(
      ' ',
    ),
  );
  /** The words of `stream` left as plain text, outside every token. */
  const plainWords = (stream) =>
    stream.flatMap((token) =>
      typeof token === 'string' ? (token.match(/\b[a-z]+\b/g) ?? []) : [],
    );
  for (const code of blocks) {
    const left = plainWords(Prism.tokenize(code, Prism.languages.bloom)).filter((w) =>
      KEYWORDS.has(w),
    );
    assert.deepEqual(left, [], `keywords left plain in:\n${code}`);
  }
});

test('a <script> after Prism registers bloom on the global Prism', () => {
  const context = { Prism: { languages: {} } };
  context.globalThis = context;
  vm.runInNewContext(readFileSync(join(root, 'prism-bloom.js'), 'utf8'), context);
  assert.ok(context.Prism.languages.bloom.keyword);
});
