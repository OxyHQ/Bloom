/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 700,
    configurable: true,
  });
  Object.defineProperty(window, 'innerWidth', { value: 700, configurable: true });
  return jest.requireActual('react-native-web');
});
jest.mock('../button', () => jest.requireActual('../button/index.web'));

import { BloomScope, type BloomSize } from '../appearance';
import { AppShellHeader } from '../app-shell/AppShellHeader';
import { AppShell, AppShellMenuButton } from '../app-shell/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { View } from 'react-native';
import { RiHomeLine } from '../icons/remix';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Fixture({ scopes }: { scopes: BloomSize[] }) {
  const header = (
    <View>
      <AppShellHeader testID="header" title="Welcome" onMenuPress={() => {}} />
    </View>
  );
  const nested = scopes.reduceRight<ReactNode>(
    (children, size) => (
      <BloomScope key={size} size={size}>
        {children}
      </BloomScope>
    ),
    header,
  );
  return <BloomThemeProvider fonts={false}>{nested}</BloomThemeProvider>;
}

function MenuFixture({ scopes }: { scopes: BloomSize[] }) {
  const shell = (
    <AppShell
      header={<AppShellMenuButton testID="shell-menu" />}
      sidebar={{ items: [{ key: 'home', label: 'Home', icon: RiHomeLine }] }}
    />
  );
  const nested = scopes.reduceRight<ReactNode>(
    (children, size) => (
      <BloomScope key={size} size={size}>
        {children}
      </BloomScope>
    ),
    shell,
  );
  return <BloomThemeProvider fonts={false}>{nested}</BloomThemeProvider>;
}

it.each([
  { name: 'default md', scopes: [] },
  { name: 'xs scope', scopes: ['xs'] },
  { name: 'nested lg over xs', scopes: ['xs', 'lg'] },
  { name: 'lg scope', scopes: ['lg'] },
] as const)('AppShellHeader preserves its fixed recipes in DOM web ($name)', ({ scopes }) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<Fixture scopes={[...scopes]} />));
    const menu = host.querySelector<HTMLElement>('[data-testid="header-menu"]');
    const heading = host.querySelector<HTMLElement>('[role="heading"]');
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute('aria-expanded')).toBe('false');
    expect(menu?.style.getPropertyValue('--bloom-btn-height')).toBe('36px');
    expect(heading?.textContent).toBe('Welcome');
    expect(heading?.getAttribute('aria-level')).toBe('1');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each([
  { name: 'default md', scopes: [] },
  { name: 'xs scope', scopes: ['xs'] },
  { name: 'nested lg over xs', scopes: ['xs', 'lg'] },
  { name: 'lg scope', scopes: ['lg'] },
] as const)('AppShellMenuButton keeps its md recipe in DOM web ($name)', ({ scopes }) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<MenuFixture scopes={[...scopes]} />));
    const menu = host.querySelector<HTMLElement>('[data-testid="shell-menu"]');
    expect(menu).not.toBeNull();
    expect(menu?.style.getPropertyValue('--bloom-btn-height')).toBe('36px');
    expect(menu?.getAttribute('aria-label')).toBe('Open navigation');
    expect(menu?.getAttribute('aria-expanded')).toBe('false');
    act(() => menu?.click());
    expect(menu?.getAttribute('aria-expanded')).toBe('true');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
