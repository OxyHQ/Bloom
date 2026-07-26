/**
 * The toast engine has exactly ONE platform switch — `TOAST_ENTER_DRIVER`, which
 * mechanism plays the DEFAULT enter animation. Both halves are load-bearing, and
 * each one broke the other platform when it was applied universally:
 *
 *   web    — a `Keyframe` on `entering` is frozen in place by reanimated's web
 *            layout-animation cleanup `duration * 5` later, so a second toast
 *            lands on top of the first.
 *   native — driving the enter imperatively stopped a `bottom-center` toast from
 *            painting at all.
 *
 * The invariant these tests protect: EXACTLY ONE of `entering` / `enterTranslateY`
 * is ever set. Both would play the enter twice. Neither would leave the row with no
 * enter animation and, on the imperative path, parked at `opacity: 0` one full
 * `enterTranslateY` from its slot — which is exactly how the native regression
 * presented.
 */
import { FadeIn } from 'react-native-reanimated';

import {
  TOAST_ENTER_DRIVER,
  resolveToastEnterAnimation,
  type ToastEnterDriver,
} from '../toast/animations';
import type { ToastPosition } from '../toast/types';

interface RNMock {
  Platform: { OS: 'ios' | 'android' | 'web' | 'windows' | 'macos' };
}

const POSITIONS: ToastPosition[] = ['bottom-center', 'top-center', 'center'];
const DRIVERS: ToastEnterDriver[] = ['imperative', 'layoutAnimation'];

/** Re-evaluate the module against a given `Platform.OS`. */
const driverFor = (os: RNMock['Platform']['OS']): ToastEnterDriver => {
  let driver: ToastEnterDriver | undefined;
  jest.isolateModules(() => {
    (require('react-native') as RNMock).Platform.OS = os;
    driver = (require('../toast/animations') as { TOAST_ENTER_DRIVER: ToastEnterDriver })
      .TOAST_ENTER_DRIVER;
  });
  if (!driver) {
    throw new Error('module did not evaluate');
  }
  return driver;
};

describe('TOAST_ENTER_DRIVER', () => {
  afterEach(() => {
    (require('react-native') as RNMock).Platform.OS = 'ios';
  });

  it('is imperative on web only', () => {
    expect(driverFor('web')).toBe('imperative');
    expect(driverFor('ios')).toBe('layoutAnimation');
    expect(driverFor('android')).toBe('layoutAnimation');
  });

  it('is a real value under the suite’s own platform', () => {
    expect(DRIVERS).toContain(TOAST_ENTER_DRIVER);
  });
});

describe('resolveToastEnterAnimation', () => {
  it.each(DRIVERS)(
    'sets exactly one of entering / enterTranslateY (%s), at every position',
    (driver) => {
      for (const position of POSITIONS) {
        const resolved = resolveToastEnterAnimation({
          position,
          enterOverride: undefined,
          driver,
        });
        const set = [resolved.entering, resolved.enterTranslateY].filter(
          (value) => value !== undefined,
        );
        expect({ driver, position, count: set.length }).toEqual({
          driver,
          position,
          count: 1,
        });
      }
    },
  );

  it('drives the default enter imperatively, never through `entering`, on the imperative driver', () => {
    const resolved = resolveToastEnterAnimation({
      position: 'bottom-center',
      enterOverride: undefined,
      driver: 'imperative',
    });
    expect(resolved.entering).toBeUndefined();
    expect(resolved.enterTranslateY).toBe(50);
  });

  it('travels the other way at top-center', () => {
    expect(
      resolveToastEnterAnimation({
        position: 'top-center',
        enterOverride: undefined,
        driver: 'imperative',
      }).enterTranslateY,
    ).toBe(-20);
  });

  it('drives the default enter through `entering`, never imperatively, on the layout driver', () => {
    const resolved = resolveToastEnterAnimation({
      position: 'bottom-center',
      enterOverride: undefined,
      driver: 'layoutAnimation',
    });
    expect(resolved.entering).toBeDefined();
    expect(resolved.enterTranslateY).toBeUndefined();
  });

  it.each(DRIVERS)(
    'hands a consumer override to `entering` and drives nothing imperatively (%s)',
    (driver) => {
      const resolved = resolveToastEnterAnimation({
        position: 'bottom-center',
        enterOverride: FadeIn,
        driver,
      });
      expect(resolved.entering).toBe(FadeIn);
      expect(resolved.enterTranslateY).toBeUndefined();
    },
  );

  it.each(DRIVERS)(
    "treats 'default' as no override at all (%s)",
    (driver) => {
      expect(
        resolveToastEnterAnimation({
          position: 'bottom-center',
          enterOverride: 'default',
          driver,
        }),
      ).toEqual(
        resolveToastEnterAnimation({
          position: 'bottom-center',
          enterOverride: undefined,
          driver,
        }),
      );
    },
  );
});
