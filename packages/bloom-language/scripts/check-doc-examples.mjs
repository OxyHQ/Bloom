#!/usr/bin/env node
/**
 * The guides' examples compile. Every code block marked `check` in the
 * language guides (```tsx check) is a module of its own: this script writes
 * each to `.doc-examples/`, runs the language compiler over it (the spec's
 * checks: modifiers, tokens, arity, the Liquid Glass rules; a warning fails
 * too, since an example shows the rules kept) and then TypeScript over all of
 * them, against the package's source. A guide that drifts from the language
 * fails here, so an agent copying an example copies code that builds.
 *
 * Run after the compiler's addon is built (`bun run build:addon` in
 * packages/bloom-language-compiler); `--no-compiler` runs TypeScript alone.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const repoRoot = join(packageRoot, '../..');
const require = createRequire(join(packageRoot, 'package.json'));

/** The guides whose examples are held to compile. */
const GUIDES = [
  'bloom-language-getting-started.mdx',
  'bloom-language-tour.mdx',
  'bloom-language-from-jsx.mdx',
  'bloom-language-for-agents.mdx',
];

const out = join(packageRoot, '.doc-examples');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const examples = [];
for (const guide of GUIDES) {
  const text = readFileSync(join(repoRoot, 'docs', guide), 'utf8');
  const fence = /^```(tsx?) check\n([\s\S]*?)^```$/gm;
  for (const match of text.matchAll(fence)) {
    const line = text.slice(0, match.index).split('\n').length;
    const name = `${guide.replace(/\.mdx$/, '')}-${line}.${match[1]}`;
    writeFileSync(join(out, name), match[2]);
    examples.push({ guide, line, name, source: match[2] });
  }
}
if (examples.length === 0) throw new Error('No checked examples found in the language guides');

const failures = [];
if (!process.argv.includes('--no-compiler')) {
  // The addon's loader itself (its `/compile` entry stops at the first error and only prints warnings).
  const compiler = dirname(require.resolve('@oxy.so/bloom-language-compiler/package.json'));
  const { compile } = require(join(compiler, 'js/native.js'));
  for (const example of examples) {
    const output = compile(example.source, join(out, example.name));
    for (const problem of [...output.diagnostics, ...(output.warnings ?? [])]) {
      failures.push(`docs/${example.guide}:${example.line + problem.line}\n${problem.rendered}`);
    }
  }
}

writeFileSync(
  join(out, 'tsconfig.json'),
  JSON.stringify(
    {
      extends: '../tsconfig.json',
      compilerOptions: {
        noEmit: true,
        paths: {
          '@oxy.so/bloom-language': ['../src/index.ts'],
          '@oxy.so/bloom-language/router': ['../src/router/index.ts'],
          '@oxy.so/bloom-language/screen-host': ['../src/screen-host.ts'],
          '@oxy.so/bloom-language/*': ['../src/entries/*.ts'],
          '@oxy.so/bloom-data': ['../../bloom-data/src/index.ts'],
        },
      },
      include: ['./*.ts', './*.tsx'],
    },
    null,
    2,
  ),
);
try {
  execFileSync(
    process.execPath,
    [require.resolve('typescript/bin/tsc'), '-p', join(out, 'tsconfig.json')],
    {
      cwd: out,
      stdio: 'pipe',
    },
  );
} catch (error) {
  // Point TypeScript's errors at the guide's own lines.
  const report = String(error.stdout).replace(
    /^([a-z-]+)-(\d+)\.tsx?\((\d+),(\d+)\)/gm,
    (_, guide, line, row, column) => `docs/${guide}.mdx:${Number(line) + Number(row)}:${column}`,
  );
  failures.push(report.trim());
}

if (failures.length) {
  console.error(`The language guides' examples do not compile:\n\n${failures.join('\n\n')}`);
  process.exit(1);
}
console.log(`${examples.length} guide examples compile`);
