import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Every Reanimated worklet hook names its dependencies.
 *
 * Without the worklets Babel plugin — Storybook's Vite build, and any web
 * consumer that doesn't run it — Reanimated has no closure to read: a
 * `useAnimatedStyle` with no array THROWS in dev ("was used without a dependency
 * array or Babel plugin"), and a shared value missing from ANY hook's array never
 * updates on web (the style freezes at its first frame). Native and jest both run
 * the plugin, so neither can see it.
 *
 * `scripts/reanimated-deps.mjs` computes each call's captured locals; this runs it
 * in check mode over `src`. Fix with `node scripts/reanimated-deps.mjs --write`.
 */
const ROOT = join(__dirname, '..', '..');

describe('reanimated dependency arrays', () => {
  it('every worklet hook lists everything it captures', () => {
    let output = '';
    let failed = false;
    try {
      output = execFileSync('node', ['scripts/reanimated-deps.mjs', '--check', 'src'], {
        cwd: ROOT,
        encoding: 'utf8',
      });
    } catch (error) {
      failed = true;
      output = String((error as { stdout?: string }).stdout ?? error);
    }
    expect({ failed, output: failed ? output : '' }).toEqual({ failed: false, output: '' });
    // Vacuity floor: the checker ran and scanned something.
    expect(output).toMatch(/0 problem\(s\)/);
  });
});
