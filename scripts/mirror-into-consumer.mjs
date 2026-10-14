#!/usr/bin/env node
/**
 * Live-edit Bloom inside a consumer app, without publishing.
 *
 *   node scripts/mirror-into-consumer.mjs <consumer-root> [--into=<dir>] [--watch]
 *   node scripts/mirror-into-consumer.mjs <consumer-root> --restore
 *
 * Mirrors this checkout's SOURCE into `<consumer-root>/bloom-local/` and points every
 * `node_modules/@oxy.so/bloom` under the consumer at it, so Metro serves what you edit here.
 * With `--watch` an edit under `src/` reaches the consumer in a moment; `--restore` puts the
 * published copies back.
 *
 * The mirror must sit inside what the consumer's Metro watches (its `projectRoot` or a
 * `watchFolders` entry), or Metro serves each file once and never sees an edit: pass `--into`.
 *
 * The folder is `bloom-local`, not dot-prefixed: Metro's file watcher ignores dot-directories, so
 * a `.bloom-local` is served once and every later edit is silently never seen.
 *
 * Why a mirror inside the consumer, not a symlink to this checkout: Metro only indexes the
 * project root and its watch folders, and a Bloom living elsewhere would resolve `react`,
 * `react-native` and every other peer from its OWN node_modules — two copies of React. Inside
 * the consumer, Bloom's bare imports resolve from the consumer's tree, exactly as an installed
 * copy's do.
 *
 * While mirrored the consumer's `tsc` reads Bloom's SOURCE (the map has no `types` entries) and
 * reports errors in it that the published `.d.ts` never do; run `--restore` before a typecheck
 * you mean to trust.
 *
 * Why the exports are rewritten: the shipped map sends web to the BUILT `lib/` for the forked
 * families (`browser` condition), which would never show an edit. The mirror's map sends every
 * condition to `src/`, the web fork to its `index.web.ts` barrel.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
  lstatSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOOM = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [, , consumerArg, ...flags] = process.argv;
const into = flags.find((flag) => flag.startsWith('--into='))?.slice('--into='.length);
if (!consumerArg) {
  console.error('usage: mirror-into-consumer.mjs <consumer-root> [--watch | --restore]');
  process.exit(1);
}
const CONSUMER = resolve(consumerArg);
// Where Metro WATCHES: a folder outside its `projectRoot` and `watchFolders` is read once and then
// never seen to change. `--into=packages/app` for a monorepo whose watch folders are its packages.
const MIRROR = join(into ? resolve(CONSUMER, into) : CONSUMER, 'bloom-local');
const KEPT = '.bloom-published';

/** Every `node_modules/@oxy.so/bloom` under the consumer (root and each workspace package). */
function bloomInstalls(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'bloom-local') continue;
    const full = join(dir, name);
    let stat;
    try {
      stat = lstatSync(full);
    } catch {
      continue;
    }
    if (name === 'node_modules') {
      const target = join(full, '@oxy.so', 'bloom');
      if (existsSync(target) || isLink(target)) found.push(target);
      continue;
    }
    if (stat.isDirectory() && depth(full) <= 3) bloomInstalls(full, found);
  }
  return found;
}
const depth = (dir) => relative(CONSUMER, dir).split('/').length;
const isLink = (p) => {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
};

if (flags.includes('--restore')) {
  for (const install of bloomInstalls(CONSUMER)) {
    const kept = join(dirname(install), KEPT);
    if (isLink(install) && existsSync(kept)) {
      unlinkSync(install);
      renameSync(kept, install);
      console.log(`restored ${relative(CONSUMER, install)}`);
    }
  }
  rmSync(MIRROR, { recursive: true, force: true });
  process.exit(0);
}

const EXCLUDED =
  /(^|\/)(__tests__|__fixtures__|__mocks__|node_modules)(\/|$)|\.(stories|test|spec)\.[^/]+$/;
const keep = (path) => !EXCLUDED.test(relative(BLOOM, path));

/** The shipped map, with every condition sent to `src/` so an edit is what is served. */
function mirroredPackage() {
  const pkg = JSON.parse(readFileSync(join(BLOOM, 'package.json'), 'utf8'));
  const toSrc = (libPath) => {
    const base = libPath.replace(/^\.\/lib\/(module|commonjs)\//, './src/').replace(/\.js$/, '');
    for (const ext of ['.ts', '.tsx']) if (existsSync(join(BLOOM, base + ext))) return base + ext;
    return null;
  };
  const exports = {};
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === 'string') {
      exports[key] = value;
      continue;
    }
    const native = value['react-native']?.default;
    if (typeof native !== 'string') {
      console.warn(`kept ${key} as shipped (no react-native source entry)`);
      exports[key] = value;
      continue;
    }
    const web = typeof value.browser?.import === 'string' ? toSrc(value.browser.import) : null;
    exports[key] = { ...(web ? { browser: web } : {}), 'react-native': native, default: native };
  }
  return {
    ...pkg,
    exports,
    typesVersions: undefined,
    scripts: undefined,
    devDependencies: undefined,
  };
}

