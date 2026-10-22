/** @jest-environment jsdom */
import type React from 'react';
import { act, useLayoutEffect } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { Platform } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomThemeHead } from '../theme/ThemeBootstrap';
import { getThemeBootstrap, type BloomThemeBootstrapConfig } from '../theme/prepaint';
import { useBloomTheme } from '../theme/use-theme';
import { buildTheme } from '../theme/build-theme';
import { buildScopeVars } from '../theme/color-scope/style-builder';
import { usePrepaintTheme } from '../theme/prepaint-context';
import type { ThemeMode } from '../theme/types';

let mockScheme: 'light' | 'dark' = 'light';
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  useColorScheme: () => mockScheme,
}));
jest.mock('../fonts/FontLoader', () => ({
  FontLoader: ({ children }: { children: React.ReactNode }) => children,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const config: BloomThemeBootstrapConfig = { modeStorageKey: 'app-mode' };
const oldPlatform = Platform.OS;

beforeEach(() => {
  Platform.OS = 'web';
  mockScheme = 'light';
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-bloom-theme-mode');
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});
afterEach(() => {
  Platform.OS = oldPlatform;
  jest.restoreAllMocks();
});

function bootstrap(options: BloomThemeBootstrapConfig = config, blocked = false) {
  const { script } = getThemeBootstrap(options);
  const storage = blocked
    ? {
        getItem: () => {
          throw new Error('blocked');
        },
      }
    : localStorage;
  // Execute precisely the generated script, with explicit browser dependencies.
  new Function('document', 'localStorage', 'matchMedia', script)(document, storage, () => ({
    matches: mockScheme === 'dark',
  }));
}

it.each([
  ['light', 'dark', 'dark'],
  ['dark', 'light', 'light'],
  ['dark', 'system', 'dark'],
  ['dark', null, 'dark'],
  ['light', 'invalid', 'light'],
] as const)(
  'selects browser %s with stored %s as %s before React runs',
  (system, stored, expected) => {
    mockScheme = system;
    if (stored !== null) localStorage.setItem('app-mode', stored);
    bootstrap();
    expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe(expected);
    expect(document.documentElement.classList.contains('dark')).toBe(expected === 'dark');
  },
);

it('keeps OS selection when storage is blocked and respects a forced default', () => {
  mockScheme = 'dark';
  bootstrap(config, true);
  expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe('dark');
  bootstrap({ ...config, defaultMode: 'light' }, true);
  expect(document.documentElement.getAttribute('data-bloom-theme-mode')).toBe('light');
});

it('emits both engine palettes and a CSS system fallback even without JavaScript', () => {
  const { css } = getThemeBootstrap({ defaultColorPreset: 'blue' });
  expect(css).toContain('@media(prefers-color-scheme:dark)');
  for (const mode of ['light', 'dark'] as const) {
    const vars = buildScopeVars('blue', mode);
    expect(css).toContain(`--background:${vars['--background']};`);
    expect(css).toContain(`--foreground:${vars['--foreground']};`);
    for (const [name, value] of Object.entries(buildTheme('blue', mode).colors)) {
      expect(css).toContain(`--bloom-paint-${name}:${value};`);
    }
  }
  expect(css).toContain('html,body{background-color:var(--background)');
});

it('renders deterministic nonce-bearing head resources without HTML injection', () => {
  const unsafe = { modeStorageKey: '</script><img src=x onerror=alert(1)>\u2028' };
  const resources = getThemeBootstrap(unsafe);
  const html = renderToStaticMarkup(<BloomThemeHead config={unsafe} nonce="host-nonce" />);
  const host = document.createElement('div');
  host.innerHTML = html;
  expect(host.querySelectorAll('script')).toHaveLength(1);
  expect(host.querySelectorAll('style')).toHaveLength(1);
  expect(host.querySelector('img')).toBeNull();
  expect(host.querySelector('script')?.textContent).toBe(resources.script);
  expect(host.querySelector('script')?.nonce).toBe('host-nonce');
  expect(host.querySelector('style')?.nonce).toBe('host-nonce');
  expect(resources).toEqual(getThemeBootstrap(unsafe));
});

it('does not emit document resources on native', () => {
  Platform.OS = 'ios';
  expect(renderToStaticMarkup(<BloomThemeHead config={config} />)).toBe('');
});

it.each([
  ['light', 'dark'],
  ['dark', 'light'],
  ['dark', 'system'],
] as const)(
  'hydrates the same raw markup for OS %s and controlled %s without reversing prepaint',
  async (system, mode) => {
    mockScheme = system;
    localStorage.setItem('app-mode', mode);
    const errors: unknown[] = [];
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation((...args) => errors.push(args));
    const phases: { semantic: string; document: string | null }[] = [];
    function Probe() {
      const { theme } = useBloomTheme();
      const paint = usePrepaintTheme();
      useLayoutEffect(() => {
        phases.push({
          semantic: theme.mode,
          document: document.documentElement.getAttribute('data-bloom-theme-mode'),
        });
      });
      return (
        <div data-paint={String(paint)} style={{ backgroundColor: theme.colors.background }} />
      );
    }
    function App({ preference }: { preference: ThemeMode }) {
      return (
        <BloomThemeProvider prepaintTheme={config} mode={preference} fonts={false}>
          <Probe />
        </BloomThemeProvider>
      );
    }
    const container = document.createElement('section');
    container.innerHTML = renderToString(<App preference="system" />);
    document.body.append(container);
    const original = container.firstElementChild;
    expect(original?.getAttribute('style')).toContain(buildTheme('oxy', 'light').colors.background);
    bootstrap();
    const expectedMode = mode === 'system' ? system : mode;
    const writes: string[] = [];
    const originalSet = document.documentElement.setAttribute.bind(document.documentElement);
    jest.spyOn(document.documentElement, 'setAttribute').mockImplementation((name, value) => {
      if (name === 'data-bloom-theme-mode') writes.push(value);
      originalSet(name, value);
    });
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <App preference={mode} />, {
          onRecoverableError: (error) => errors.push(error),
        });
      });
      expect(container.firstElementChild).toBe(original);
      expect(errors).toEqual([]);
      expect(phases[0]).toEqual({ semantic: 'light', document: expectedMode });
      expect(phases[phases.length - 1]).toEqual({ semantic: expectedMode, document: expectedMode });
      expect(writes.every((value) => value === expectedMode)).toBe(true);
      expect(writes.length).toBeGreaterThan(0);
      const expected = buildTheme('oxy', expectedMode).colors.background;
      const normalized = document.createElement('div');
      normalized.style.backgroundColor = expected;
      expect((original as HTMLElement).style.backgroundColor).toBe(
        normalized.style.backgroundColor,
      );
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      consoleError.mockRestore();
    }
  },
);
