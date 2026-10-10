/** @jest-environment jsdom */
import React, { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BloomThemeProvider } from '../BloomThemeProvider';
import { BloomColorScope } from '../color-scope/ColorScope.web';
import { BloomSeedScope } from '../seed-scope/SeedScope.web';
import { useTheme } from '../use-theme';
import { Portal } from '../../portal/Portal.web';
import { applyScopeTokens } from '../color-scope/resolve-scope';
import { buildTheme } from '../build-theme';
import { buildScopeVars } from '../color-scope/style-builder';
import type { BloomColorScopeTokens } from '../color-scope/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
let mounts: number;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  mounts = 0;
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.getElementById('bloom-portal-root')?.remove();
});
function Probe({ id }: { id: string }) {
  const theme = useTheme();
  useEffect(() => {
    mounts++;
  }, []);
  return <span data-testid={id}>{JSON.stringify(theme)}</span>;
}
const read = (id: string) =>
  JSON.parse(document.querySelector(`[data-testid="${id}"]`)!.textContent!);
const tokens = {
  background: '#5433eb',
  foreground: '#ffffff',
  'muted-foreground': 'rgba(255,255,255,0.7)',
  card: 'rgba(255,255,255,0.12)',
  primary: '#ffffff',
  'primary-foreground': '#5433eb',
};
function render({
  mode,
  values,
  preset,
}: {
  mode?: 'light' | 'dark';
  values?: BloomColorScopeTokens;
  preset?: 'blue' | 'orange';
} = {}) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="blue" fonts={false}>
        <Probe id="outside" />
        <BloomColorScope colorPreset={preset} mode={mode} tokens={values} asChild>
          <div data-testid="scope">
            <Probe id="inside" />
            <Portal>
              <Probe id="portal" />
            </Portal>
          </div>
        </BloomColorScope>
      </BloomThemeProvider>,
    ),
  );
}
it('preserves exact colors in every alias and JS consumer, including the portal, without changing the app', () => {
  render({ mode: 'dark', values: tokens });
  const scope = document.querySelector<HTMLElement>('[data-testid="scope"]')!;
  const portal = document.querySelector<HTMLElement>('[data-testid="portal"]')!.parentElement!;
  for (const node of [scope, portal]) {
    expect(node.style.getPropertyValue('--background')).toBe('#5433eb');
    expect(node.style.getPropertyValue('--color-background')).toBe('#5433eb');
    expect(node.style.getPropertyValue('--color-text')).toBe('#ffffff');
    expect(node.style.getPropertyValue('--color-fill')).toBe(tokens.card);
  }
  for (const id of ['inside', 'portal']) {
    expect(read(id).colors).toMatchObject({
      background: '#5433eb',
      text: '#ffffff',
      icon: tokens['muted-foreground'],
      card: tokens.card,
      primary: '#ffffff',
      tint: '#ffffff',
    });
    expect(read(id).mode).toBe('dark');
  }
  expect(read('outside').mode).toBe('light');
  expect(document.documentElement.style.getPropertyValue('--background')).not.toBe('#5433eb');
});
it('updates and clears overrides, preset and mode without remounting descendants', () => {
  render();
  expect(mounts).toBe(3);
  render({ mode: 'dark', preset: 'orange', values: tokens });
  expect(mounts).toBe(3);
  render({ values: { background: '#123456' } });
  expect(mounts).toBe(3);
  expect(read('inside').colors.background).toBe('#123456');
  render();
  expect(mounts).toBe(3);
  expect(read('inside')).toEqual(read('outside'));
  expect(
    document
      .querySelector<HTMLElement>('[data-testid="scope"]')!
      .style.getPropertyValue('--background'),
  ).toBe('');
});
it('inherits exact parent overrides across a nested mode change and preserves sibling scopes', () => {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="blue" fonts={false}>
        <BloomColorScope tokens={tokens}>
          <BloomColorScope mode="dark" tokens={{ primary: '#abcdef' }}>
            <Probe id="nested" />
          </BloomColorScope>
          <Probe id="sibling" />
        </BloomColorScope>
      </BloomThemeProvider>,
    ),
  );
  expect(read('nested').colors).toMatchObject({
    background: '#5433eb',
    primary: '#abcdef',
  });
  expect(read('nested').mode).toBe('dark');
  expect(read('sibling').mode).toBe('light');
  expect(read('sibling').colors.primary).toBe('#ffffff');
});
it('preserves an arbitrary seed source when adding exact overrides and local mode', () => {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="blue" fonts={false}>
        <BloomSeedScope seed="#de327a">
          <BloomColorScope mode="dark">
            <Probe id="seed" />
          </BloomColorScope>
          <BloomColorScope mode="dark" tokens={{ background: '#123456' }}>
            <Probe id="exact" />
          </BloomColorScope>
        </BloomSeedScope>
      </BloomThemeProvider>,
    ),
  );
  expect(read('exact').colors).toEqual({
    ...read('seed').colors,
    background: '#123456',
    primaryDark: '#123456',
  });
});
it('rejects unknown and unresolved colors rather than letting CSS and native disagree', () => {
  const base = {
    theme: buildTheme('blue', 'light'),
    vars: buildScopeVars('blue', 'light'),
  };
  for (const value of ['var(--other)', 'not-a-color', '120 50% 20%', '']) {
    expect(() => applyScopeTokens(base, { background: value })).toThrow('resolved color');
  }
  expect(() => applyScopeTokens(base, { invented: '#fff' } as BloomColorScopeTokens)).toThrow(
    'unknown canonical token',
  );
});
