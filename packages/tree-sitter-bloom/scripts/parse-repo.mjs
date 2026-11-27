// Parses every `.bloom` file tracked in the Bloom repository (the compiler's fixtures, the
// standard library, the examples, the editor fixtures) with this grammar, and fails on any
// ERROR or MISSING node: a construct bloomc reads that the grammar does not.
//
// `EXPECTED_ERRORS` are the files written to be broken (the parser's recovery fixture); each
// must still fail, so the list cannot hide a file that the grammar should read.
//
// Usage: node scripts/parse-repo.mjs  (the tree-sitter CLI is `TREE_SITTER`, else npx's).

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const grammar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: grammar,
  encoding: 'utf8',
}).trim();

const EXPECTED_ERRORS = new Set([
  'packages/bloom-language-compiler/crates/lang/tests/fixtures/check/recovery.bloom',
]);

const files = execFileSync('git', ['ls-files', '-z', '--', '*.bloom'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);
if (files.length === 0) {
  console.error('parse-repo: no .bloom files are tracked; is this the Bloom repository?');
  process.exit(1);
}

const [command, ...prefix] = process.env.TREE_SITTER
  ? [process.env.TREE_SITTER]
  : ['npx', '--yes', 'tree-sitter-cli@0.27.2'];

// A config of no parser directories, so the CLI reads nothing from the machine's own.
const scratch = mkdtempSync(path.join(tmpdir(), 'tree-sitter-bloom-'));
const config = path.join(scratch, 'config.json');
const list = path.join(scratch, 'paths.txt');
writeFileSync(config, JSON.stringify({ 'parser-directories': [] }));
writeFileSync(list, `${files.map((file) => path.join(root, file)).join('\n')}\n`);

const result = spawnSync(
  command,
  [
    ...prefix,
    'parse',
    '--config-path',
    config,
    '-p',
    grammar,
    '--paths',
    list,
    '--quiet',
    '--stat',
  ],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
rmSync(scratch, { recursive: true, force: true });
if (result.error) throw result.error;

// With `--quiet --stat`, the CLI prints one line per file it could not parse cleanly.
const failed = new Map();
for (const line of `${result.stdout}\n${result.stderr}`.split('\n')) {
  const match = /^(\S.*?\.bloom)\s+Parse:.*\((ERROR|MISSING)[^)]*\)/.exec(line);
  if (match) failed.set(path.relative(root, match[1]), line.trim());
}
if (!/Total parses: \d+/.test(result.stdout + result.stderr)) {
  console.error(result.stdout, result.stderr);
  console.error('parse-repo: the tree-sitter CLI printed no summary');
  process.exit(1);
}

const unexpected = [...failed.keys()].filter((file) => !EXPECTED_ERRORS.has(file));
const stale = [...EXPECTED_ERRORS].filter((file) => !failed.has(file));
for (const file of unexpected) console.error(`error: ${failed.get(file)}`);
for (const file of stale) {
  console.error(`error: ${file} is listed as broken but parses (remove it from EXPECTED_ERRORS)`);
}
if (unexpected.length > 0 || stale.length > 0) process.exit(1);
console.log(
  `parse-repo: ${files.length - failed.size} of ${files.length} .bloom files parse with no ERROR or MISSING node; ${failed.size} broken on purpose`,
);
