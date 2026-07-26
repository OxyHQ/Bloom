import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { render } from '@testing-library/react-native';

import type { TabBarSurfaceProps } from '../tab-bar/shared';
import type { TabBarTheme } from '../tab-bar/types';

/**
 * The native capsule surface must DEGRADE, never crash, when `expo-glass-effect`
 * is not really usable.
 *
 * This is the one thing the rest of the tab-bar suite structurally cannot see.
 * `TabBar.test.tsx` renders the native surface against the manual mock in
 * `__mocks__/expo-glass-effect.ts`, which is a HEALTHY install reporting
 * `isLiquidGlassAvailable() === false` — so it only ever exercises the branch a
 * correctly-packaged Android device takes. Every failure mode below is a
 * different install: the module resolved but handed back no exports, or the JS
 * package is there while the native module is not.
 *
 * Each case is re-mocked into its own module registry because both hazards live at
 * MODULE scope. `Animated.createAnimatedComponent(GlassView)` runs on import, and
 * on iOS `isLiquidGlassAvailable()` reaches a native module through
 * `requireNativeModule`, which throws by contract when it is absent. Mocking after
 * the module under test was imported would test a render branch and miss both.
 *
 * The two counter-tests at the end are what keep the rest honest: a guard that
 * always fell through to the solid surface would satisfy every other assertion
 * here while silently deleting the glass look on every iOS 26 device.
 */

/** Every export may be absent — that is the whole point of these fixtures. */
interface GlassEffectModule {
  GlassView?: unknown;
  isLiquidGlassAvailable?: () => boolean;
  isGlassEffectAPIAvailable?: () => boolean;
}

/**
 * A host tag stands in for the real `GlassView` component: under the reanimated
 * mock `createAnimatedComponent` is the identity, so whatever the package exports
 * IS the element type, and a string host is the cheapest valid one to assert on.
 * It matches the tag the manual mock renders.
 */
const GLASS_HOST = 'GlassView';

const THEME: TabBarTheme = {
  activeTint: 'rgb(20 20 20)',
  inactiveTint: 'rgb(120 120 120)',
  highlight: 'rgb(230 230 230)',
  glassTint: 'rgba(255, 255, 255, 0.55)',
  solidFallback: 'rgb(246 246 246)',
};

const STYLE = { borderRadius: 29 };

function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (s: unknown): void => {
    if (Array.isArray(s)) s.forEach(visit);
    else if (s && typeof s === 'object') Object.assign(out, s);
  };
  visit(style);
  return out;
}

/** Every host node rendered as `tag`. */
function hosts(root: ReactTestInstance, tag: string): ReactTestInstance[] {
  return root.findAll((node) => typeof node.type === 'string' && node.type === tag);
}

/**
 * Render `surface.native.tsx` against a given `expo-glass-effect`.
 *
 * Only the surface comes from the isolated registry — testing-library registers
 * suite-level hooks when it loads, so it has to be imported at the top of the file
 * rather than inside a test. Nothing in the rendered tree calls a hook, and the
 * surface renders host strings from the reanimated mock, so the two registries
 * never have to agree on a React instance. `times` re-renders within one registry,
 * for the assertion about module-scoped memoization.
 */
function renderNativeSurface(glassEffect: GlassEffectModule, times = 1): ReactTestInstance {
  let root: ReactTestInstance | undefined;

  jest.isolateModules(() => {
    jest.doMock('expo-glass-effect', () => glassEffect);

    const { TabBarSurface } = require('../tab-bar/surface.native') as {
      TabBarSurface: React.ComponentType<TabBarSurfaceProps>;
    };

    for (let i = 0; i < times; i += 1) {
      root = render(<TabBarSurface theme={THEME} style={STYLE} />).UNSAFE_root;
    }
  });

  if (!root) throw new Error('the native surface did not render');
  return root;
}

/** Assert the tree is the opaque non-glass surface, filled from the theme. */
function expectSolidFallback(root: ReactTestInstance): void {
  expect(hosts(root, GLASS_HOST)).toHaveLength(0);
  const surface = hosts(root, 'Animated.View')[0];
  expect(surface).toBeTruthy();
  expect(flattenStyle(surface?.props.style).backgroundColor).toBe(THEME.solidFallback);
  // The animated capsule radius must survive the fallback — the pill still
  // reshapes as the bar minimizes.
  expect(flattenStyle(surface?.props.style).borderRadius).toBe(STYLE.borderRadius);
}

