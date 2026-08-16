// @ts-check
/**
 * Typecheck `src/` the way a CONSUMER's program sees it.
 *
 * Why this exists: Bloom's `react-native` export condition points `types` and
 * `default` at published `src/`, so every RN consumer compiles these files
 * inside THEIR tsconfig — one that has no `@types/node`. Bloom's own
 * `tsconfig.json` does pull `@types/node` in, which makes `setTimeout` return
 * `NodeJS.Timeout` here and `number` there. A Node-only global reached from
 * `src/` is therefore green in this repo and red in every consuming app: the
 * library reports success and the fleet reports the error. That inversion is
 * what let `pendingTimer.unref?.()` sit in `src/theme/ambient-store.ts` from
 * 0.67.0 through 1.0.0, breaking three packages of `@oxyhq/services`.
 *
 * `?.()` is what makes that shape easy to miss: it guards the CALL, not the
 * property ACCESS, so it still demands the property exist on the declared type.
 *
 * The oracle is `tsc` under `tsconfig.consumer.json` (`types: []`, expo's lib
 * set) — the same compiler the consumer runs, not a grep for known Node API
 * names, which could only ever find the ones somebody thought to list.
 *
 * TWO runs, because a clean run on its own proves nothing:
 *
 *   1. POSITIVE CONTROL — the identical program plus
 *      `scripts/typecheck-control/node-only-api.ts`, which reaches a Node-only
 *      property in exactly this way. It MUST be reported. A type probe whose
 *      imports fail to resolve degrades silently to `any` and reports a clean
 *      run; so does one pointed at an empty file set. This run rules both out
 *      in the same currency as the measurement.
 *   2. THE REAL RUN — the same program without the control. It must be clean,
 *      and it must have loaded at least SRC_FILE_FLOOR files from `src/`, so a
 *      broken `include` cannot pass by compiling nothing.
 *
 * SCOPE, stated so nobody reads more into a green than it carries.
 *
 *   - It models an EXPO app: `tsconfig.consumer.json` copies its non-Bloom
 *     options from `expo/tsconfig.base.json`. `process.env.NODE_ENV`, used in
 *     six files under `src/`, typechecks here only because
 *     `expo-modules-core`'s `global.d.ts` declares the global — a BARE React
 *     Native or a Vite consumer supplies that from somewhere else. If Bloom
 *     ever needs to support a non-Expo RN consumer, that is a second program to
 *     model, not an adjustment to this one.
 *   - It answers "does this type EXIST in a consumer's program", not "does this
 *     value exist at RUNTIME on a given platform". `document` and `window` are
 *     in the DOM lib and pass here while being absent on native; that class is
 *     guarded by the platform forks, not by this.
 *   - Tests and stories are excluded (see the config): nothing published
 *     reaches them, and they legitimately run on Node.
 *
 * Run standalone with `bun run verify:consumer-types`; wired into the
 * `typescript` script so `bun run typescript` covers both programs.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTROL_FILE = 'scripts/typecheck-control/node-only-api.ts';
const CONTROL_ERROR_CODE = 'TS2339';

/**
 * Vacuity floor for the real run. The consumer-shaped program excludes tests
 * and stories, so it is smaller than `bun run typescript`'s. Measured at 639 on
 * the commit that added this file; the floor is deliberately far below that so
 * ordinary file churn never touches it, while a program that silently collapsed
 * to a handful of files still fails.
 */
const SRC_FILE_FLOOR = 400;

/** @param {string[]} args */
function tsc(args) {
  const result = spawnSync(
    process.execPath,
    [path.join(PKG_ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), ...args],
    { cwd: PKG_ROOT, encoding: 'utf8' },
  );
  if (result.error) throw result.error;
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

/** @param {string} output */
function errorLines(output) {
  return output.split('\n').filter((line) => /error TS\d+:/.test(line));
}

function fail(message, detail) {
  console.error(`\nverify-consumer-typecheck: ${message}\n`);
  if (detail) console.error(`${detail}\n`);
  process.exit(1);
}

// 1. Positive control.
const controlErrors = errorLines(tsc(['-p', 'tsconfig.consumer-control.json']));
const controlHit = controlErrors.filter(
  (line) => line.includes(CONTROL_FILE) && line.includes(CONTROL_ERROR_CODE),
);
if (controlHit.length === 0) {
  fail(
    `the positive control did not fire. ${CONTROL_FILE} reaches a Node-only property and MUST\n` +
      `produce a ${CONTROL_ERROR_CODE} under tsconfig.consumer-control.json. It did not, so this\n` +
      `check cannot see the class of defect it exists to catch — a clean real run below would\n` +
      `mean nothing. Fix the probe (module resolution, include list, lib settings) before\n` +
      `trusting any result from it.`,
    controlErrors.length > 0 ? controlErrors.join('\n') : '(the control run reported no errors at all)',
  );
}

// 2. The real run, plus its vacuity floor.
const listing = tsc(['-p', 'tsconfig.consumer.json', '--listFiles']);
const realErrors = errorLines(listing);
const srcFiles = listing
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith(path.join(PKG_ROOT, 'src') + path.sep));

if (srcFiles.length < SRC_FILE_FLOOR) {
  fail(
    `the consumer-shaped program loaded only ${srcFiles.length} files from src/, below the floor of\n` +
      `${SRC_FILE_FLOOR}. A program that compiles almost nothing reports almost no errors; that is not\n` +
      `a pass. Check tsconfig.consumer.json's include/exclude.`,
  );
}

if (realErrors.length > 0) {
  fail(
    `src/ does not typecheck under a consumer-shaped program (${realErrors.length} error(s)).\n` +
      `These compile inside Bloom only because Bloom's own tsconfig pulls in @types/node. Every RN\n` +
      `consumer compiles src/ without it and gets exactly the errors below. Do not silence them with\n` +
      `a cast or an ignore — narrow at runtime so the code is sound under both programs\n` +
      `(src/theme/ambient-store.ts's timer handle is the worked example).`,
    realErrors.join('\n'),
  );
}

console.log(
  `verify-consumer-typecheck: ok — ${srcFiles.length} src files typecheck with no @types/node; ` +
    `positive control fired (${controlHit.length} ${CONTROL_ERROR_CODE}).`,
);
