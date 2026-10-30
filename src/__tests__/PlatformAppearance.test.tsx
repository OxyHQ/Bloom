/**
 * The `appearance` capability (OxyOS ADR 0019, decision 4): the platform's
 * accent seeds the palette of every app that has no colour of its own (or that
 * follows the platform's anyway), and its reduce transparency draws every blur
 * Bloom paints in JavaScript as its tint alone. Without the capability nothing
 * changes; `zz` before/after host trees were compared for that, and the cases
 * below pin it too.
 */
import type React from 'react';
import { useEffect } from 'react';
import { Platform, Text } from 'react-native';
import { act, render, renderHook } from '@testing-library/react-native';

import { Backdrop } from '../overlay';
import { blurTintColor } from '../overlay/backdrop-paint';
import { PlatformSurfaceProvider, usePlatformAppearance } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { usePlatformAppearanceState } from '../platform-surface/use-platform-appearance';
import { ProgressiveBlur } from '../progressive-blur';
import { ProgressiveBlur as WebProgressiveBlur } from '../progressive-blur/ProgressiveBlur.web';
import { BloomProvider } from '../provider';
import { BloomThemeProvider, type BloomThemeProviderProps } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import type { AppColorName } from '../theme/color-presets';
import type { BloomThemeStorage } from '../theme/persistence';
import { useReducedTransparency } from '../theme/reduced-transparency';
import { useBloomTheme } from '../theme/use-theme';
import { fakeAppearance } from './support/fake-appearance';
import { hostNodes, resolvedStyle } from './support/rendered-style';

const NONE: PlatformSurfaceAdapter = { platform: 'test', capabilities: new Set() };

type ThemeProps = Omit<BloomThemeProviderProps, 'children'>;

let api: ReturnType<typeof useBloomTheme> | null = null;
let mounts = 0;

function Probe() {
  const theme = useBloomTheme();
  api = theme;
  const reduced = useReducedTransparency();
  useEffect(() => {
    mounts += 1;
  }, []);
  return (
    <>
      <Text testID="preset">{theme.colorPreset}</Text>
      <Text testID="primary">{theme.theme.colors.primary}</Text>
      <Text testID="reduced">{String(reduced)}</Text>
    </>
  );
}

function mount(adapter: PlatformSurfaceAdapter | null, props: ThemeProps = {}) {
  return render(
    <PlatformSurfaceProvider value={adapter}>
      <BloomThemeProvider mode="light" fonts={false} {...props}>
        <Probe />
      </BloomThemeProvider>
    </PlatformSurfaceProvider>,
  );
}

const primaryOf = (preset: AppColorName) => buildTheme(preset, 'light').colors.primary;

function expectPreset(tree: ReturnType<typeof render>, preset: AppColorName) {
  expect(tree.getByTestId('preset').props.children).toBe(preset);
  expect(tree.getByTestId('primary').props.children).toBe(primaryOf(preset));
}

function storage(): BloomThemeStorage & { store: Record<string, string> } {
  const store: Record<string, string> = {};
  return {
    store,
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
}

beforeEach(() => {
  api = null;
  mounts = 0;
});

describe('usePlatformAppearance', () => {
  it('is null without an adapter or without the capability', () => {
    for (const adapter of [null, NONE]) {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>
      );
      expect(renderHook(() => usePlatformAppearance(), { wrapper }).result.current).toBe(null);
      expect(renderHook(() => usePlatformAppearanceState(), { wrapper }).result.current).toBe(null);
    }
  });

  it('throws when the capability is reported without an appearance', () => {
    const broken: PlatformSurfaceAdapter = {
      platform: 'broken',
      capabilities: new Set(['appearance']),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlatformSurfaceProvider value={broken}>{children}</PlatformSurfaceProvider>
    );
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => usePlatformAppearance(), { wrapper })).toThrow(
      "the broken platform adapter reports 'appearance' without an appearance",
    );
    spy.mockRestore();
  });

  it('reads the state as a store: a fresh but equal object is not a change', () => {
    const { appearance, adapter } = fakeAppearance({ accent: 'blue' });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>
    );
    const hook = renderHook(() => usePlatformAppearanceState(), { wrapper });
    const first = hook.result.current;
    expect(first).toEqual({ accent: 'blue', reduceTransparency: false });
    act(() => appearance.set({}));
    expect(hook.result.current).toBe(first);
    act(() => appearance.set({ reduceTransparency: true }));
    expect(hook.result.current).toEqual({ accent: 'blue', reduceTransparency: true });
    hook.unmount();
    expect(appearance.listenerCount()).toBe(0);
  });
});

