#!/usr/bin/env node

/**
 * Changelog fragments. A feature PR never edits a CHANGELOG.md: it adds one
 * file to `changes/` per package it changes, and the release PR compiles them
 * into each package's CHANGELOG.md and deletes them. Many PRs building in the
 * merge queue at once used to edit the same `## Unreleased` lines and
 * conflicted with each other; a file of its own conflicts with nothing.
 *
 * A fragment is `changes/<topic>.md`:
 *
 *   ---
 *   package: '@oxy.so/bloom-language'
 *   bump: minor
 *   section: Added
 *   ---
 *
 *   - `.ownScreen()`: a `screen()` branch that is a surface of its own …
 *
 * `bump` is what the change asks of its package's next version (patch, minor
 * or major); `section` is the CHANGELOG heading it goes under. The body is one
 * or more list items, written as the CHANGELOG reads them.
 *
 * Usage:
 *   node scripts/changelog.mjs plan            each package's fragments and the version they ask for
 *   node scripts/changelog.mjs release         compile the fragments under each package's package.json
 *                                              version (bump the versions first) and delete them
 *   node scripts/changelog.mjs check [--base <rev>]
 *                                              CI: every fragment is well formed, and a CHANGELOG.md
 *                                              changes since <rev> (default HEAD^1) only with its
 *                                              package's version, that is, in a release, or by
 *                                              only removing lines (an entry moved to a fragment)
 *
 * See docs/releasing.mdx.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BUMPS = ['patch', 'minor', 'major'];

/** The headings a release section takes, in the order it lists them. */
export const SECTIONS = [
  'Compatibility',
  'Breaking',
  'Added',
  'Changed',
  'Deprecated',
  'Performance',
  'Documented',
  'Fixed',
];

export const FRAGMENTS_DIR = 'changes';
const CHANGELOG = 'CHANGELOG.md';
const VERSION_HEADING = /^## (\d+\.\d+\.\d+)\s*$/m;

/**
 * The packages a fragment can name: Bloom itself and every published package
 * directly under packages/ (not a private one, not the compiler's platform
 * packages, which follow the compiler and keep no CHANGELOG). Name -> its
 * directory, relative to root.
 */
export function changelogPackages(root) {
  const packages = new Map();
  const add = (dir) => {
    const manifest = join(root, dir, 'package.json');
    if (!existsSync(manifest)) return;
    const { name, private: isPrivate } = JSON.parse(readFileSync(manifest, 'utf8'));
    if (!isPrivate) packages.set(name, dir);
  };
  add('.');
  if (existsSync(join(root, 'packages')))
    for (const entry of readdirSync(join(root, 'packages'), { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    ))
      if (entry.isDirectory()) add(join('packages', entry.name));
  return packages;
}

const readChangelog = (root, dir) => {
  const path = join(root, dir, CHANGELOG);
  return existsSync(path) ? readFileSync(path, 'utf8') : '# Changelog\n\n';
};

/** Splits a fragment into its fields and body; throws with what is wrong. */
export function parseFragment(text, file) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text.replace(/\r\n/g, '\n'));
  if (!match)
    throw new Error(`${file}: starts with a --- block (package, bump, section), then the entry`);
  const fields = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    const field = /^(\w+):\s*(.*?)\s*$/.exec(line);
    if (!field) throw new Error(`${file}: "${line}" is not a "key: value" line`);
    fields[field[1]] = field[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  const body = match[2].trim();
  return {
    file,
    package: fields.package,
    bump: fields.bump,
    section: fields.section,
    body,
    fields,
  };
}