/**
 * A consumer's Tailwind scans `node_modules/@oxy.so/bloom/lib/**\/*.js` for class names, and the
 * mirror has no `lib`. It only reads TEXT, so each source file is also written there as a `.js`
 * copy; without it every utility Bloom's own components use (`bg-background-tertiary-default`,
 * `rounded-3xl`…) is silently missing from the consumer's CSS and the tint or the layout is gone.
 */
const SCAN = join(MIRROR, 'lib', 'scan');
function scanCopy(rel) {
  if (!/\.tsx?$/.test(rel)) return;
  const to = join(SCAN, `${rel}.js`);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(join(BLOOM, 'src', rel), to);
}

/** Delete what the mirror holds and the source no longer does, without recreating the tree. */
function prune(mirrorDir, sourceDir) {
  if (!existsSync(mirrorDir)) return;
  for (const name of readdirSync(mirrorDir)) {
    const mirrored = join(mirrorDir, name);
    const source = join(sourceDir, name);
    if (!existsSync(source) || !keep(source)) rmSync(mirrored, { recursive: true, force: true });
    else if (statSync(mirrored).isDirectory()) prune(mirrored, source);
  }
}

// In place, never `rm -rf` of the tree: a running Metro that loses the directory under it fails
// every bundle with ENOENT until it is restarted.
function mirrorAll() {
  mkdirSync(MIRROR, { recursive: true });
  prune(join(MIRROR, 'src'), join(BLOOM, 'src'));
  cpSync(join(BLOOM, 'src'), join(MIRROR, 'src'), { recursive: true, filter: keep });
  rmSync(SCAN, { recursive: true, force: true });
  for (const rel of readdirSync(join(BLOOM, 'src'), { recursive: true }))
    if (keep(join(BLOOM, 'src', rel)) && statSync(join(BLOOM, 'src', rel)).isFile()) scanCopy(rel);
  if (existsSync(join(BLOOM, 'assets', 'character-runtime')))
    cpSync(
      join(BLOOM, 'assets', 'character-runtime'),
      join(MIRROR, 'assets', 'character-runtime'),
      {
        recursive: true,
      },
    );
  writeFileSync(join(MIRROR, 'package.json'), `${JSON.stringify(mirroredPackage(), null, 2)}\n`);
}

function linkInstalls() {
  for (const install of bloomInstalls(CONSUMER)) {
    if (isLink(install)) continue;
    const kept = join(dirname(install), KEPT);
    rmSync(kept, { recursive: true, force: true });
    renameSync(install, kept);
    symlinkSync(relative(dirname(install), MIRROR), install);
    console.log(`linked ${relative(CONSUMER, install)} -> bloom-local`);
  }
}

mirrorAll();
linkInstalls();
console.log(`mirrored ${relative(process.cwd(), BLOOM) || '.'} into ${MIRROR}`);

if (flags.includes('--watch')) {
  // Polled, not `fs.watch`: a recursive watch loses the directories a `git switch` replaces (and
  // every directory created after it started), and then edits silently stop arriving. A scan of
  // `src/` is a few thousand `stat`s every half second.
  const seen = new Map();
  const scan = (dir, found = new Map()) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (!keep(path)) continue;
      if (entry.isDirectory()) scan(path, found);
      else if (entry.isFile()) found.set(path, statSync(path).mtimeMs);
    }
    return found;
  };
  for (const [path, mtime] of scan(join(BLOOM, 'src'))) seen.set(path, mtime);
  const sync = () => {
    let now;
    try {
      now = scan(join(BLOOM, 'src'));
    } catch {
      return; // a directory vanished mid-scan (a branch switch): the next pass sees the new tree
    }
    for (const [from, mtime] of now) {
      if (seen.get(from) === mtime) continue;
      seen.set(from, mtime);
      const name = relative(join(BLOOM, 'src'), from);
      try {
        const to = join(MIRROR, 'src', name);
        mkdirSync(dirname(to), { recursive: true });
        cpSync(from, to);
        scanCopy(name);
      } catch (error) {
        console.warn(`could not mirror ${name}: ${error.message}`);
      }
    }
    for (const from of [...seen.keys()]) {
      if (now.has(from)) continue;
      seen.delete(from);
      const name = relative(join(BLOOM, 'src'), from);
      rmSync(join(MIRROR, 'src', name), { recursive: true, force: true });
      rmSync(join(SCAN, `${name}.js`), { recursive: true, force: true });
    }
  };
  setInterval(sync, 500);
  console.log(
    'watching src/ (polled) — Ctrl-C to stop (run with --restore to put the published copies back)',
  );
}
