/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { Platform } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomColorScope } from '../theme/color-scope/ColorScope.web';
import { useTheme } from '../theme/use-theme';
import { useNavigationTheme } from '../theme/use-navigation-theme';
import { useThemePaint, useThemeRecipe } from '../theme/use-theme-paint';
import { ServerStyleContext } from '../styles/context';
import { buildTheme } from '../theme/build-theme';
import { resolveSidebarPalette } from '../sidebar/palette';
import { resolveSurfaceOptics } from '../surface/shared';
import { paintDeclarations } from '../theme/paint';
import {
  SurfaceLevelProvider,
  useSurfaceFillRecipe,
  surfaceFillOn,
} from '../styles/surface-levels';
import { adoptStyleSheet, dropStyleSheet } from '../styles/adopt-style-sheet';

jest.mock('../fonts/FontLoader', () => ({
  FontLoader: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../styles/adopt-style-sheet', () => ({
  adoptStyleSheet: jest.fn(),
  dropStyleSheet: jest.fn(),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const originalPlatform = Platform.OS;
const config = { defaultColorPreset: 'blue' as const, modeStorageKey: 'paint-mode' };

function Probe({ id }: { id: string }) {
  const raw = useTheme();
  const colors = useThemePaint();
  const recipe = useThemeRecipe((theme) => ({
    sidebar: resolveSidebarPalette(theme),
    optics: resolveSurfaceOptics(theme.isDark),
  }));
  return (
    <>
      {recipe.sheet}
      <section
        data-testid={id}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          boxShadow: recipe.paint.sidebar.panelShadow,
        }}
      >
        <span data-raw-mode={raw.mode}>Stable contents</span>
        <div
          data-testid={`${id}-material`}
          style={{ boxShadow: recipe.paint.optics.sheenShadow }}
        />
      </section>
    </>
  );
}
function Fixture({ mode = 'system' }: { mode?: 'light' | 'dark' | 'system' }) {
  return (
    <ServerStyleContext.Provider value="inline">
      <BloomThemeProvider fonts={false} mode={mode} prepaintTheme={config}>
        <Probe id="root" />
        <BloomColorScope mode="light" colorPreset="pink">
          <Probe id="light" />
        </BloomColorScope>
        <BloomColorScope mode="dark" colorPreset="green">
          <Probe id="dark" />
        </BloomColorScope>
      </BloomThemeProvider>
    </ServerStyleContext.Provider>
  );
}

beforeEach(() => {
  Platform.OS = 'web';
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-bloom-theme-mode');
  jest.clearAllMocks();
});
afterEach(() => {
  Platform.OS = originalPlatform;
});

it('ships ordinary mode rules for semantic colours, shadows, gradients and fixed local scopes', () => {
  const html = renderToString(<Fixture />);
  const host = document.createElement('div');
  host.innerHTML = html;
  const styles = [...host.querySelectorAll('style')].map((node) => node.textContent).join('');
  expect(styles).toContain(':root[data-bloom-theme-mode="dark"]');
  expect(styles).toContain('@media(prefers-color-scheme:dark)');
  expect(styles).toContain(resolveSurfaceOptics(true).sheenShadow);
  expect(styles).toContain(resolveSurfaceOptics(false).rim);
  expect(styles).not.toContain('--bloom-theme-light');
  expect(html).toContain('var(--bloom-paint-background)');
  const lightScope = host.querySelector('[data-testid="light"]')?.parentElement;
  const darkScope = host.querySelector('[data-testid="dark"]')?.parentElement;
  expect(lightScope?.style.getPropertyValue('--bloom-paint-background')).toBe(
    buildTheme('pink', 'light').colors.background,
  );
  expect(darkScope?.style.getPropertyValue('--bloom-paint-background')).toBe(
    buildTheme('green', 'dark').colors.background,
  );
});

it('preserves SSR nodes and attributes when a stored dark preference hydrates, then changes mode', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(<Fixture />);
  const before = ['root', 'light', 'dark'].map((id) => host.querySelector(`[data-testid="${id}"]`));
  document.documentElement.setAttribute('data-bloom-theme-mode', 'dark');
  const errors: unknown[] = [];
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <Fixture mode="dark" />, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(errors).toEqual([]);
    expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe('dark');
    expect(
      host.querySelector('[data-testid="root"] [data-raw-mode]')?.getAttribute('data-raw-mode'),
    ).toBe('dark');
    expect(
      host.querySelector('[data-testid="light"] [data-raw-mode]')?.getAttribute('data-raw-mode'),
    ).toBe('light');
    await act(async () => root?.render(<Fixture mode="light" />));
    expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe('light');
    for (const [i, id] of ['root', 'light', 'dark'].entries())
      expect(host.querySelector(`[data-testid="${id}"]`)).toBe(before[i]);
    expect(host.querySelector('[data-bloom-server-style]')).toBeNull();
    expect(adoptStyleSheet).toHaveBeenCalled();
  } finally {
    await act(async () => root?.unmount());
    host.remove();
  }
  expect(dropStyleSheet).toHaveBeenCalled();
});

