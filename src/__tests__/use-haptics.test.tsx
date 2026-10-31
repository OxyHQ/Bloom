import React from 'react';
import * as ReactNative from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import type * as ExpoHaptics from 'expo-haptics';

import type { HapticsLike } from '../hooks/haptics-module';

/**
 * THE OPTIONAL-PEER BOUNDARY for `expo-haptics`.
 *
 * What this suite can and cannot see is the whole point. The defect it was
 * written against — the specifier passed to `require()` as a VARIABLE, which
 * Metro rewrites into a thrower — is a STATIC property of the source, and jest
 * is CommonJS with a real dynamic `require`, so it resolved the module happily
 * and the old version of this file asserted `impactAsync` was called against
 * code where it could never be called on a device. No runtime suite can
 * distinguish the two shapes. `optional-peer-imports.test.ts` is the gate that
 * can, and it is where the literal-specifier requirement is enforced.
 *
 * What IS testable here is everything the loader does once it has (or has not)
 * got a module: the strength mapping, the platform clamps, and the degradation
 * — inert, not a crash, and not silent.
 *
 * Every case that touches the loader goes through `jest.isolateModules` +
 * `jest.doMock` because it caches its result and its warning flag in module
 * state: without a fresh registry the first case to resolve expo-haptics would
 * leave every later case asserting against a cache it can no longer influence.
 */

const HAPTICS = 'expo-haptics';
const reactModule: unknown = jest.requireActual('react');

/**
 * Compile-time half of the contract: the real expo-haptics surface must remain
 * assignable to Bloom's hand-written `HapticsLike`. The interface is written by
 * hand so expo-haptics' types never reach Bloom's emitted `.d.ts` (a consumer
 * that skips the optional peer must not inherit a TS7016 from Bloom), which
 * leaves this as the only place a shape change in expo-haptics can be caught.
 *
 * It is enforced by `bun run typescript`, NOT by jest: ts-jest transpiles
 * without typechecking here, so a drifted type is green under `bunx jest` and
 * red under `tsc` (verified by mutation — renaming `impactAsync` to
 * `impactFeedback` in `HapticsLike` produces `TS2322: Type 'true' is not
 * assignable to type 'never'` on the line below).
 */
type RealHapticsIsCompatible = typeof ExpoHaptics extends HapticsLike ? true : never;
const HAPTICS_TYPES_STILL_MATCH: RealHapticsIsCompatible = true;

type Harness = {
  useHaptics: typeof import('../hooks/use-haptics').useHaptics;
  useHapticFeedback: typeof import('../hooks/use-haptics').useHapticFeedback;
  BloomHapticsProvider: typeof import('../hooks/use-haptics').BloomHapticsProvider;
  impactAsync: jest.Mock;
  styles: Record<'Light' | 'Medium' | 'Heavy', string>;
};