describe('the accent', () => {
  it('seeds the palette of an app with no colour of its own', () => {
    expectPreset(mount(fakeAppearance({ accent: 'pink' }).adapter), 'pink');
  });

  it('follows a change at once, with no remount', () => {
    const { appearance, adapter } = fakeAppearance({ accent: 'pink' });
    const tree = mount(adapter);
    act(() => appearance.set({ accent: 'green' }));
    expectPreset(tree, 'green');
    act(() => appearance.set({ accent: null }));
    expectPreset(tree, 'oxy');
    expect(mounts).toBe(1);
  });

  it('is no accent when Bloom does not know its name: the app keeps its default', () => {
    for (const accent of ['ocean-blue', 'Pink', '', 'toString', '__proto__']) {
      expectPreset(mount(fakeAppearance({ accent }).adapter), 'oxy');
      expectPreset(
        mount(fakeAppearance({ accent }).adapter, {
          defaultColorPreset: 'teal',
          followSystemAccent: true,
        }),
        'teal',
      );
    }
  });

  it("never replaces an app's own default or controlled colour", () => {
    const { adapter } = fakeAppearance({ accent: 'pink' });
    expectPreset(mount(adapter, { defaultColorPreset: 'teal' }), 'teal');
    expectPreset(mount(adapter, { colorPreset: 'blue' }), 'blue');
    expectPreset(
      mount(adapter, { prepaintTheme: { defaultColorPreset: 'purple' } as never }),
      'purple',
    );
  });

  it('wins over them with followSystemAccent, which falls back to them without an accent', () => {
    const { appearance, adapter } = fakeAppearance({ accent: 'pink' });
    const controlled = mount(adapter, { colorPreset: 'blue', followSystemAccent: true });
    const byDefault = mount(adapter, { defaultColorPreset: 'teal', followSystemAccent: true });
    expectPreset(controlled, 'pink');
    expectPreset(byDefault, 'pink');
    act(() => appearance.set({ accent: null }));
    expectPreset(controlled, 'blue');
    expectPreset(byDefault, 'teal');
  });

  it('gives way to a preset the person chose in the app, until resetTheme', () => {
    const { adapter } = fakeAppearance({ accent: 'pink' });
    const onColorPresetChange = jest.fn();
    const tree = mount(adapter, { onColorPresetChange });
    act(() => api?.setColorPreset('blue'));
    expectPreset(tree, 'blue');
    act(() => api?.resetTheme());
    expectPreset(tree, 'pink');
    expect(onColorPresetChange).toHaveBeenLastCalledWith('pink');
  });

  it('is never persisted as the app’s choice', () => {
    const { adapter } = fakeAppearance({ accent: 'pink' });
    const store = storage();
    mount(adapter, { persistKey: 'theme', storage: store });
    act(() => api?.setMode('dark'));
    expect(JSON.parse(store.store.theme ?? '{}')).toEqual({ mode: 'dark' });
  });

  it('a persisted choice is the app’s own', () => {
    const store = storage();
    store.store.theme = JSON.stringify({ colorPreset: 'red' });
    expectPreset(
      mount(fakeAppearance({ accent: 'pink' }).adapter, { persistKey: 'theme', storage: store }),
      'red',
    );
  });

  it('leaves a dynamic seed in charge of the palette', () => {
    const tree = mount(fakeAppearance({ accent: 'pink' }).adapter, { seed: '#1e88e5' });
    expect(tree.getByTestId('primary').props.children).not.toBe(primaryOf('pink'));
  });

  it('reaches every app through BloomProvider platform', () => {
    const tree = render(
      <BloomProvider platform={fakeAppearance({ accent: 'purple' }).adapter} fonts={false}>
        <Probe />
      </BloomProvider>,
    );
    expect(tree.getByTestId('preset').props.children).toBe('purple');
  });

  it('changes nothing without the capability', () => {
    for (const adapter of [null, NONE]) {
      expectPreset(mount(adapter), 'oxy');
      expectPreset(
        mount(adapter, { defaultColorPreset: 'teal', followSystemAccent: true }),
        'teal',
      );
    }
    const onColorPresetChange = jest.fn();
    mount(null, { onColorPresetChange });
    act(() => api?.resetTheme());
    expect(onColorPresetChange).toHaveBeenLastCalledWith('oxy');
  });
});

