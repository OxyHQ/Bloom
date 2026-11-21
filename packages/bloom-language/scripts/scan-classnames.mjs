#!/usr/bin/env node
/**
 * Counts the `className` utilities the Oxy apps write, for the className
 * table (`generate-classnames.mjs`). Read-only: each repository under
 * `~/Oxy` is read at its default branch (`origin/HEAD`) with `git grep` and
 * `git cat-file`, never its working tree, so a checkout's state does not
 * count. Run `git fetch` in the repositories first for a current snapshot.
 *
 *   node scripts/scan-classnames.mjs [~/Oxy]
 *
 * Writes `codemod/classname-usage.json`: per utility (variant prefixes
 * stripped), how often it is written and in which apps, and per variant prefix
 * how often it is written. Stories, tests and examples are left out, and so
 * are the repositories that are not Bloom product apps.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '../codemod/classname-usage.json');
const OXY = process.argv[2] ?? join(homedir(), 'Oxy');

/** Not product apps: Bloom itself, the site, forks, and repositories with no Bloom dependency. */
const SKIP = new Set([
  'Bloom',
  'website',
  'docs',
  'examples',
  'BloomAiIcons',
  'expo',
  'react-native',
  'react-native-screens',
  'GWJ',
]);
const IGNORED_FILE = /(\.stories\.|__tests__|\.test\.|\/test\/|node_modules|\/examples\/)/;
const TOKEN = /^[!\-\w[\]:/.#%()]+$/;
const VARIANT = /^((?:[\w-]+|\[[^\]]+\]):)+/;

const git = (repo, args, input) =>
  execFileSync('git', ['-C', repo, ...args], {
    input,
    maxBuffer: 1 << 30,
    stdio: ['pipe', 'pipe', 'ignore'],
  });

/** The repository's default branch: `origin/HEAD`, else `origin/main` or `origin/master`. */
function defaultRef(repo) {
  try {
    return git(repo, ['symbolic-ref', '-q', '--short', 'refs/remotes/origin/HEAD'])
      .toString()
      .trim();
  } catch {}
  for (const ref of ['origin/main', 'origin/master']) {
    try {
      git(repo, ['rev-parse', '-q', '--verify', ref]);
      return ref;
    } catch {}
  }
  return null;
}

/** Every string literal of a `className=` attribute: the quoted value, or each literal in its expression. */
function* classStrings(text) {
  let at = 0;
  for (;;) {
    at = text.indexOf('className=', at);
    if (at < 0) return;
    at += 'className='.length;
    const open = text[at];
    if (open === '"' || open === "'") {
      const end = text.indexOf(open, at + 1);
      if (end > 0) yield text.slice(at + 1, end);
    } else if (open === '{') {
      let depth = 0;
      let end = at;
      for (; end < text.length; end++) {
        if (text[end] === '{') depth++;
        else if (text[end] === '}' && --depth === 0) break;
      }
      const expression = text.slice(at + 1, end);
      for (const match of expression.matchAll(/(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g))
        yield match[2].replace(/\$\{[^}]*\}/g, ' ');
    }
  }
}

const utilities = new Map();
const variants = new Map();
const apps = {};
for (const name of readdirSync(OXY).sort()) {
  const repo = join(OXY, name);
  if (name.startsWith('.') || SKIP.has(name) || !existsSync(join(repo, '.git'))) continue;
  const ref = defaultRef(repo);
  if (!ref) continue;
  let files;
  try {
    files = git(repo, ['grep', '-l', 'className=', ref, '--', '*.tsx', '*.jsx'])
      .toString()
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(line.indexOf(':') + 1))
      .filter((file) => !IGNORED_FILE.test(file));
  } catch {
    files = [];
  }
  if (files.length === 0) continue;
  const commit = git(repo, ['rev-parse', '--short', ref]).toString().trim();
  const batch = git(
    repo,
    ['cat-file', '--batch'],
    files.map((file) => `${ref}:${file}\n`).join(''),
  );
  let count = 0;
  let at = 0;
  while (at < batch.length) {
    const newline = batch.indexOf(10, at);
    const size = Number(batch.subarray(at, newline).toString().split(' ')[2]);
    const body = batch.subarray(newline + 1, newline + 1 + size).toString('utf8');
    at = newline + 1 + size + 1;
    for (const text of classStrings(body)) {
      for (const token of text.split(/\s+/)) {
        if (!TOKEN.test(token)) continue;
        count++;
        const prefix = VARIANT.exec(token)?.[0] ?? '';
        const base = token.slice(prefix.length).replace(/^!/, '');
        const entry = utilities.get(base) ?? { count: 0, apps: new Set() };
        entry.count++;
        entry.apps.add(name);
        utilities.set(base, entry);
        for (const variant of prefix.split(':').filter(Boolean))
          variants.set(variant, (variants.get(variant) ?? 0) + 1);
      }
    }
  }
  apps[name] = { ref, commit, files: files.length, utilities: count };
}

const sorted = (map, value) =>
  Object.fromEntries([...map].sort((a, b) => value(b[1]) - value(a[1]) || (a[0] < b[0] ? -1 : 1)));
writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      $comment: 'GENERATED by scripts/scan-classnames.mjs from each app at its default branch.',
      apps,
      variants: sorted(variants, (n) => n),
      utilities: Object.fromEntries(
        Object.entries(sorted(utilities, (entry) => entry.count)).map(([key, entry]) => [
          key,
          { count: entry.count, apps: [...entry.apps].sort() },
        ]),
      ),
    },
    null,
    1,
  )}\n`,
);
console.log(`${Object.keys(apps).length} apps, ${utilities.size} utilities → ${OUT}`);
