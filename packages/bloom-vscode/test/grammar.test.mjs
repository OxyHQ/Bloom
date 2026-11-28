// node --test test/: the TextMate grammar, run through the engine VS Code uses
// (vscode-textmate on the Oniguruma Wasm build), against the scope assertions
// written into the fixtures (their form: scope-fixtures.mjs).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import oniguruma from 'vscode-oniguruma';
import textmate from 'vscode-textmate';
import { ALL_KEYWORDS, CONTEXTUAL_KEYWORDS, KEYWORDS as LEXER_KEYWORDS } from './keywords.mjs';
import {
  FIXTURES,
  failuresOf,
  fixtureNames,
  KEYWORD_SCOPE,
  readFixture,
} from './scope-fixtures.mjs';

const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const fixtures = FIXTURES;

const wasm = readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
const registry = new textmate.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
    createOnigString: (text) => new oniguruma.OnigString(text),
  }),
  loadGrammar: async (scopeName) =>
    scopeName === 'source.bloom'
      ? textmate.parseRawGrammar(
          readFileSync(join(root, 'syntaxes/bloom.tmLanguage.json'), 'utf8'),
          'bloom.tmLanguage.json',
        )
      : null,
});
const grammar = await registry.loadGrammar('source.bloom');

/** The scopes at each column of each of `lines`, tokenized in order from the initial state. */
function columnsOf(lines) {
  let state = textmate.INITIAL;
  return lines.map((line) => {
    const { tokens, ruleStack } = grammar.tokenizeLine(line, state);
    state = ruleStack;
    const columns = [];
    for (const token of tokens)
      for (let column = token.startIndex; column < token.endIndex; column++)
        columns[column] = token.scopes;
    return columns;
  });
}

for (const name of fixtureNames()) {
  test(`scopes in ${name}`, () => {
    const fixture = readFixture(name);
    const columns = columnsOf(fixture.code.map((line) => line.text));
    assert.deepEqual(failuresOf(name, fixture, columns), []);
  });
}

test('every keyword and 2.0 contextual keyword of the lexer is marked in the fixtures', () => {
  const marked = new Set();
  for (const name of fixtureNames()) {
    const { code } = readFixture(name);
    let state = textmate.INITIAL;
    for (const { text } of code) {
      const { tokens, ruleStack } = grammar.tokenizeLine(text, state);
      state = ruleStack;
      for (const token of tokens)
        if (token.scopes.some((scope) => KEYWORD_SCOPE.test(scope)))
          for (const word of text.slice(token.startIndex, token.endIndex).match(/\w+/g) ?? [])
            marked.add(word);
    }
  }
  assert.deepEqual(
    ALL_KEYWORDS.filter((word) => !marked.has(word)),
    [],
  );
});

test('every repository rule the grammar names exists', () => {
  const raw = JSON.parse(readFileSync(join(root, 'syntaxes/bloom.tmLanguage.json'), 'utf8'));
  const names = new Set(Object.keys(raw.repository));
  const missing = [];
  const visit = (node) => {
    if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === 'object')
      for (const [key, value] of Object.entries(node)) {
        if (key === 'include' && value.startsWith('#') && !names.has(value.slice(1)))
          missing.push(value);
        visit(value);
      }
  };
  visit(raw);
  assert.deepEqual(missing, []);
});

test('every fixture closes every rule it opens', () => {
  for (const name of fixtureNames()) {
    let state = textmate.INITIAL;
    for (const line of readFileSync(join(fixtures, name), 'utf8').split('\n'))
      state = grammar.tokenizeLine(line, state).ruleStack;
    assert.equal(state.depth, 1, `${name} ends inside a rule`);
  }
});

// Words the lexer reads as keywords (`bloom_lang::KEYWORDS`) and the 2.0 contextual ones
// (`bloom_lang::CONTEXTUAL_KEYWORDS`): none may be left as plain text. (`actor` is one only before
// a type's name, and the standard library names values `actor`.)
const KEYWORDS = new Set([
  ...LEXER_KEYWORDS,
  ...CONTEXTUAL_KEYWORDS.filter((word) => word !== 'actor'),
  ...'mutating where Self extern'.split(' '),
]);
const repo = join(root, '../..');

/** The problems of one piece of Bloom: rules left open, illegal text, unscoped keywords. */
function problemsOf(source, where) {
  const problems = [];
  let state = textmate.INITIAL;
  source.split('\n').forEach((line, index) => {
    const { tokens, ruleStack } = grammar.tokenizeLine(line, state);
    state = ruleStack;
    for (const token of tokens) {
      const text = line.slice(token.startIndex, token.endIndex);
      const at = `${where}:${index + 1}:${token.startIndex + 1}`;
      if (token.scopes.some((scope) => scope.startsWith('invalid.')))
        problems.push(`${at} ${JSON.stringify(text)} is invalid`);
      if (token.scopes.some((scope) => /^(comment|string)\./.test(scope))) continue;
      for (const word of text.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [])
        if (
          KEYWORDS.has(word) &&
          token.scopes.every((s) => s === 'source.bloom' || s.startsWith('meta.'))
        )
          problems.push(`${at} keyword ${JSON.stringify(word)} is unscoped`);
    }
  });
  if (state.depth !== 1) problems.push(`${where} ends inside a rule`);
  return problems;
}

test('every Bloom (and 2.0 swift) code block of the language spec highlights', () => {
  const spec = readFileSync(join(repo, 'docs/bloom-lang-spec.mdx'), 'utf8');
  const blocks = [...spec.matchAll(/^```(bloom|swift)\n([\s\S]*?)^```$/gm)];
  assert.ok(blocks.length >= 9, `the spec has ${blocks.length} bloom/swift blocks`);
  const problems = blocks.flatMap((block) => {
    const line = spec.slice(0, block.index).split('\n').length + 1;
    return problemsOf(block[2], `bloom-lang-spec.mdx:${line}+${block[1]}`);
  });
  assert.deepEqual(problems, []);
});

/** Every .bloom file under `dir`, recursively. */
function bloomFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : bloomFiles(path);
    return entry.name.endsWith('.bloom') ? [path] : [];
  });
}

test("the compiler's standard library, examples and fixtures highlight", () => {
  const compiler = join(repo, 'packages/bloom-language-compiler');
  // The parser's recovery fixture is unbalanced on purpose.
  const files = bloomFiles(compiler).filter((file) => !file.endsWith('check/recovery.bloom'));
  assert.ok(files.length > 100, `found ${files.length} .bloom files`);
  const problems = files.flatMap((file) =>
    problemsOf(readFileSync(file, 'utf8'), file.slice(compiler.length + 1)),
  );
  assert.deepEqual(problems, []);
});
