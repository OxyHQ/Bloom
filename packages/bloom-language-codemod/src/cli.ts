#!/usr/bin/env node
/**
 * bloom-language-codemod <app dir> [--css <entry>] [--write] [--out <dir>] [--package <name>=<dir>] [--fixtures]
 *
 * Reads every .tsx under <app dir> (tests and stories left out), converts what
 * converts exactly, and writes the report (`report.generated.json`, `report.md`) to
 * <out>. With `--write` the files are rewritten in place; without it the
 * converted files go to <out>/files. `--css` is the app's NativeWind entry
 * (default: global.css or styles/global.css); its theme is checked against
 * Bloom's for every class (see overrides.ts). `--package <name>=<dir>` resolves
 * a CSS package the app imports from a checkout of it (`@oxy.so/app-preset`)
 * when the app's own install does not hold it. `--fixtures` also writes the
 * parity corpus (<out>/corpus.generated.tsx, fixtures.generated.json and the
 * app's stylesheet app.generated.css), which the parity suites render from a
 * Bloom checkout.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { BEFORE_BLOOM, corpusModule } from './corpus';
import { overriddenClasses } from './overrides';
import { report } from './report';
import { loadTable } from './table';
import { packageCandidates, packageRoot, tailwind } from './tailwind';
import { type FileResult, transformSource } from './transform';

const IGNORED =
  /(\.stories\.|__tests__|__mocks__|\.test\.|\.spec\.|\/test\/|node_modules|\/examples\/|\.d\.ts$)/;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (IGNORED.test(path) || name.startsWith('.')) continue;
    if (statSync(path).isDirectory()) out.push(...files(path));
    else if (path.endsWith('.tsx')) out.push(path);
  }
  return out.sort();
}

function arg(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

const USAGE = `Usage: bloom-language-codemod <app dir> [options]

Moves the app's NativeWind className JSX and Bloom JSX to the Bloom language
where the result renders the same, and reports why the rest stays JSX.

Options:
  --out <dir>              where the report and converted files go
                           (default: <app dir>/.bloom-language-codemod)
  --write                  rewrite the app's files in place
  --css <entry>            the app's NativeWind CSS entry
                           (default: global.css or styles/global.css)
  --package <name>=<dir>   read a CSS package the app imports from <dir>
  --fixtures               also write the parity corpus (proven from a Bloom checkout)
  -h, --help               show this help
`;

async function main(): Promise<void> {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(USAGE);
    return;
  }
  const app = resolve(process.argv[2] ?? '.');
  if (!existsSync(app) || !statSync(app).isDirectory()) {
    process.stderr.write(`bloom-language-codemod: ${app} is not a directory\n\n${USAGE}`);
    process.exitCode = 1;
    return;
  }
  const out = resolve(arg('--out') ?? join(app, '.bloom-language-codemod'));
  const write = process.argv.includes('--write');
  const withFixtures = process.argv.includes('--fixtures');
  const cssEntry =
    arg('--css') ?? ['global.css', 'styles/global.css'].map((f) => join(app, f)).find(existsSync);
  const table = loadTable();
  const roots: Record<string, string> = {};
  process.argv.forEach((value, i) => {
    if (process.argv[i - 1] !== '--package') return;
    const [name, dir] = value.split('=');
    if (name && dir) roots[name] = resolve(dir);
  });
  const sources = files(app).map((path) => ({ path, source: readFileSync(path, 'utf8') }));

  // The classes the app writes, checked against Bloom's stylesheet first.
  const classes = new Set<string>();
  for (const { source } of sources)
    for (const result of [transformSource(source, { table })])
      for (const c of result.classes) classes.add(c);
  const overridden = cssEntry
    ? await overriddenClasses(readFileSync(cssEntry, 'utf8'), cssEntry, [...classes], roots)
    : new Set<string>();

  const results: { file: string; result: FileResult }[] = [];
  for (const { path, source } of sources) {
    const file = relative(app, path);
    let result: FileResult;
    try {
      result = transformSource(source, { table, overridden, fixtures: withFixtures, name: file });
    } catch (error) {
      console.error(`${file}: ${(error as Error).message}`);
      continue;
    }
    results.push({ file, result });
    if (!result.changed) continue;
    const target = write ? path : join(out, 'files', file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, result.code);
  }
  mkdirSync(out, { recursive: true });
  const { json, markdown } = report(results, { app, overridden });
  writeFileSync(join(out, 'report.generated.json'), `${JSON.stringify(json, null, 2)}\n`);
  writeFileSync(join(out, 'report.md'), markdown);
  if (withFixtures) {
    const fixtures = results.flatMap(({ result }) => result.fixtures);
    writeFileSync(join(out, 'fixtures.generated.json'), `${JSON.stringify(fixtures, null, 1)}\n`);
    writeFileSync(join(out, 'corpus.generated.tsx'), corpusModule(fixtures, out));
    // The app's classes in the corpus, and the before side's Bloom's own, which
    // the app compiles too (its `@source` over Bloom's lib). That Bloom is a
    // devDependency: the corpus is proven from a Bloom checkout.
    const before = packageRoot(BEFORE_BLOOM, [__dirname]);
    if (before === undefined)
      throw new Error(
        `--fixtures needs ${BEFORE_BLOOM} (Bloom 22, the before side's Bloom), which a Bloom checkout installs: run it there`,
      );
    const used = new Set([
      ...fixtures.flatMap((f) => f.classes),
      ...packageCandidates(join(before, 'lib/module')),
    ]);
    const css = cssEntry
      ? (await tailwind(readFileSync(cssEntry, 'utf8'), cssEntry, roots)).build([...used])
      : '';
    writeFileSync(join(out, 'app.generated.css'), css);
  }
  console.log(markdown.split('\n').slice(0, 14).join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
