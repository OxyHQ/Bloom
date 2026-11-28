// The scope fixtures of Bloom's TextMate grammar (test/fixtures/*.bloom), read the same way by
// every engine that runs the grammar: vscode-textmate here, Shiki's two regex engines in
// packages/bloom-tmlanguage.
//
// An assertion line is a `//` comment whose first mark is `^` or `<-`:
//   `//   ^^^ scope.a scope.b`  every `^` column of the source line above has both scopes;
//   `// <--- scope`            columns 0 to 2 (one per `-`) have it.
// Assertion lines are not tokenized; the grammar state runs on across them.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FIXTURES = new URL('fixtures/', import.meta.url).pathname;

/**
 * The fixture files, by name: `.bloom`, and `.bloom-next` for syntax an open pull request adds to
 * the compiler (packages/tree-sitter-bloom/scripts/parse-repo.mjs renames it once it lands).
 */
export const fixtureNames = () =>
  readdirSync(FIXTURES)
    .filter((file) => file.endsWith('.bloom') || file.endsWith('.bloom-next'))
    .sort();

const ASSERTION = /^\s*\/\/\s*(?=\^|<-)/;

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

/**
 * A fixture split into its code (the lines an engine tokenizes, in order) and its assertions,
 * each naming the index of the code line it is about.
 */
export function readFixture(name) {
  const code = [];
  const assertions = [];
  readFileSync(join(FIXTURES, name), 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (code.length && ASSERTION.test(line))
        assertions.push({ ...parseAssertion(line), code: code.length - 1 });
      else code.push({ text: line, line: index + 1 });
    });
  return { code, assertions };
}

/**
 * The failed assertions of fixture `name`, given `columns[i][c]`, the scopes at column `c` of
 * code line `i` as the engine under test tokenized them.
 */
export function failuresOf(name, { code, assertions }, columns) {
  const failures = [];
  for (const { columns: marked, scopes, code: at } of assertions) {
    const source = code[at];
    for (const column of marked)
      for (const scope of scopes) {
        const has = columns[at][column] ?? [];
        if (!has.includes(scope))
          failures.push(
            `${name}:${source.line}:${column + 1} ${JSON.stringify(source.text.slice(column, column + 12))} lacks ${scope}; has ${has.filter((s) => s !== 'source.bloom').join(' ') || '(nothing)'}`,
          );
      }
  }
  return failures;
}

/** The scope prefixes that mark a word as a keyword, a literal or `self`. */
export const KEYWORD_SCOPE = /^(keyword|storage|constant\.language|variable\.language)\./;
