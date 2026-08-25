// @ts-check
/**
 * Assert that every file `package.json#exports` points at actually ships.
 *
 * Why this exists: a release has already gone out with `lib/typescript/`
 * missing from the tarball (the bob tsc build raced the publish), and nothing
 * caught it — a `.d.ts` that is merely absent produces no error in this repo,
 * only in every consumer that installs it. Since the `react-native` condition
 * now resolves `types` to `lib/typescript/` as well, RN consumers no longer
 * have `src/` to fall back on: a dropped declaration tree breaks the ENTIRE
 * fleet's typecheck, not just the Vite/node ones.
 *
 * The oracle is `npm pack` because that is what release-it publishes with
 * (`"npm": { "publish": true }` in `.release-it.json`) — not a reimplementation
 * of the `files` globs, which would only ever test itself.
 *
 * Run standalone with `bun run verify:package`; wired as `postbuild` so every
 * `bun run build` — and therefore `prepack` and `release` — exercises it.
 *
 * Packing from a build hook is re-entrant, because both lifecycle scripts a
 * pack triggers end up rebuilding: `prepack` is `clean && build` and `prepare`
 * is `build`, and `build`'s `postbuild` is this file. Left alone that recurses,
 * and the levels fight over `lib/` — the visible symptom is bob dying on an
 * ENOENT for a sourcemap another level already deleted, which reads like a bob
 * bug and is not one. Two guards contain it, and both are load-bearing:
 *
 *   1. `--ignore-scripts` stops `prepack`. It does NOT stop `prepare`: npm
 *      runs that one for `npm pack` no matter what (long-standing npm bug,
 *      reproduced on 10.9.8), which is why the flag alone is not enough.
 *   2. REENTRY_ENV, set for the child pack and read by `prepare` itself, is
 *      what stops the rebuild npm insists on. Skipping it is not a shortcut:
 *      we are verifying the `lib/` tree the OUTER build just produced, so a
 *      nested build clobbering it mid-pack is the one thing that would make
 *      this check report on an artefact nobody is going to publish.
 *
 * Between them, the child's stdout carries nothing but the `--json` payload,
 * which is why it can be parsed whole. A build slipping back into that stream
 * shows up here as a JSON syntax error, not as a wrong answer.
 */

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Read by the `prepare` script in package.json, which skips its rebuild when
 * this is set. Renaming it here without renaming it there silently restores
 * the recursion.
 */
const REENTRY_ENV = 'BLOOM_VERIFY_PACKAGE_RUNNING';

/**
 * Vacuity floor for the declaration tree. bob emits ~1000 `.d.ts` per module
 * format today; a tarball carrying a handful of stragglers is a failed build,
 * not a pass.
 */
const MIN_TYPESCRIPT_FILES = 500;

/** Where the consumer-facing guides live, relative to the repo root. */
const DOCS_DIR = 'docs';

/**
 * Vacuity floor for the guides, and ONLY that.
 *
 * Its single job is to catch a `docs/` that packed as empty or unreadable,
 * because `assertDocsShip()`'s real rule — every `.mdx` on disk is in the
 * tarball — is trivially satisfied when the disk side reads nothing. It is not
 * a coverage target: do not ratchet it up as guides are added, or removing a
 * family's guide alongside the family turns a correct change red.
 */
const MIN_SHIPPED_DOCS = 60;

/**
 * Files a consumer must be able to open from inside `node_modules`, named one
 * by one because the derived rule below cannot see them go missing.
 *
 * `assertDocsShip()` asks "is every `docs/*.mdx` on disk in the tarball?", and
 * a rename satisfies that on both sides at once — rename the migration guide
 * and the derived rule follows it without a word. These paths are the ones
 * whose absence is expensive enough to be worth the friction of editing this
 * list: the guide is the ONLY bridge across the 0.x → 1.0 cut (no
 * `@deprecated` aliases exist anywhere), so an app that cannot read it cannot
 * upgrade, and it shipped nowhere at all for the whole of 1.0.0.
 *
 * `README.md` and `LICENSE` are here for completeness — npm includes both
 * whatever `files` says, so they double as this check's own positive control:
 * if they ever report missing, the tarball parse is broken, not the packaging.
 */
