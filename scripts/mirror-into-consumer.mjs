#!/usr/bin/env node
/**
 * Live-edit Bloom inside a consumer app, without publishing.
 *
 *   node scripts/mirror-into-consumer.mjs <consumer-root> [--watch]
 *   node scripts/mirror-into-consumer.mjs <consumer-root> --restore
 *
 * Mirrors this checkout's SOURCE into `<consumer-root>/.bloom-local/` and points every
 * `node_modules/@oxy.so/bloom` under the consumer at it, so Metro serves what you edit here.
 * With `--watch` an edit under `src/` reaches the consumer in a moment; `--restore` puts the
 * published copies back.
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
  watch,
  writeFileSync,
  lstatSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOOM = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [, , consumerArg, ...flags] = process.argv;
if (!consumerArg) {
  console.error('usage: mirror-into-consumer.mjs <consumer-root> [--watch | --restore]');
  process.exit(1);
}
const CONSUMER = resolve(consumerArg);
const MIRROR = join(CONSUMER, '.bloom-local');
const KEPT = '.bloom-published';

/** Every `node_modules/@oxy.so/bloom` under the consumer (root and each workspace package). */
function bloomInstalls(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === '.bloom-local') continue;
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

function mirrorAll() {
  rmSync(MIRROR, { recursive: true, force: true });
  mkdirSync(MIRROR, { recursive: true });
  cpSync(join(BLOOM, 'src'), join(MIRROR, 'src'), { recursive: true, filter: keep });
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
    console.log(`linked ${relative(CONSUMER, install)} -> .bloom-local`);
  }
}

mirrorAll();
linkInstalls();
console.log(`mirrored ${relative(process.cwd(), BLOOM) || '.'} into ${MIRROR}`);

if (flags.includes('--watch')) {
  const pending = new Map();
  watch(join(BLOOM, 'src'), { recursive: true }, (_event, name) => {
    if (!name) return;
    const from = join(BLOOM, 'src', name);
    if (!keep(from)) return;
    clearTimeout(pending.get(from));
    pending.set(
      from,
      setTimeout(() => {
        pending.delete(from);
        const to = join(MIRROR, 'src', name);
        try {
          if (existsSync(from) && statSync(from).isFile()) {
            mkdirSync(dirname(to), { recursive: true });
            cpSync(from, to);
          } else if (!existsSync(from)) {
            rmSync(to, { recursive: true, force: true });
          }
        } catch (error) {
          console.warn(`could not mirror ${name}: ${error.message}`);
        }
      }, 40),
    );
  });
  console.log(
    'watching src/ — Ctrl-C to stop (run with --restore to put the published copies back)',
  );
}