/** Every fragment in changes/, parsed and checked against the repository's packages. */
export function readFragments(root, packages = changelogPackages(root)) {
  const dir = join(root, FRAGMENTS_DIR);
  if (!existsSync(dir)) return { fragments: [], errors: [] };
  const fragments = [];
  const errors = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith('.md') || name === 'README.md') continue;
    const file = join(FRAGMENTS_DIR, name);
    let fragment;
    try {
      fragment = parseFragment(readFileSync(join(root, file), 'utf8'), file);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const problems = [];
    const unknown = Object.keys(fragment.fields).filter(
      (key) => !['package', 'bump', 'section'].includes(key),
    );
    if (unknown.length) problems.push(`unknown field ${unknown.join(', ')}`);
    if (!packages.has(fragment.package))
      problems.push(
        `package "${fragment.package ?? ''}" is none of ${[...packages.keys()].join(', ')}`,
      );
    if (!BUMPS.includes(fragment.bump))
      problems.push(`bump "${fragment.bump ?? ''}" is none of ${BUMPS.join(', ')}`);
    if (!SECTIONS.includes(fragment.section))
      problems.push(`section "${fragment.section ?? ''}" is none of ${SECTIONS.join(', ')}`);
    if (!fragment.body.startsWith('- ')) problems.push('the entry is a list item ("- …")');
    if (/^#/m.test(fragment.body))
      problems.push('the entry has no heading of its own (the section is a field)');
    if (problems.length) errors.push(`${file}: ${problems.join('; ')}`);
    else fragments.push(fragment);
  }
  return { fragments, errors };
}

const parseVersion = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
  if (!match) throw new Error(`"${version}" is not a plain x.y.z version`);
  return match.slice(1).map(Number);
};