describe('reduce transparency', () => {
  it('is the platform’s, or the provider prop’s, and follows a change', () => {
    const { appearance, adapter } = fakeAppearance();
    const tree = mount(adapter);
    expect(tree.getByTestId('reduced').props.children).toBe('false');
    act(() => appearance.set({ reduceTransparency: true }));
    expect(tree.getByTestId('reduced').props.children).toBe('true');
    expect(mount(null, { reduceTransparency: true }).getByTestId('reduced').props.children).toBe(
      'true',
    );
    expect(mount(NONE).getByTestId('reduced').props.children).toBe('false');
  });

  it('is false outside a provider', () => {
    expect(renderHook(() => useReducedTransparency()).result.current).toBe(false);
  });

  function inApp(ui: React.ReactElement, reduceTransparency: boolean) {
    return render(
      <PlatformSurfaceProvider value={fakeAppearance({ reduceTransparency }).adapter}>
        <BloomThemeProvider mode="light" fonts={false}>
          {ui}
        </BloomThemeProvider>
      </PlatformSurfaceProvider>,
    );
  }
  const blurViews = (tree: ReturnType<typeof render>) =>
    tree.UNSAFE_root.findAllByType('BlurView' as never);
  const fills = (tree: ReturnType<typeof render>) =>
    hostNodes(tree.toJSON()).map((node) => resolvedStyle(node.props.style).backgroundColor);

  it.each([
    ['static', undefined],
    ['fading', { value: 1 }],
  ])('draws a %s backdrop as its tint and its dim, blurring nothing', (_, progress) => {
    const ui = (
      <Backdrop
        onPress={() => {}}
        progress={progress as never}
        blurIntensity={60}
        blurTint="dark"
        dimColor="#102030"
      />
    );
    const full = inApp(ui, false);
    expect(blurViews(full)).toHaveLength(1);
    const reduced = inApp(ui, true);
    expect(blurViews(reduced)).toHaveLength(0);
    expect(fills(reduced)).toContain(blurTintColor('dark', 60));
    expect(fills(reduced)).toContain('#102030');
    // The dim is the same layer either way.
    expect(fills(full)).toContain('#102030');
  });

  it('keeps a backdrop that asked for no blur exactly as it was', () => {
    const ui = <Backdrop onPress={() => {}} blurIntensity={0} />;
    expect(inApp(ui, true).toJSON()).toEqual(inApp(ui, false).toJSON());
  });

  it('draws a progressive blur’s layers as their tint', () => {
    const full = inApp(<ProgressiveBlur intensity={9} />, false);
    const reduced = inApp(<ProgressiveBlur intensity={9} />, true);
    const layers = blurViews(full).length;
    expect(layers).toBeGreaterThan(1);
    expect(blurViews(reduced)).toHaveLength(0);
    expect(fills(reduced).filter((fill) => fill === blurTintColor('light', 9))).toHaveLength(
      layers,
    );
  });

  it('takes the web progressive blur’s backdrop filter away and keeps its tail', () => {
    const style = (reduced: boolean) =>
      hostNodes(inApp(<WebProgressiveBlur />, reduced).toJSON())
        .map((node) => resolvedStyle(node.props.style))
        .find((entry) => entry.maskImage !== undefined);
    const full = style(false);
    const reduced = style(true);
    expect(full?.backdropFilter).toMatch(/^blur\(/);
    expect(reduced?.backdropFilter).toBeUndefined();
    expect(reduced?.WebkitBackdropFilter).toBeUndefined();
    expect(reduced?.backgroundImage).toBe(full?.backgroundImage);
    expect(reduced?.maskImage).toBe(full?.maskImage);
  });
});

describe('blurTintColor', () => {
  const os = Platform.OS;
  afterEach(() => {
    Platform.OS = os;
  });

  it('is the tint expo-blur draws on each platform', () => {
    Platform.OS = 'android';
    // TintStyle.toColorInt: (255 * 0.8 * 0.69).toInt() = 140.
    expect(blurTintColor('dark', 80)).toBe(
      `rgba(25, 25, 25, ${Math.round((140 / 255) * 1000) / 1000})`,
    );
    Platform.OS = 'web';
    expect(blurTintColor('dark', 80)).toBe('rgba(25, 25, 25, 0.624)');
    expect(blurTintColor('light', 50)).toBe('rgba(249, 249, 249, 0.39)');
    expect(blurTintColor('default', 100)).toBe('rgba(255, 255, 255, 0.3)');
    Platform.OS = 'ios';
    expect(blurTintColor('dark', 80)).toBe('rgba(25, 25, 25, 0.624)');
  });

  it('clamps the intensity', () => {
    Platform.OS = 'web';
    expect(blurTintColor('light', 250)).toBe(blurTintColor('light', 100));
    expect(blurTintColor('light', -5)).toBe('rgba(249, 249, 249, 0)');
  });
});
