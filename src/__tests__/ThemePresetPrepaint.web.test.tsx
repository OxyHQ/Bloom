/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Platform } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { getThemeBootstrap } from '../theme/prepaint';
import { BloomColorScope } from '../theme/color-scope/ColorScope.web';
import { useThemeRecipe } from '../theme/use-theme-paint';
import { useBloomTheme } from '../theme/use-theme';
import { resolvePaintMode, themePaintRecipe, presetPaintCss } from '../theme/paint';
import { ServerStyleContext } from '../styles/context';
import {
  SurfaceLevelProvider,
  useSurfaceFillRecipe,
  surfaceFillOn,
} from '../styles/surface-levels';
import { buildTheme } from '../theme/build-theme';
import * as namedPalettes from '../theme/prepaint-palettes';
import { adoptStyleSheet, dropStyleSheet } from '../styles/adopt-style-sheet';

jest.mock('../fonts/FontLoader', () => ({
  FontLoader: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../styles/adopt-style-sheet', () => ({
  adoptStyleSheet: jest.fn(),
  dropStyleSheet: jest.fn(),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const config = {
  persistKey: 'app-theme',
  modeStorageKey: 'app-mode',
  defaultColorPreset: 'oxy' as const,
};
const storage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
};
const oldPlatform = Platform.OS;
beforeEach(() => {
  Platform.OS = 'web';
  localStorage.clear();
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-bloom-theme-mode');
  document.documentElement.removeAttribute('data-bloom-theme-preset');
  jest.clearAllMocks();
});
afterEach(() => {
  Platform.OS = oldPlatform;
  jest.restoreAllMocks();
});
function bootstrap(blocked = false) {
  const script = getThemeBootstrap(config).script;
  new Function('document', 'localStorage', 'matchMedia', script)(
    document,
    blocked
      ? {
          getItem() {
            throw new Error('blocked');
          },
        }
      : localStorage,
    () => ({ matches: false }),
  );
}
function Probe() {
  const recipe = useThemeRecipe((theme) => ({
    fill: theme.colors.background,
    border: theme.colors.primary,
  }));
  const { colorPreset } = useBloomTheme();
  return (
    <>
      {recipe.sheet}
      <main data-preset={colorPreset} style={{ backgroundColor: recipe.paint.fill }}>
        Mail
      </main>
    </>
  );
}
function Fixture({ persist = true }: { persist?: boolean }) {
  return (
    <ServerStyleContext.Provider value="inline">
      <BloomThemeProvider
        fonts={false}
        prepaintTheme={config}
        storage={persist ? storage : undefined}
        awaitHydration={false}
      >
        <Probe />
      </BloomThemeProvider>
    </ServerStyleContext.Provider>
  );
}

it('reads the existing JSON preset and lets the legacy plain mode override its mode', () => {
  localStorage.setItem('app-theme', JSON.stringify({ mode: 'dark', colorPreset: 'yellow' }));
  localStorage.setItem('app-mode', 'light');
  bootstrap();
  expect(document.documentElement.getAttribute('data-bloom-theme-preset')).toBe('yellow');
  expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe('light');
  localStorage.setItem('app-mode', 'invalid');
  bootstrap();
  expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe('dark');
});
it.each([
  'garbage',
  JSON.stringify({ colorPreset: '</style><script>evil()</script>', mode: 'invalid' }),
  JSON.stringify({ colorPreset: 42 }),
])('rejects invalid persisted theme %s', (raw) => {
  localStorage.setItem('app-theme', raw);
  bootstrap();
  expect(document.documentElement.getAttribute('data-bloom-theme-preset')).toBe('oxy');
  expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe('light');
});
it('tolerates blocked storage without executing its contents', () => {
  expect(() => bootstrap(true)).not.toThrow();
  expect(document.documentElement.getAttribute('data-bloom-theme-preset')).toBe('oxy');
});
it('retains variations across presets even when light and dark match', () => {
  const l: Record<string, string> = {},
    d: Record<string, string> = {};
  expect(themePaintRecipe('red', 'red', 'red', '--paint', l, d, true)).toBe('var(--paint)');
  const css = presetPaintCss(
    [
      { preset: 'oxy', light: l, dark: d },
      { preset: 'yellow', light: { '--paint': 'yellow' }, dark: { '--paint': 'yellow' } },
    ],
    'oxy',
  );
  expect(css).toContain(
    '[data-bloom-theme-preset="yellow"][data-bloom-theme-mode="light"]{--paint:yellow;}',
  );
});
it('adopts server preset sheets verbatim, then publishes only the restored preset without recomputing the registry', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(<Fixture persist={false} />);
  const original = host.querySelector('main');
  const style = host.querySelector('style');
  if (!style) throw new Error('Missing server paint sheet');
  const id = style.getAttribute('data-bloom-server-style') ?? '';
  const serverCss = style.textContent ?? '';
  localStorage.setItem('app-theme', JSON.stringify({ mode: 'dark', colorPreset: 'yellow' }));
  bootstrap();
  const paletteSpy = jest.spyOn(namedPalettes, 'getPrepaintPalette');
  const errors: unknown[] = [];
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation((...args) => errors.push(args));
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <Fixture />, { onRecoverableError: (e) => errors.push(e) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelector('main')).toBe(original);
    expect(original?.getAttribute('data-preset')).toBe('yellow');
    expect(document.documentElement.getAttribute('data-bloom-theme-preset')).toBe('yellow');
    expect(paletteSpy.mock.calls.length).toBeLessThan(4);
    const writes = jest
      .mocked(adoptStyleSheet)
      .mock.calls.filter(([owner]) => owner === id)
      .map(([, css]) => css);
    expect(writes[0]).toBe(serverCss);
    expect(writes.length).toBeGreaterThan(1);
    for (const css of writes.slice(1))
      expect(
        css === serverCss || css.includes(buildTheme('yellow', 'dark').colors.background),
      ).toBe(true);
    expect(host.querySelector('style')).toBeNull();
  } finally {
    await act(async () => root?.unmount());
    host.remove();
    consoleError.mockRestore();
  }
  expect(dropStyleSheet).toHaveBeenCalledWith(id);
});
it('does not compute server preset variants on a client-only mount', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  localStorage.setItem('app-theme', JSON.stringify({ colorPreset: 'blue' }));
  const spy = jest.spyOn(namedPalettes, 'getPrepaintPalette');
  const root = createRoot(host);
  try {
    await act(async () => root.render(<Fixture />));
    expect(spy.mock.calls.length).toBeLessThan(4);
    expect(host.querySelector('main')?.getAttribute('data-preset')).toBe('blue');
    expect(host.querySelector('style')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
it('resolves a fixed light child against the requested root preset and mode backing', () => {
  let observed: Record<string, string> = {};
  function Child() {
    const parent = useSurfaceFillRecipe();
    const material = useThemeRecipe((theme, mode, preset) =>
      surfaceFillOn(theme, resolvePaintMode(parent, mode, preset)),
    );
    observed = {
      yellow: material.resolvePreset('yellow', 'dark'),
      blue: material.resolvePreset('blue', 'dark'),
    };
    return (
      <>
        {material.sheet}
        <span>Child</span>
      </>
    );
  }
  function Parent() {
    const fill = useThemeRecipe((theme) => theme.colors.background);
    return (
      <>
        {fill.sheet}
        <SurfaceLevelProvider level={0} fill={fill.current} fillModes={fill}>
          <BloomColorScope colorPreset="pink" mode="light">
            <Child />
          </BloomColorScope>
        </SurfaceLevelProvider>
      </>
    );
  }
  renderToString(
    <ServerStyleContext.Provider value="inline">
      <BloomThemeProvider fonts={false} prepaintTheme={config}>
        <Parent />
      </BloomThemeProvider>
    </ServerStyleContext.Provider>,
  );
  const child = buildTheme('pink', 'light');
  expect(observed.yellow).toBe(
    surfaceFillOn(child, buildTheme('yellow', 'dark').colors.background),
  );
  expect(observed.blue).toBe(surfaceFillOn(child, buildTheme('blue', 'dark').colors.background));
  expect(observed.yellow).not.toBe(observed.blue);
});

it('retains the head-selected palette while an asynchronous web adapter restores it', async () => {
  let resolveStored!: (raw: string) => void;
  const pending = new Promise<string>((resolve) => {
    resolveStored = resolve;
  });
  const asyncStorage = { getItem: () => pending, setItem: () => {} };
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(<Fixture persist={false} />);
  const original = host.querySelector('main');
  const style = host.querySelector('style');
  if (!style) throw new Error('Missing server paint sheet');
  const id = style.getAttribute('data-bloom-server-style') ?? '';
  const serverCss = style.textContent ?? '';
  localStorage.setItem('app-theme', JSON.stringify({ colorPreset: 'yellow', mode: 'dark' }));
  bootstrap();
  let root: Root | undefined;
  const errors: unknown[] = [];
  try {
    await act(async () => {
      root = hydrateRoot(
        host,
        <ServerStyleContext.Provider value="inline">
          <BloomThemeProvider
            fonts={false}
            prepaintTheme={config}
            storage={asyncStorage}
            awaitHydration={false}
          >
            <Probe />
          </BloomThemeProvider>
        </ServerStyleContext.Provider>,
        { onRecoverableError: (e) => errors.push(e) },
      );
    });
    expect(document.documentElement.getAttribute('data-bloom-theme-preset')).toBe('yellow');
    const initialWrites = jest
      .mocked(adoptStyleSheet)
      .mock.calls.filter(([owner]) => owner === id)
      .map(([, css]) => css);
    expect(initialWrites.length).toBeGreaterThan(0);
    expect(initialWrites.every((css) => css === serverCss)).toBe(true);
    await act(async () => {
      resolveStored(JSON.stringify({ colorPreset: 'yellow', mode: 'dark' }));
      await pending;
    });
    expect(errors).toEqual([]);
    expect(host.querySelector('main')).toBe(original);
    expect(original?.getAttribute('data-preset')).toBe('yellow');
    expect(document.documentElement.getAttribute('data-bloom-theme-preset')).toBe('yellow');
  } finally {
    await act(async () => root?.unmount());
    host.remove();
  }
});
