/**
 * @jest-environment jsdom
 */

/**
 * The two suppressions `usePressAnimation` owns.
 *
 * They used to live only in `PressableScale`, which is the mechanism with the
 * FEWER internal consumers — so `Button`, `Fab`, `Chip`, `Tabs`, `Checkbox` and
 * `FrostedIconButton` all animated straight through a user's "reduce motion"
 * setting, and jittered under a mouse on desktop web. Nothing could see it: the
 * hook's return shape was identical either way and the components render the
 * same tree, so the only observable is whether a spring is STARTED.
 *
 * That is what this asserts, in both directions — every negative case is paired
 * with the control that differs by one condition, so "no spring" cannot pass by
 * the harness simply never reaching the handler.
 */
import * as React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { usePressAnimation } from '../hooks/use-press-animation';

type Hook = typeof import('../hooks/use-press-animation');

/**
 * Load the hook against a given platform + pointer type.
 *
 * `SUPPORTS_PRESS_SCALE` is resolved once at module load (a pointer type does
 * not change under a running app), so the pointer cases have to re-require it.
 * Both `doMock`s hand back the SAME module object the outer test holds:
 * `react-native` because otherwise the isolated graph builds a second `Platform`
 * and the OS the case set lands on an object the module under test never reads,
 * and `react` because a second copy has its own null hook dispatcher — the
 * isolated hook then throws on `useRef` inside the renderer's own act().
 */
function loadHook(os: 'ios' | 'web', coarsePointer: boolean): Hook['usePressAnimation'] {
  let mod: Hook | undefined;

  const previousOs = ReactNative.Platform.OS;
  const previousMatchMedia = window.matchMedia;
  ReactNative.Platform.OS = os;
  window.matchMedia = ((query: string) => ({
    matches: query === '(pointer: coarse)' ? coarsePointer : false,
  })) as unknown as typeof window.matchMedia;

  try {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ReactNative);
      jest.doMock('react', () => React);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('../hooks/use-press-animation') as Hook;
    });
  } finally {
    ReactNative.Platform.OS = previousOs;
    window.matchMedia = previousMatchMedia;
  }

  if (!mod) throw new Error('module isolation did not run');
  return mod.usePressAnimation;
}

describe('usePressAnimation suppressions', () => {
  let spring: jest.SpyInstance;

  beforeEach(() => {
    spring = jest.spyOn(ReactNative.Animated, 'spring');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  function press(hook: Hook['usePressAnimation'], scale?: number) {
    const { result } = renderHook(() => hook(scale));
    act(() => {
      result.current.onPressIn();
      result.current.onPressOut();
    });
    return result.current.enabled;
  }

  it('animates on native when reduce motion is off', () => {
    expect(press(usePressAnimation, 0.97)).toBe(true);
    expect(spring).toHaveBeenCalledTimes(2);
  });

  it('starts no spring when the OS asks for reduced motion', () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    expect(press(usePressAnimation, 0.97)).toBe(false);
    expect(spring).not.toHaveBeenCalled();
  });

  it('starts no spring on web under a fine pointer', () => {
    expect(press(loadHook('web', false), 0.97)).toBe(false);
    expect(spring).not.toHaveBeenCalled();
  });

  // The control for the case above: same platform, same code path, one media
  // query apart. Without it, "web does not animate" would pass against a hook
  // that never animates anywhere.
  it('still animates on web under a coarse pointer', () => {
    expect(press(loadHook('web', true), 0.97)).toBe(true);
    expect(spring).toHaveBeenCalledTimes(2);
  });

  // The third suppression, and the one that used to be a defect. `Button`,
  // `Fab`, `FrostedIconButton` and `Checkbox` all express their disabled state
  // as `usePressAnimation(disabled ? undefined : PRESS_SCALE)`. While
  // `pressScale` carried a `= 0.97` default that did nothing — a JS default
  // parameter fires on an EXPLICIT `undefined` — so the argument became 0.97 and
  // `enabled` stayed true. The parameter is required now; reintroducing a
  // default makes this red.
  it('an explicit undefined scale disables it', () => {
    expect(press(usePressAnimation, undefined)).toBe(false);
    expect(spring).not.toHaveBeenCalled();
  });

  // The control for the case above: one argument apart, same everything else.
  // Without it, "undefined disables" would pass against a hook that never
  // animates at all.
  it('…while a number on the same path animates', () => {
    expect(press(usePressAnimation, 0.9)).toBe(true);
    expect(spring).toHaveBeenCalledTimes(2);
  });
});