const STYLES = { Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const;

/**
 * Load `useHaptics` against a given expo-haptics module factory. Passing a
 * factory that THROWS is how the absent-peer case is expressed: that is exactly
 * what the `catch` sees when Metro stubs an unresolved optional dependency.
 */
function loadWithHaptics(factory?: () => unknown): Harness {
  const impactAsync = jest.fn(async () => {});
  let harness: Harness | undefined;

  jest.isolateModules(() => {
    // NOT `{ virtual: true }`: expo-haptics is a real devDependency here (mapped
    // to `__mocks__/expo-haptics.ts`), and a virtual mock is keyed by the bare
    // name while the loader's `require` resolves through the same mapping — the
    // mock would never be consulted and every case would run against the manual
    // mock instead of the factory.
    jest.doMock(HAPTICS, factory ?? (() => ({ ImpactFeedbackStyle: STYLES, impactAsync })));
    // An isolated registry would otherwise build the hook against a SECOND copy
    // of React, whose dispatcher is null under the outer renderer — every case
    // would fail on `useContext` before reaching what it asserts. `react-native`
    // is pinned for the same reason with a sharper edge: a second copy carries a
    // second `Platform` object, so the `Platform.OS` each case sets would land
    // on an instance the hook never reads — every platform case would then run
    // on the default OS and pass or fail for the wrong reason.
    jest.doMock('react', () => reactModule);
    jest.doMock('react-native', () => ReactNative);

    // A plain `require`, NOT `jest.requireActual`: the latter bypasses the mock
    // registry for the whole dependency subtree, so the doMocks above would be
    // ignored and the suite would silently exercise the real expo-haptics.
    const mod = require('../hooks/use-haptics') as typeof import('../hooks/use-haptics');

    harness = {
      useHaptics: mod.useHaptics,
      useHapticFeedback: mod.useHapticFeedback,
      BloomHapticsProvider: mod.BloomHapticsProvider,
      impactAsync,
      styles: STYLES,
    };
  });

  if (!harness) throw new Error('module isolation did not run');
  return harness;
}

const originalOS = ReactNative.Platform.OS;

describe('useHaptics', () => {
  let warn: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    // `__mocks__/setup.ts` already silences console.warn; this re-spies so the
    // calls are recorded and stay scoped to one test.
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    ReactNative.Platform.OS = originalOS;
    warn.mockRestore();
    jest.resetModules();
    jest.dontMock(HAPTICS);
    jest.clearAllMocks();
  });

  it('keeps its own types in step with the real expo-haptics surface', () => {
    // The real assertion is the type annotation above, checked by `tsc`. This
    // only keeps the constant referenced so it cannot be dropped as unused.
    expect(HAPTICS_TYPES_STILL_MATCH).toBe(true);
  });

  it('returns a callback', () => {
    const { useHaptics } = loadWithHaptics();
    const { result } = renderHook(() => useHaptics());
    expect(typeof result.current).toBe('function');
  });

  it('fires the mapped impact style on iOS', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHaptics, impactAsync, styles } = loadWithHaptics();
    const { result } = renderHook(() => useHaptics());
    act(() => result.current('heavy'));
    // Asserted against the value the MODULE exposes, not a literal: the hook's
    // contract is that it hands back what `ImpactFeedbackStyle` gave it.
    expect(impactAsync).toHaveBeenCalledWith(styles.Heavy);
    expect(warn).not.toHaveBeenCalled();
  });

  it('defaults to the light impact', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHaptics, impactAsync, styles } = loadWithHaptics();
    const { result } = renderHook(() => useHaptics());
    act(() => result.current());
    expect(impactAsync).toHaveBeenCalledWith(styles.Light);
  });

  it('clamps to the light impact on Android regardless of strength', () => {
    ReactNative.Platform.OS = 'android';
    const { useHaptics, impactAsync, styles } = loadWithHaptics();
    const { result } = renderHook(() => useHaptics());
    act(() => result.current('heavy'));
    expect(impactAsync).toHaveBeenCalledWith(styles.Light);
  });

  it('no-ops on web', () => {
    ReactNative.Platform.OS = 'web';
    const { useHaptics, impactAsync } = loadWithHaptics();
    const { result } = renderHook(() => useHaptics());
    act(() => result.current('medium'));
    expect(impactAsync).not.toHaveBeenCalled();
    // Web is a deliberate no-op, not a missing peer — warning here would fire on
    // every web app that renders a Bloom button.
    expect(warn).not.toHaveBeenCalled();
  });

  it('no-ops when disabled via BloomHapticsProvider', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHaptics, BloomHapticsProvider, impactAsync } = loadWithHaptics();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BloomHapticsProvider enabled={false}>{children}</BloomHapticsProvider>
    );
    const { result } = renderHook(() => useHaptics(), { wrapper });
    act(() => result.current('medium'));
    expect(impactAsync).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('degrades to a no-op instead of throwing when the peer is absent', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHaptics } = loadWithHaptics(() => {
      throw new Error(`Cannot find module '${HAPTICS}'`);
    });
    const { result } = renderHook(() => useHaptics());
    expect(() => act(() => result.current('heavy'))).not.toThrow();
  });

  it('names the missing package once, not once per call', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHaptics } = loadWithHaptics(() => {
      throw new Error(`Cannot find module '${HAPTICS}'`);
    });
    const { result } = renderHook(() => useHaptics());

    act(() => result.current('heavy'));
    act(() => result.current('light'));

    expect(warn).toHaveBeenCalledTimes(1);
    const [message] = warn.mock.calls[0] as [string];
    // An actionable warning has to carry all three: what broke, which package,
    // and how to fix it. A bare "haptics missing" sends the reader to Bloom.
    expect(message).toContain(HAPTICS);
    expect(message).toContain('inert');
    expect(message).toContain('expo install');
    // …and the underlying resolution error, so a shape/version failure is not
    // reported as if the package were simply not installed.
    expect(message).toContain('Cannot find module');
  });

  it('warns when the peer resolves but has no impactAsync', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHaptics } = loadWithHaptics(() => ({ notificationAsync: jest.fn() }));
    const { result } = renderHook(() => useHaptics());

    act(() => result.current());

    expect(warn).toHaveBeenCalledTimes(1);
    expect((warn.mock.calls[0] as [string])[0]).toContain('without an `impactAsync`');
  });

  it('stays silent in production', () => {
    ReactNative.Platform.OS = 'ios';
    const previous = process.env.NODE_ENV;
    // Metro and Vite fold this branch away entirely; jest cannot, so the guard
    // is asserted at runtime instead.
    process.env.NODE_ENV = 'production';
    try {
      const { useHaptics } = loadWithHaptics(() => {
        throw new Error(`Cannot find module '${HAPTICS}'`);
      });
      const { result } = renderHook(() => useHaptics());
      act(() => result.current());
      expect(warn).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

describe('useHapticFeedback', () => {
  afterEach(() => {
    ReactNative.Platform.OS = originalOS;
    jest.resetModules();
    jest.dontMock(HAPTICS);
    jest.clearAllMocks();
  });

  it('uses selection and notification feedback for semantic events', () => {
    ReactNative.Platform.OS = 'ios';
    const selectionAsync = jest.fn(async () => {});
    const notificationAsync = jest.fn(async (_type?: string) => {});
    const impactAsync = jest.fn(async (_style?: string) => {});
    const { useHapticFeedback } = loadWithHaptics(() => ({
      ImpactFeedbackStyle: STYLES,
      NotificationFeedbackType: { Success: 'success', Error: 'error' },
      impactAsync,
      selectionAsync,
      notificationAsync,
    }));
    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.tap();
      result.current.confirm();
      result.current.selection();
      result.current.toggle(true);
      result.current.success();
      result.current.error();
    });
    expect(impactAsync.mock.calls.map(([style]) => style)).toEqual(['light', 'medium']);
    expect(selectionAsync).toHaveBeenCalledTimes(2);
    expect(notificationAsync.mock.calls.map(([type]) => type)).toEqual(['success', 'error']);
  });

  it('falls back to impact on iOS when the peer lacks semantic methods', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHapticFeedback, impactAsync } = loadWithHaptics();
    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.selection();
      result.current.success();
      result.current.error();
    });
    expect(impactAsync).toHaveBeenCalledTimes(3);
  });

  it('maps Android intents to system view feedback, including older API fallbacks', () => {
    ReactNative.Platform.OS = 'android';
    const performAndroidHapticsAsync = jest.fn(async (_type: string) => {});
    const impactAsync = jest.fn(async (_style?: string) => {});
    const selectionAsync = jest.fn(async () => {});
    const notificationAsync = jest.fn(async (_type?: string) => {});
    const { useHapticFeedback } = loadWithHaptics(() => ({
      ImpactFeedbackStyle: STYLES,
      NotificationFeedbackType: { Success: 'success', Error: 'error' },
      impactAsync,
      selectionAsync,
      notificationAsync,
      performAndroidHapticsAsync,
    }));
    const { resolveAndroidHapticIntent } =
      require('../hooks/use-haptics') as typeof import('../hooks/use-haptics');
    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.tap();
      result.current.confirm();
      result.current.selection();
      result.current.toggle(true);
      result.current.toggle(false);
      result.current.success();
      result.current.error();
    });
    const apiLevel =
      typeof ReactNative.Platform.Version === 'number' ? ReactNative.Platform.Version : 24;
    expect(performAndroidHapticsAsync.mock.calls.map(([value]) => value)).toEqual(
      (['tap', 'confirm', 'selection', 'toggleOn', 'toggleOff', 'success', 'error'] as const).map(
        (intent) => resolveAndroidHapticIntent(intent, apiLevel),
      ),
    );
    expect(impactAsync).not.toHaveBeenCalled();
    expect(selectionAsync).not.toHaveBeenCalled();
    expect(notificationAsync).not.toHaveBeenCalled();
    expect(resolveAndroidHapticIntent('selection', 33)).toBe('context-click');
    expect(resolveAndroidHapticIntent('selection', 34)).toBe('segment-tick');
    expect(resolveAndroidHapticIntent('toggleOn', 33)).toBe('context-click');
    expect(resolveAndroidHapticIntent('toggleOff', 33)).toBe('clock-tick');
    expect(resolveAndroidHapticIntent('toggleOn', 34)).toBe('toggle-on');
    expect(resolveAndroidHapticIntent('toggleOff', 34)).toBe('toggle-off');
    expect(resolveAndroidHapticIntent('confirm', 29)).toBe('virtual-key');
    expect(resolveAndroidHapticIntent('error', 29)).toBe('long-press');
    expect(resolveAndroidHapticIntent('success', 30)).toBe('confirm');
    expect(resolveAndroidHapticIntent('error', 30)).toBe('reject');
  });

  it('stays silent on Android when the peer lacks view feedback', () => {
    ReactNative.Platform.OS = 'android';
    const { useHapticFeedback, impactAsync } = loadWithHaptics();
    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.tap();
      result.current.selection();
      result.current.success();
    });
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it('never invokes Android feedback when disabled by the provider', () => {
    ReactNative.Platform.OS = 'android';
    const performAndroidHapticsAsync = jest.fn(async (_type: string) => {});
    const { useHapticFeedback, BloomHapticsProvider } = loadWithHaptics(() => ({
      ImpactFeedbackStyle: STYLES,
      impactAsync: jest.fn(async () => {}),
      performAndroidHapticsAsync,
    }));
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BloomHapticsProvider enabled={false}>{children}</BloomHapticsProvider>
    );
    const { result } = renderHook(() => useHapticFeedback(), { wrapper });
    act(() => {
      result.current.tap();
      result.current.toggle(false);
      result.current.error();
    });
    expect(performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it.each(['ios', 'android'] as const)(
    'handles native rejections on %s without unhandled promises',
    async (platform) => {
      const catches: jest.SpyInstance[] = [];
      const reject = () => {
        const promise = Promise.reject(new Error('native feedback unavailable'));
        catches.push(jest.spyOn(promise, 'catch'));
        return promise;
      };

      ReactNative.Platform.OS = platform;
      const { useHapticFeedback } = loadWithHaptics(() => ({
        ImpactFeedbackStyle: STYLES,
        NotificationFeedbackType: { Success: 'success', Error: 'error' },
        impactAsync: reject,
        selectionAsync: reject,
        notificationAsync: reject,
        performAndroidHapticsAsync: reject,
      }));
      const hook = renderHook(() => useHapticFeedback());
      await act(async () => {
        hook.result.current.tap();
        hook.result.current.selection();
        hook.result.current.error();
        await Promise.resolve();
      });
      expect(catches).toHaveLength(3);
      for (const caught of catches) expect(caught).toHaveBeenCalledTimes(1);
    },
  );

  it('honors the provider', () => {
    ReactNative.Platform.OS = 'ios';
    const { useHapticFeedback, BloomHapticsProvider, impactAsync } = loadWithHaptics();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BloomHapticsProvider enabled={false}>{children}</BloomHapticsProvider>
    );
    const { result } = renderHook(() => useHapticFeedback(), { wrapper });
    act(() => {
      result.current.tap();
      result.current.selection();
      result.current.success();
    });
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it('does nothing on web or when the peer is absent', () => {
    ReactNative.Platform.OS = 'web';
    const web = loadWithHaptics();
    const webHook = renderHook(() => web.useHapticFeedback());
    act(() => {
      webHook.result.current.tap();
      webHook.result.current.selection();
      webHook.result.current.error();
    });
    expect(web.impactAsync).not.toHaveBeenCalled();

    ReactNative.Platform.OS = 'ios';
    const missing = loadWithHaptics(() => {
      throw new Error('missing peer');
    });
    const missingHook = renderHook(() => missing.useHapticFeedback());
    expect(() => act(() => missingHook.result.current.success())).not.toThrow();
  });
});
