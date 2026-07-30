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
import { readFileSync } from 'node:fs';
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
  const [manifest] = JSON.parse(stdout);
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

  if (problems.length > 0) {
    console.error('[verify-package] FAILED\n  ' + problems.join('\n  '));
    process.exit(1);
  }

  console.log(
    `[verify-package] ok — ${files.size} files packed, all ${targets.length} exports targets present ` +
      `(${typescriptCount} in lib/typescript/)`,
  );
}

main();
