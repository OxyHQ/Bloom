// node --test test/: the TextMate grammar, run through the engine VS Code uses
// (vscode-textmate on the Oniguruma Wasm build), against the scope assertions
// written into the fixtures.
//
// An assertion line is a `//` comment whose first mark is `^` or `<-`:
//   `//   ^^^ scope.a scope.b`  every `^` column of the source line above has both scopes;
//   `// <--- scope`            columns 0 to 2 (one per `-`) have it.
// Assertion lines are not tokenized; the grammar state runs on across them.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import oniguruma from 'vscode-oniguruma';
import textmate from 'vscode-textmate';

const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const fixtures = join(root, 'test/fixtures');

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

const ASSERTION = /^\s*\/\/\s*(?=\^|<-)/;

/** The scopes at each column of a line, and the state after it. */
function scopesOf(line, state) {
  const { tokens, ruleStack } = grammar.tokenizeLine(line, state);
  const columns = [];
  for (const token of tokens)
    for (let column = token.startIndex; column < token.endIndex; column++)
      columns[column] = token.scopes;
  return { columns, state: ruleStack };
}

/** The columns an assertion line marks, and the scopes it asserts. */
function parseAssertion(line) {
  const start = line.indexOf('//') + 2;
  const rest = line.slice(start);
  const arrow = /^\s*<(-+)\s+(.*)$/.exec(rest);
  if (arrow)
    return { columns: [...arrow[1]].map((_, i) => i), scopes: arrow[2].trim().split(/\s+/) };
  const columns = [];
  let index = start;
  while (index < line.length && /[\s^]/.test(line[index])) {
    if (line[index] === '^') columns.push(index);
    index++;
  }
  return { columns, scopes: line.slice(index).trim().split(/\s+/) };
}

for (const name of readdirSync(fixtures).filter((file) => file.endsWith('.bloom'))) {
  test(`scopes in ${name}`, () => {
    const lines = readFileSync(join(fixtures, name), 'utf8').split('\n');
    let state = textmate.INITIAL;
    let source = null;
    let checked = 0;
    const failures = [];
    lines.forEach((line, index) => {
      if (source && ASSERTION.test(line)) {
        const { columns, scopes } = parseAssertion(line);
        for (const column of columns)
          for (const scope of scopes) {
            checked++;
            const at = source.columns[column] ?? [];
            if (!at.includes(scope))
              failures.push(
                `${name}:${source.line}:${column + 1} ${JSON.stringify(source.text.slice(column, column + 12))} lacks ${scope}; has ${at.slice(1).join(' ') || '(nothing)'}`,
              );
          }
        return;
      }
      const result = scopesOf(line, state);
      state = result.state;
      source = { columns: result.columns, text: line, line: index + 1 };
    });
    assert.ok(checked > 0, 'the fixture asserts nothing');
    assert.deepEqual(failures, []);
  });
}

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
