// node --test checks/: what the Marketplace and Open VSX show, the editor's
// language configuration, and the compiler commands the client starts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url));
const manifest = JSON.parse(read('package.json'));
const config = JSON.parse(read('language-configuration.json'));
const { candidates } = require('../src/bloomc-path.js');

test('the listing: Bloom, the language by Oxy, with its icon, links and categories', () => {
  assert.equal(manifest.publisher, 'oxy');
  assert.equal(manifest.displayName, 'Bloom');
  assert.match(manifest.description, /^Bloom, the language by Oxy/);
  // Not an npm package: Oxy's npm release publishes every package that is not private.
  assert.equal(manifest.private, true);
  assert.equal(manifest.license, 'SEE LICENSE IN LICENSE');
  assert.equal(manifest.pricing, 'Free');
  for (const link of [manifest.homepage, manifest.bugs.url, manifest.qna])
    assert.match(link, /^https:\/\/github\.com\/OxyHQ\/Bloom\b/);
  assert.deepEqual(manifest.categories, [
    'Programming Languages',
    'Snippets',
    'Formatters',
    'Linters',
  ]);

  // A PNG of at least 128 by 128 (the Marketplace takes no SVG icon).
  const icon = read(manifest.icon);
  assert.equal(icon.subarray(1, 4).toString(), 'PNG');
  const [width, height] = [icon.readUInt32BE(16), icon.readUInt32BE(20)];
  assert.equal(width, height);
  assert.ok(width >= 128, `the icon is ${width}px`);
});

test('the README links only absolute URLs, which the listing can follow', () => {
  const readme = read('README.md').toString();
  for (const [, url] of readme.matchAll(/\]\(([^)]+)\)/g)) assert.match(url, /^https:\/\//);
  assert.doesNotMatch(readme, /<img|!\[/, 'no images: the Marketplace refuses most of them');
});

test('the language configuration', () => {
  const regex = (pattern) => new RegExp(pattern);
  const words = (text) => [...text.matchAll(new RegExp(config.wordPattern, 'g'))].map((m) => m[0]);
  assert.deepEqual(words('@State private var draft = $0.id + $draft #expect(1_000)'), [
    '@State',
    'private',
    'var',
    'draft',
    '$0',
    'id',
    '$draft',
    '#expect',
    '1_000',
  ]);
  assert.deepEqual(words('0xff 1.5 2e3'), ['0xff', '1.5', '2e3']);

  const { increaseIndentPattern, decreaseIndentPattern } = config.indentationRules;
  for (const line of [
    'struct Post {',
    '  HStack(',
    'case .ready(let n):',
    '  default:',
    'a { // b',
  ])
    assert.match(line, regex(increaseIndentPattern), line);
  for (const line of ['// a {', 'case loading', 'Text("{")', 'let x = 1'])
    assert.doesNotMatch(line, regex(increaseIndentPattern), line);
  for (const line of ['}', '  )', 'case let .failed(message):', 'default:', '} label: {'])
    assert.match(line, regex(decreaseIndentPattern), line);
  assert.doesNotMatch('  case loading', regex(decreaseIndentPattern));

  const docs = config.onEnterRules[0];
  assert.match('  /// A post.', regex(docs.beforeText));
  assert.doesNotMatch('  //// a rule', regex(docs.beforeText));
  assert.equal(docs.action.appendText, '/// ');
  assert.ok(config.autoClosingPairs.some((pair) => pair.open === '"""' && pair.close === '"""'));
});

test('the PATH serves bloomc, then bloom; a setting or the workspace, only itself', () => {
  assert.deepEqual(
    candidates({ command: 'bloomc', args: ['lsp'], from: 'path' }).map((c) => c.command),
    ['bloomc', 'bloom'],
  );
  const own = { command: '/x/bloom', args: ['lsp'], from: 'setting' };
  assert.deepEqual(candidates(own), [own]);
});