it('leaves native colour math and final paints concrete', () => {
  Platform.OS = 'ios';
  const html = renderToString(<Fixture mode="dark" />);
  expect(html).not.toContain('var(--bloom-paint-');
  expect(html).not.toContain('data-bloom-server-style');
});

it('escapes declaration delimiters in caller supplied paint', () => {
  expect(paintDeclarations({ '--paint': 'red;}body{color:blue' })).not.toContain(';}body{');
});

it('keeps a fixed light palette separate from its changing root backing', () => {
  const backings = {
    light: buildTheme('blue', 'light').colors.background,
    dark: buildTheme('blue', 'dark').colors.background,
  };
  function Child() {
    const parent = useSurfaceFillRecipe();
    const material = useThemeRecipe((theme, documentMode) =>
      surfaceFillOn(theme, parent[documentMode]),
    );
    return <div data-light={material.light} data-dark={material.dark} />;
  }
  const html = renderToString(
    <ServerStyleContext.Provider value="inline">
      <BloomThemeProvider fonts={false} prepaintTheme={config}>
        <SurfaceLevelProvider level={0} fill={backings.light} fillModes={backings}>
          <BloomColorScope mode="light" colorPreset="pink">
            <Child />
          </BloomColorScope>
        </SurfaceLevelProvider>
      </BloomThemeProvider>
    </ServerStyleContext.Provider>,
  );
  const host = document.createElement('div');
  host.innerHTML = html;
  const node = host.querySelector('[data-dark]');
  const local = buildTheme('pink', 'light');
  expect(node?.getAttribute('data-dark')).toBe(surfaceFillOn(local, backings.dark));
  expect(node?.getAttribute('data-light')).toBe(surfaceFillOn(local, backings.light));
  expect(node?.getAttribute('data-dark')).not.toBe(node?.getAttribute('data-light'));
});

it('keeps navigation screen paint stable from server markup through stored-dark hydration', async () => {
  function NavigationScreen() {
    const navigation = useNavigationTheme();
    return (
      <main
        data-navigation-dark={String(navigation.dark)}
        style={{ backgroundColor: navigation.colors.background, color: navigation.colors.text }}
      />
    );
  }
  function NavigationFixture({ mode }: { mode: 'light' | 'dark' }) {
    return (
      <BloomThemeProvider fonts={false} mode={mode} prepaintTheme={config}>
        <NavigationScreen />
      </BloomThemeProvider>
    );
  }
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(<NavigationFixture mode="light" />);
  const screen = host.querySelector('main');
  expect(screen?.style.backgroundColor).toBe('var(--bloom-paint-background)');
  expect(screen?.style.color).toBe('var(--bloom-paint-text)');
  expect(screen?.dataset.navigationDark).toBe('false');
  const errors: unknown[] = [];
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <NavigationFixture mode="dark" />, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(errors).toEqual([]);
    expect(host.querySelector('main')).toBe(screen);
    expect(screen?.style.backgroundColor).toBe('var(--bloom-paint-background)');
    expect(screen?.dataset.navigationDark).toBe('true');
  } finally {
    await act(async () => root?.unmount());
    host.remove();
  }
});