export const compareVersions = (a, b) => {
  const [x, y] = [parseVersion(a), parseVersion(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

export function bumpVersion(version, bump) {
  const [major, minor, patch] = parseVersion(version);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** The package's newest released version: its CHANGELOG's first version heading. */
export const lastReleased = (changelog) => VERSION_HEADING.exec(changelog)?.[1];

/** Per package with fragments: its fragments, its last release, the version they ask for and its version now. */
export function plan(root) {
  const packages = changelogPackages(root);
  const { fragments, errors } = readFragments(root, packages);
  const byPackage = new Map();
  for (const fragment of fragments) {
    if (!byPackage.has(fragment.package)) byPackage.set(fragment.package, []);
    byPackage.get(fragment.package).push(fragment);
  }
  const releases = [];
  for (const [name, dir] of packages) {
    const own = byPackage.get(name);
    if (!own) continue;
    const changelog = readChangelog(root, dir);
    const version = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')).version;
    const last = lastReleased(changelog);
    const bump = BUMPS[Math.max(...own.map((fragment) => BUMPS.indexOf(fragment.bump)))];
    releases.push({
      name,
      dir,
      fragments: own,
      last,
      bump,
      wanted: last ? bumpVersion(last, bump) : version,
      version,
    });
  }
  return { releases, errors };
}

/** The release section a package's fragments compile to. */
export function releaseSection(release, beside = []) {
  const lines = [`## ${release.version}`, ''];
  if (beside.length) {
    const names = beside.map((other) => `\`${other.name}\` ${other.version}`);
    const list =
      names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
    lines.push(`${list} ${names.length === 1 ? 'ships' : 'ship'} beside it.`, '');
  }
  for (const section of SECTIONS) {
    const entries = release.fragments.filter((fragment) => fragment.section === section);
    if (!entries.length) continue;
    lines.push(`### ${section}`, '', ...entries.map((fragment) => fragment.body), '');
  }
  return lines.join('\n');
}

/** Writes every package's release section under its package.json version and deletes the fragments. */
export function release(root) {
  const { releases, errors } = plan(root);
  for (const entry of releases) {
    const changelog = readChangelog(root, entry.dir);
    if (/^## Unreleased\s*$/m.test(changelog))
      errors.push(
        `${join(entry.dir, CHANGELOG)} has an "## Unreleased" section: make its entries fragments first`,
      );
    if (new RegExp(`^## ${entry.version.replaceAll('.', '\\.')}\\s*$`, 'm').test(changelog))
      errors.push(
        `${entry.name} ${entry.version} is already released: bump its package.json version first`,
      );
    else if (compareVersions(entry.version, entry.wanted) < 0)
      errors.push(
        `${entry.name}: its fragments ask for a ${entry.bump} (${entry.wanted}), its package.json is ${entry.version}`,
      );
  }
  if (errors.length) return { releases, errors };
  const bloom = releases.find((entry) => entry.dir === '.');
  for (const entry of releases) {
    const path = join(root, entry.dir, CHANGELOG);
    const changelog = readChangelog(root, entry.dir);
    const beside = entry === bloom ? releases.filter((other) => other !== entry) : [];
    const section = releaseSection(entry, beside);
    const title = /^# .*\n+/.exec(changelog);
    const at = title ? title[0].length : 0;
    writeFileSync(
      path,
      `${changelog.slice(0, at)}${section}\n${changelog.slice(at)}`.replace(/\n+$/, '\n'),
    );
    for (const fragment of entry.fragments) rmSync(join(root, fragment.file));
  }
  return { releases, errors };
}

const git = (root, args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/**
 * CI: fragments are well formed, and since `base` a CHANGELOG.md changed only
 * where its package's version changed too (a release).
 */
export function check(root, base = 'HEAD^1') {
  const packages = changelogPackages(root);
  const { errors } = readFragments(root, packages);
  let changed;
  try {
    changed = git(root, ['diff', '--name-only', base, '--']).split('\n').filter(Boolean);
  } catch (error) {
    errors.push(
      `cannot diff against ${base} (a checkout needs fetch-depth: 2): ${error.stderr ?? error.message}`.trim(),
    );
    return { errors };
  }
  for (const [name, dir] of packages) {
    const path = join(dir, CHANGELOG);
    const manifest = join(dir, 'package.json');
    if (!changed.includes(path)) continue;
    const now = JSON.parse(readFileSync(join(root, manifest), 'utf8')).version;
    let before;
    try {
      before = JSON.parse(git(root, ['show', `${base}:${manifest}`])).version;
    } catch {
      before = undefined; // a new package: its first CHANGELOG is its first release
    }
    // Only removing lines (an old entry moved out into a fragment) adds nothing to the CHANGELOG.
    const [added] = git(root, ['diff', '--numstat', base, '--', path]).split('\t');
    if (before === now && added !== '0')
      errors.push(
        `${path} changed, but ${name} stays ${now}: only a release edits a CHANGELOG. Add a fragment instead, changes/<topic>.md (see changes/README.md).`,
      );
  }
  for (const [, dir] of packages) {
    const path = join(dir, CHANGELOG);
    if (/^## Unreleased\s*$/m.test(readChangelog(root, dir)))
      errors.push(`${path} has an "## Unreleased" section: its entries are fragments in changes/`);
  }
  return { errors };
}

function main([command = 'plan', ...args]) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const fail = (errors) => {
    for (const error of errors) console.error(`changelog: ${error}`);
    process.exit(1);
  };
  if (command === 'plan') {
    const { releases, errors } = plan(root);
    if (errors.length) fail(errors);
    if (!releases.length) console.log('changelog: no fragments in changes/');
    for (const entry of releases) {
      const state =
        entry.version === entry.last ? 'not bumped yet' : `package.json ${entry.version}`;
      console.log(
        `${entry.name}: ${entry.fragments.length} fragment(s), a ${entry.bump} from ${entry.last} -> ${entry.wanted} (${state})`,
      );
      for (const fragment of entry.fragments)
        console.log(`  ${fragment.section.padEnd(13)} ${fragment.file}`);
    }
  } else if (command === 'release') {
    const { releases, errors } = release(root);
    if (errors.length) fail(errors);
    if (!releases.length) console.log('changelog: no fragments in changes/');
    for (const entry of releases)
      console.log(
        `changelog: ${entry.name} ${entry.version}, ${entry.fragments.length} fragment(s) compiled into ${join(entry.dir, CHANGELOG)}`,
      );
  } else if (command === 'check') {
    const at = args.indexOf('--base');
    const { errors } = check(root, at === -1 ? undefined : args[at + 1]);
    if (errors.length) fail(errors);
    console.log(
      'changelog: fragments are well formed and no CHANGELOG.md changed outside a release',
    );
  } else {
    fail([`unknown command "${command}" (plan, release or check)`]);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2));
