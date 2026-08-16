import { readFileSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

/**
 * `scripts/verify-consumer-typecheck.mjs` is wired into a script somebody runs.
 *
 * WHAT THIS CAN SEE, AND WHAT IT CANNOT.
 *
 * The verifier carries its own positive control and its own vacuity floor, so
 * it can tell a clean program from a blind one. The single thing it cannot
 * check is whether anything INVOKES it — a verifier nobody runs reports nothing
 * and looks exactly like a verifier reporting success. That is the whole job
 * here.
 *
 * It is worth a gate because the defect it guards is invisible from inside this
 * repo BY CONSTRUCTION: Bloom's `react-native` export condition points at
 * published `src/`, consumers compile those files without `@types/node`, and
 * Bloom's own tsconfig has it. So `bun run typescript` going green is not
 * evidence the fleet compiles, and dropping the second half of that script
 * restores the inversion silently — `pendingTimer.unref?.()` survived from
 * 0.67.0 to 1.0.0 in exactly that blind spot.
 *
 * The two tsconfigs are checked for the extends relationship for the same
 * reason: the control run only proves something about the REAL run while the
 * two share compiler options. If the control config stopped extending the
 * consumer one, both runs would still pass while measuring different programs.
 */

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

const VERIFIER = 'scripts/verify-consumer-typecheck.mjs';

describe('the consumer-shaped typecheck is wired', () => {
  it('runs from the `typescript` script, beside Bloom’s own tsc', () => {
    const scripts = JSON.parse(read('package.json')).scripts;
    expect(scripts.typescript).toContain('tsc --noEmit');
    expect(scripts.typescript).toContain(VERIFIER);
    expect(scripts['verify:consumer-types']).toContain(VERIFIER);
  });

  it('keeps the control program identical to the measured one but for the control file', () => {
    // Read through tsc's own JSONC parser — the tsconfigs carry comments, and
    // tsc is the authority on what they mean anyway.
    const { config: control } = ts.readConfigFile(
      path.join(ROOT, 'tsconfig.consumer-control.json'),
      (file) => readFileSync(file, 'utf8'),
    );
    expect(control.extends).toBe('./tsconfig.consumer.json');
    expect(control.compilerOptions).toBeUndefined();
    expect(control.include).toEqual(['src', 'scripts/typecheck-control']);
  });

  it('keeps a control file that still reaches a Node-only property', () => {
    // Not a substitute for the verifier's own control run, which proves the
    // error is REPORTED. This only fails the same way a deleted fixture would,
    // and does so during `bun run test` rather than only under tsc.
    expect(read('scripts/typecheck-control/node-only-api.ts')).toContain('timer.unref()');
  });
});