const REQUIRED_ROOT_DOCS = [
  'README.md',
  'README.theme.md',
  'LICENSE',
  `${DOCS_DIR}/index.mdx`,
  `${DOCS_DIR}/getting-started.mdx`,
  `${DOCS_DIR}/migrating-to-1.0.mdx`,
];

/**
 * Subpaths a plain Node process must be able to load, and which of them work
 * under ESM as opposed to only CommonJS.
 *
 * Deliberately short: 7 of Bloom's 87 subpaths load under bare Node at all,
 * the rest pull `react-native` and die in its Flow/JSX source. Six of those
 * seven are here because something documents them as Node-facing — `./fonts`
 * carries a `node` export condition for the SSR path, `./design-tokens`,
 * `./preset-vars` and `./color-presets` are the react-free resolvers a build
 * script imports, `./tailwind-preset` is loaded by a consumer's tailwind
 * config, and `./image-resolver` is one universal pure-JS file. The seventh,
 * `./scroll`, loads today by accident rather than by contract, so pinning it
 * would go red on an honest change.
 *
 * `./fonts` earned the original check: it silently stopped loading once the
 * web font module changed from base64 constants to `.woff2` asset imports, and
 * nothing else caught it — jest maps font binaries to a stub, tsc never
 * executes, and every bundler handles assets by design. Running real `node` is
 * the only thing that does.
 *
 * ESM is a SEPARATE question from CommonJS and this check used to conflate
 * them: it ran `require()` and reported "require()-able under Node", which
 * reads as Node coverage. Measured, `import()` fails for three of the six.
 * bob leaves a relative specifier extensionless exactly when the target has
 * platform variants, so a bundler can pick one — 114 of the 114 bare
 * specifiers in `lib/module` are that shape. Node's ESM resolver demands the
 * extension and throws ERR_MODULE_NOT_FOUND. Appending extensions would break
 * platform resolution for every bundler, so this list records the state rather
 * than papering over it, in BOTH directions: a subpath here that starts
 * resolving under ESM fails this check too, because the entry is then a lie.
 */
const NODE_LOADABLE_SUBPATHS = [
  './color-presets',
  './design-tokens',
  './fonts',
  './image-resolver',
  './preset-vars',
  './tailwind-preset',
];

/**
 * The three of those six that Node's ESM resolver cannot load. Not a
 * suppression list — `assertNodeLoadable()` asserts membership exactly, so the
 * other three are this probe's positive control: if the scratch package or the
 * symlink were wrong, they would fail too, instead of the run quietly
 * "confirming" the expected breakage.
 */
const NODE_ESM_UNRESOLVABLE_SUBPATHS = new Set(['./design-tokens', './fonts', './tailwind-preset']);

/**
 * Load each entry twice — once through `require()`, once through `import()` —
 * from a throwaway package that resolves `@oxyhq/bloom` to this repo, so the
 * real `exports` map, conditions and all, is what gets exercised. Loading the
 * built file directly would skip the `node` condition that makes these work,
 * which is the part that broke.
 *
 * The ESM half runs under `--input-type=module` rather than a `"type":
 * "module"` manifest, so both halves share one scratch package and neither can
 * be answering about a different resolver than the other.
 */