describe('TabBarSurface (native) — degrading when glass is unusable', () => {
  let warn: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    jest.resetModules();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('falls back when the module resolved without GlassView', () => {
    // `createAnimatedComponent(undefined)` produces an element type React rejects
    // with "Element type is invalid … but got: undefined" — and it happens at
    // import, so the whole screen the bar is on goes down with it.
    expectSolidFallback(
      renderNativeSurface({ GlassView: undefined, isLiquidGlassAvailable: () => true }),
    );
  });

  it('falls back when the module delivered no exports at all', () => {
    // A stub, an alias, or a resolver that landed on a platform-specific file:
    // there is no `isLiquidGlassAvailable` to call either, so calling it blindly
    // is a TypeError.
    expectSolidFallback(renderNativeSurface({}));
  });

  it('falls back when the native module is missing from the build', () => {
    // On iOS `isLiquidGlassAvailable()` resolves `ExpoGlassEffect` through
    // `requireNativeModule`, which THROWS by contract when the module is not in
    // the binary — an OTA JS update landing on a binary built before the package
    // was linked reaches exactly this state.
    expectSolidFallback(
      renderNativeSurface({
        GlassView: GLASS_HOST,
        isLiquidGlassAvailable: () => {
          throw new Error("Cannot find native module 'ExpoGlassEffect'");
        },
      }),
    );
  });

  it('reports the missing native module instead of swallowing it', () => {
    renderNativeSurface({
      GlassView: GLASS_HOST,
      isLiquidGlassAvailable: () => {
        throw new Error("Cannot find native module 'ExpoGlassEffect'");
      },
    });

    expect(warn).toHaveBeenCalledTimes(1);
    const [message, detail] = warn.mock.calls[0] ?? [];
    expect(String(message)).toContain('expo-glass-effect');
    expect(String(detail)).toContain("Cannot find native module 'ExpoGlassEffect'");
  });

  it('falls back when the platform has no glass API (iOS 26 betas)', () => {
    // Upstream's own guard: on those builds `isLiquidGlassAvailable()` answers
    // true while touching `GlassView` crashes NATIVELY, below JS.
    expectSolidFallback(
      renderNativeSurface({
        GlassView: GLASS_HOST,
        isLiquidGlassAvailable: () => true,
        isGlassEffectAPIAvailable: () => false,
      }),
    );
  });

  it('renders real glass when the package is fully there', () => {
    const root = renderNativeSurface({
      GlassView: GLASS_HOST,
      isLiquidGlassAvailable: () => true,
      isGlassEffectAPIAvailable: () => true,
    });

    const glass = hosts(root, GLASS_HOST)[0];
    expect(glass).toBeTruthy();
    expect(glass?.props.glassEffectStyle).toBe('regular');
    expect(flattenStyle(glass?.props.style).backgroundColor).toBe(THEME.glassTint);
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders glass on a version that predates isGlassEffectAPIAvailable', () => {
    // The peer floor is `>=0.1.5`, which exports no API probe at all. A missing
    // probe means "not applicable", never "unavailable" — treating it as the
    // latter would delete the glass look on every version below 56.
    expect(
      hosts(
        renderNativeSurface({ GlassView: GLASS_HOST, isLiquidGlassAvailable: () => true }),
        GLASS_HOST,
      ),
    ).toHaveLength(1);
  });

  it('probes availability once per session, not once per render', () => {
    let probes = 0;
    renderNativeSurface(
      {
        GlassView: GLASS_HOST,
        isLiquidGlassAvailable: () => {
          probes += 1;
          return true;
        },
      },
      3,
    );
    expect(probes).toBe(1);
  });

  it('reuses the neutral surface rather than a second implementation', () => {
    // Two copies of the fallback would drift: the neutral variant is what web
    // bundlers and a consumer's `tsc` resolve, and it must paint exactly what an
    // Android device paints.
    jest.isolateModules(() => {
      const { TabBarSurface } = require('../tab-bar/surface') as { TabBarSurface: unknown };
      const { SolidTabBarSurface } = require('../tab-bar/surface-solid') as {
        SolidTabBarSurface: unknown;
      };
      expect(TabBarSurface).toBe(SolidTabBarSurface);
    });
  });
});
