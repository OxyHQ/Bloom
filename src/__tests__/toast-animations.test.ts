import {
  MAX_CACHED_ANIMATIONS,
  getToastEnterAnimation,
  getToastExitAnimation,
  toastAnimationCacheSize,
} from '../toast/animations';
import type { ToastPosition } from '../toast/types';

const POSITIONS: ToastPosition[] = ['top-center', 'bottom-center', 'center'];

describe('toast layout animations', () => {
  it('returns the same instance for the same enter shape', () => {
    const first = getToastEnterAnimation('bottom-center');
    expect(getToastEnterAnimation('bottom-center')).toBe(first);
  });

  it('returns a different instance per position', () => {
    const instances = POSITIONS.map((position) =>
      getToastEnterAnimation(position),
    );
    expect(new Set(instances).size).toBe(POSITIONS.length);
  });

  it('returns the same instance for the same exit shape', () => {
    const shape = {
      position: 'bottom-center' as const,
      isHiddenByLimit: false,
      isSingle: true,
      stackGap: 8,
    };
    expect(getToastExitAnimation(shape)).toBe(getToastExitAnimation(shape));
  });

  it.each([
    ['isHiddenByLimit', { isHiddenByLimit: true }],
    ['isSingle', { isSingle: false }],
    ['stackGap', { stackGap: 12 }],
    ['position', { position: 'top-center' as const }],
  ])('keys the exit cache on %s', (_label, override) => {
    const base = {
      position: 'bottom-center' as const,
      isHiddenByLimit: false,
      isSingle: true,
      stackGap: 8,
    };
    expect(getToastExitAnimation({ ...base, ...override })).not.toBe(
      getToastExitAnimation(base),
    );
  });

  it('gives each cached instance its own definition object', () => {
    // `Keyframe.parseDefinitions()` mutates the definitions it was built with
    // (rewriting `from`/`to` into `0`/`100`), so two instances sharing one object
    // would make the second throw. Distinct instances must not alias.
    const first = getToastEnterAnimation('top-center');
    const second = getToastEnterAnimation('bottom-center');
    expect(first).not.toBe(second);
  });

  it('never grows past MAX_CACHED_ANIMATIONS, however many gaps are used', () => {
    for (let stackGap = 0; stackGap < MAX_CACHED_ANIMATIONS * 4; stackGap++) {
      getToastExitAnimation({
        position: 'bottom-center',
        isHiddenByLimit: false,
        isSingle: false,
        stackGap,
      });
    }
    expect(toastAnimationCacheSize()).toBeLessThanOrEqual(
      MAX_CACHED_ANIMATIONS,
    );
  });

  it('still serves a shape that was evicted, by rebuilding it', () => {
    const rebuilt = getToastExitAnimation({
      position: 'bottom-center',
      isHiddenByLimit: false,
      isSingle: false,
      stackGap: 0,
    });
    expect(rebuilt).toBeDefined();
    expect(toastAnimationCacheSize()).toBeLessThanOrEqual(
      MAX_CACHED_ANIMATIONS,
    );
  });
});