function assertNodeLoadable(subpaths, esmUnresolvable) {
  const scratch = mkdtempSync(join(tmpdir(), 'bloom-verify-'));
  try {
    mkdirSync(join(scratch, 'node_modules', '@oxyhq'), { recursive: true });
    symlinkSync(REPO_ROOT, join(scratch, 'node_modules', '@oxyhq', 'bloom'), 'dir');
    writeFileSync(
      join(scratch, 'package.json'),
      JSON.stringify({ name: 'bloom-node-load-probe', version: '0.0.0', private: true }),
    );

    /** @returns {string | null} the first error line, or null when it loaded. */
    const load = (/** @type {string[]} */ args) => {
      try {
        execFileSync(process.execPath, args, {
          cwd: scratch,
          encoding: 'utf8',
          stdio: ['ignore', 'ignore', 'pipe'],
        });
        return null;
      } catch (error) {
        const detail = String(error.stderr ?? error.message)
          .split('\n')
          .find((line) => /Error|error/.test(line));
        return detail?.trim() ?? 'unknown';
      }
    };

    return subpaths.flatMap((subpath) => {
      const specifier = `@oxyhq/bloom${subpath.slice(1)}`;
      const quoted = JSON.stringify(specifier);
      const problems = [];

      const cjs = load(['-e', `require(${quoted})`]);
      if (cjs !== null) problems.push(`require('${specifier}') fails under plain Node: ${cjs}`);

      const esm = load(['--input-type=module', '-e', `await import(${quoted})`]);
      if (esm !== null && !esmUnresolvable.has(subpath)) {
        problems.push(`import('${specifier}') fails under plain Node ESM: ${esm}`);
      }
      if (esm === null && esmUnresolvable.has(subpath)) {
        problems.push(
          `import('${specifier}') now resolves under plain Node ESM — drop it from ` +
            'NODE_ESM_UNRESOLVABLE_SUBPATHS, the entry no longer describes the package',
        );
      }

      return problems;
    });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/**
 * Assert the guides a consumer needs are in the tarball.
 *
 * `exports` cannot express this, so the check above is blind to it by
 * construction: a doc is not an entry point, and 1.0.0 shipped with zero
 * `.mdx` files while every one of its 536 exports targets was present and
 * correct. The migration guide in particular exists to be read from inside
 * `node_modules` by whoever is doing the upgrade.
 *
 * The rule is derived from the working tree rather than from a hand-written
 * list, because a list that only checks what someone remembered to add is not
 * a gate — a guide written next month has to ship without anyone editing this
 * file. `npm pack` resolves `files` against the same working tree, so both
 * sides are counting the same things.
 *
 * That derivation only holds while the guides stay FLAT, which is why the
 * nesting check below is part of the gate rather than a style preference: the
 * `docs/*.mdx` glob does not descend, so a guide filed one directory down
 * would not ship and the top-level scan would not miss it — the same silence
 * this whole function exists to end, one level deeper. `docs/superpowers/`
 * holds internal plans and specs as `.md`, which is why the rule is about
 * `.mdx` specifically and needs no exemption for it.
 */
function assertDocsShip(files) {
  const entries = readdirSync(join(REPO_ROOT, DOCS_DIR), { recursive: true, encoding: 'utf8' });
  const everyMdx = entries.filter((name) => name.endsWith('.mdx')).sort();
  const onDisk = everyMdx.filter((name) => !name.includes('/')).map((name) => `${DOCS_DIR}/${name}`);
  const nested = everyMdx.filter((name) => name.includes('/'));

  const problems = [];

  if (nested.length > 0) {
    problems.push(
      `${nested.length} guide(s) are nested inside ${DOCS_DIR}/ and will NOT ship — the ` +
        `"${DOCS_DIR}/*.mdx" glob does not descend. Move them to the top level, or decide they ` +
        'are internal and write them as .md:\n' +
        nested.map((name) => `    - ${DOCS_DIR}/${name}`).join('\n'),
    );
  }

  if (onDisk.length < MIN_SHIPPED_DOCS) {
    problems.push(
      `only ${onDisk.length} .mdx files found in ${DOCS_DIR}/ (expected >= ${MIN_SHIPPED_DOCS}) — ` +
        'the guides did not move, this scan did, and the every-doc-ships rule below is vacuous ' +
        'until it is fixed',
    );
  }

  const unshipped = onDisk.filter((path) => !files.has(path));
  if (unshipped.length > 0) {
    problems.push(
      `${unshipped.length} of ${onDisk.length} guides in ${DOCS_DIR}/ are absent from the tarball ` +
        `(check the "${DOCS_DIR}/*.mdx" entry in package.json#files):\n` +
        unshipped.map((path) => `    - ${path}`).join('\n'),
    );
  }

  const missing = REQUIRED_ROOT_DOCS.filter((path) => !files.has(path));
  if (missing.length > 0) {
    problems.push(
      `${missing.length} of ${REQUIRED_ROOT_DOCS.length} named documents are absent from the ` +
        'tarball — a consumer cannot upgrade without these:\n' +
        missing.map((path) => `    - ${path}`).join('\n'),
    );
  }

  return problems;
}

/** Collect every file path an `exports` entry references, at any nesting depth. */
function collectTargets(node, out) {
  if (typeof node === 'string') {
    if (node.startsWith('./')) out.add(node.slice(2));
    return out;
  }
  if (typeof node === 'object' && node !== null) {
    for (const value of Object.values(node)) collectTargets(value, out);
  }
  return out;
}

function packedFiles() {
  const stdout = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
    env: { ...process.env, [REENTRY_ENV]: '1' },
  });
  const parsed = JSON.parse(stdout);
  // npm 12 changed `pack --json` from an ARRAY of manifests to an OBJECT keyed
  // by package name. Both shapes are accepted, and an unrecognised one THROWS
  // rather than yielding an empty set — "no file is missing from the tarball"
  // and "the tarball listing could not be read" are otherwise the same result,
  // and the second one is what shipped here silently (`object is not iterable`
  // only surfaced because the destructure crashed; a shape change that merely
  // produced `undefined` would have passed the whole gate).
  const manifest = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
  if (!manifest || !Array.isArray(manifest.files)) {
    throw new Error(
      `verify-package: could not read a file list out of \`npm pack --json\` ` +
        `(npm ${process.env.npm_config_user_agent ?? 'unknown'}). Shape was: ` +
        `${Array.isArray(parsed) ? 'array' : typeof parsed}.`,
    );
  }
  return new Set(manifest.files.map((/** @type {{ path: string }} */ f) => f.path));
}

