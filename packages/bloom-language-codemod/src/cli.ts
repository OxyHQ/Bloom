#!/usr/bin/env bun
/**
 * bloom-language-codemod <app dir> [--css <entry>] [--write] [--out <dir>] [--fixtures]
 *
 * Reads every .tsx under <app dir> (tests and stories left out), converts what
 * converts exactly, and writes the report (`report.generated.json`, `report.md`) to
 * <out>. With `--write` the files are rewritten in place; without it the
 * converted files go to <out>/files. `--css` is the app's NativeWind entry
 * (default: global.css or styles/global.css); its theme is checked against
 * Bloom's for every class (see overrides.ts). `--fixtures` writes the parity
 * corpus (<out>/corpus.generated.tsx, fixtures.generated.json and the app's stylesheet app.generated.css).
 * `--package <name>=<dir>` resolves a CSS package the app installs and Bloom
 * does not (`@oxy.so/app-preset`) from a checkout of it.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { corpusModule } from './corpus';
import { overriddenClasses } from './overrides';
import { report } from './report';
import { loadTable } from './table';
import { tailwind } from './tailwind';
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

async function main(): Promise<void> {
  const app = resolve(process.argv[2] ?? '.');
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
    const used = new Set(fixtures.flatMap((f) => f.classes));
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
