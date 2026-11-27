// node --test checks/: the snippets are well formed, and each one, expanded as
// VS Code inserts it with its defaults, is Bloom the compiler accepts.
//
// The compiler is the addon built from this checkout (`bun run build:addon` in
// packages/bloom-language-compiler; CI builds it before this runs). Without it
// the compiler's half is skipped locally, and fails in CI.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const snippets = JSON.parse(
  readFileSync(new URL('../snippets/bloom.json', import.meta.url), 'utf8'),
);
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** What a snippet variable expands to here (VS Code fills it from the editor). */
const VARIABLES = { TM_FILENAME_BASE: 'Greeting' };

/**
 * A snippet body as VS Code inserts it with every placeholder left at its
 * default: TextMate snippet syntax (tabstops `$1`, placeholders `${1:x}`,
 * choices `${1|a,b|}`, variables `$NAME`/`${NAME:x}`, and `\` escaping `$`,
 * `}` and `\`). A bare `$n` mirrors placeholder n's default.
 */
export function expand(body) {
  const defaults = new Map();
  const mirrors = [];
  let i = 0;
  const parse = (until) => {
    let out = '';
    while (i < body.length) {
      const c = body[i];
      if (until?.includes(c)) return out;
      if (c === '\\' && '$}\\,|'.includes(body[i + 1] ?? '')) {
        out += body[i + 1];
        i += 2;
        continue;
      }
      if (c !== '$') {
        out += c;
        i += 1;
        continue;
      }
      const bare = /^\$(\d+|[A-Z_]+)/.exec(body.slice(i));
      if (bare) {
        i += bare[0].length;
        if (/^\d+$/.test(bare[1])) {
          const mark = `\uE000${mirrors.length}\uE000`;
          mirrors.push(bare[1]);
          out += mark;
        } else out += VARIABLES[bare[1]] ?? '';
        continue;
      }
      const open = /^\$\{(\d+|[A-Z_]+)([:|}])/.exec(body.slice(i));
      if (!open) {
        out += c;
        i += 1;
        continue;
      }
      i += open[0].length;
      const [, name, kind] = open;
      let value = '';
      if (kind === ':') {
        value = parse('}');
        i += 1;
      } else if (kind === '|') {
        value = parse(',|');
        while (body[i] !== '|') {
          i += 1;
          parse(',|');
        }
        i += 2; // `|}`
      }
      if (/^\d+$/.test(name)) {
        if (!defaults.has(name) || kind !== '}') defaults.set(name, value);
        out += kind === '}' ? `\uE000${mirrors.push(name) - 1}\uE000` : value;
      } else out += VARIABLES[name] ?? value;
    }
    assert.equal(until, undefined, `unterminated placeholder in ${JSON.stringify(body)}`);
    return out;
  };
  return parse().replace(/\uE000(\d+)\uE000/g, (_, n) => defaults.get(mirrors[n]) ?? '');
}

/**
 * Where a snippet is typed: at the top of a file (the default), among a view's
 * members, or in a function's body. The host declares what the defaults name.
 */
const HOSTS = {
  member: (code) =>
    `struct Host: View {\n${code}\n\n  var body: some View {\n    Text("")\n  }\n}\n`,
  statement: (code) => `func host(value: Int?, items: [Int]) async throws {\n${code}\n}\n`,
  extension: (code) => `struct Post {\n  let likes: Int\n}\n\n${code}\n`,
};
const WHERE = {
  State: 'member',
  Binding: 'member',
  Switch: 'statement',
  'Guard let': 'statement',
  'If let': 'statement',
  'Do catch': 'statement',
  'For in': 'statement',
  Task: 'statement',
  Extension: 'extension',
};
/** A test belongs to a `.tests` target (B0823 elsewhere), which a lone file is not. */
const PARSE_ONLY = new Set(['Test']);

const source = (name) =>
  (HOSTS[WHERE[name]] ?? ((code) => `${code}\n`))(expand(snippets[name].body.join('\n')));

test('the expander follows VS Code: defaults, choices, mirrors, variables and escapes', () => {
  const cases = [
    // biome-ignore lint/suspicious/noTemplateCurlyInString: snippet syntax, not a template
    ['a ${1:x} ${2|p,q|} $1 ${TM_FILENAME_BASE:N} \\$0 $0', 'a x p x Greeting $0 '],
    // biome-ignore lint/suspicious/noTemplateCurlyInString: snippet syntax, not a template
    ['${1:${TM_FILENAME_BASE:N}}', 'Greeting'],
    // biome-ignore lint/suspicious/noTemplateCurlyInString: snippet syntax, not a template
    ['${1:f(${2:a})} $2', 'f(a) a'],
  ];
  for (const [body, inserted] of cases) assert.equal(expand(body), inserted);
});

test('every snippet is well formed and contributed', () => {
  assert.deepEqual(manifest.contributes.snippets, [
    { language: 'bloom', path: './snippets/bloom.json' },
  ]);
  const prefixes = new Set();
  for (const [name, snippet] of Object.entries(snippets)) {
    assert.ok(Array.isArray(snippet.body) && snippet.body.length > 0, `${name}: body`);
    for (const line of snippet.body) assert.equal(typeof line, 'string', `${name}: body line`);
    assert.ok(snippet.description, `${name}: description`);
    for (const prefix of [snippet.prefix].flat()) {
      assert.ok(!prefixes.has(prefix), `${name}: prefix "${prefix}" is taken`);
      prefixes.add(prefix);
    }
    // Indentation is tabs, which VS Code turns into the editor's own.
    for (const line of snippet.body)
      assert.doesNotMatch(line, /^ +\S/, `${name}: indents with spaces`);
  }
});

let compiler;
try {
  compiler = require('../../bloom-language-compiler/js/native.js');
} catch (error) {
  if (process.env.CI) throw error;
}

for (const name of Object.keys(snippets)) {
  test(`the ${name} snippet compiles`, { skip: !compiler && 'no compiler addon built' }, () => {
    const code = source(name);
    const file = 'Snippet.bloom';
    const parsed = compiler.formatBloom(code, file);
    assert.deepEqual(
      parsed.diagnostics.map((d) => d.rendered),
      [],
      `${name} does not parse:\n${code}`,
    );
    if (PARSE_ONLY.has(name)) return;
    const checked = compiler.checkBloom(code, file);
    assert.deepEqual(
      [...checked.diagnostics, ...checked.warnings].map((d) => d.rendered),
      [],
      `${name} does not check:\n${code}`,
    );
  });
}

test('the README example compiles', { skip: !compiler && 'no compiler addon built' }, () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const examples = [...readme.matchAll(/^```swift\n([\s\S]*?)^```$/gm)].map((m) => m[1]);
  assert.equal(examples.length, 1);
  const checked = compiler.checkBloom(examples[0], 'Counter.bloom');
  assert.deepEqual(
    [...checked.diagnostics, ...checked.warnings].map((d) => d.rendered),
    [],
  );
});