function main() {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
  const targets = [...collectTargets(pkg.exports, new Set())].sort();
  const files = packedFiles();

  const missing = targets.filter((target) => !files.has(target));
  const typescriptCount = [...files].filter((p) => p.startsWith('lib/typescript/')).length;

  const problems = [];
  if (missing.length > 0) {
    problems.push(
      `${missing.length} of ${targets.length} exports targets are absent from the tarball:\n` +
        missing.map((p) => `    - ${p}`).join('\n'),
    );
  }
  if (typescriptCount < MIN_TYPESCRIPT_FILES) {
    problems.push(
      `lib/typescript/ contributes only ${typescriptCount} files (expected >= ${MIN_TYPESCRIPT_FILES}). ` +
        'Every consumer resolves its types there — run `bun run build` and check the tsc step.',
    );
  }
  problems.push(...assertDocsShip(files));
  problems.push(...assertNodeLoadable(NODE_LOADABLE_SUBPATHS, NODE_ESM_UNRESOLVABLE_SUBPATHS));

  if (problems.length > 0) {
    console.error('[verify-package] FAILED\n  ' + problems.join('\n  '));
    process.exit(1);
  }

  const docCount = [...files].filter(
    (p) => p.startsWith(`${DOCS_DIR}/`) && p.endsWith('.mdx'),
  ).length;
  const esmCount = NODE_LOADABLE_SUBPATHS.length - NODE_ESM_UNRESOLVABLE_SUBPATHS.size;

  console.log(
    `[verify-package] ok — ${files.size} files packed, all ${targets.length} exports targets present ` +
      `(${typescriptCount} in lib/typescript/), ${docCount} guides in ${DOCS_DIR}/, ` +
      `${NODE_LOADABLE_SUBPATHS.length} subpath(s) require()-able under Node ${process.version} ` +
      `(${esmCount} of them also import()-able as ESM, ` +
      `${NODE_ESM_UNRESOLVABLE_SUBPATHS.size} known-unresolvable)`,
  );
}

main();
