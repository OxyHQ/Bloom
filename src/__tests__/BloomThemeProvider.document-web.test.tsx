/** @jest-environment jsdom */

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Platform } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomColorScope } from '../theme/color-scope/ColorScope.web';
import { BloomSeedScope } from '../theme/seed-scope/SeedScope.web';
import { applyDocumentTheme } from '../theme/apply-dark-class';
import { buildScopeVars } from '../theme/color-scope/style-builder';
import { buildSeedScopeVars } from '../theme/color-scope/seed-scope';

let mockColorScheme: 'light' | 'dark' = 'light';
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  useColorScheme: () => mockColorScheme,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalOS = Platform.OS;
let root: Root;
let container: HTMLElement;

beforeEach(() => {
  Platform.OS = 'web';
  mockColorScheme = 'light';
  document.head.innerHTML = '';
  document.documentElement.removeAttribute('style');
  document.documentElement.classList.remove('dark');
  document.body.removeAttribute('style');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.head.innerHTML = '';
  document.documentElement.removeAttribute('style');
  document.documentElement.classList.remove('dark');
  document.body.removeAttribute('style');
  Platform.OS = originalOS;
});

function expectDocument(mode: 'light' | 'dark', background: string) {
  // CSSOM normalizes modern rgb() syntax, so compare against a parsed color.
  const swatch = document.createElement('div');
  swatch.style.backgroundColor = background;
  for (const element of [document.documentElement, document.body]) {
    expect(element.style.backgroundColor).toBe(swatch.style.backgroundColor);
    expect(element.style.colorScheme).toBe(mode);
  }
  const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  expect(meta?.content).toBe(background);
  expect(meta?.hasAttribute('media')).toBe(false);
  expect(document.head.querySelectorAll('meta[data-bloom-theme-color]')).toHaveLength(1);
}

it('paints the document for explicit app modes even when the OS prefers the opposite mode', () => {
  document.head.innerHTML = `
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">`;
  const authored = Array.from(document.head.children);
  const originalMarkup = authored.map((element) => element.outerHTML);

  act(() => root.render(<BloomThemeProvider mode="dark" fonts={false}>app</BloomThemeProvider>));
  expectDocument('dark', buildScopeVars('oxy', 'dark')['--background']!);
  expect(document.documentElement.classList.contains('dark')).toBe(true);

  mockColorScheme = 'dark';
  act(() => root.render(<BloomThemeProvider mode="light" fonts={false}>app</BloomThemeProvider>));
  expectDocument('light', buildScopeVars('oxy', 'light')['--background']!);
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  expect(authored.map((element) => element.outerHTML)).toEqual(originalMarkup);
  expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(3);
});

it.each(['system', 'adaptive'] as const)('tracks OS changes in %s mode', (mode) => {
  act(() => root.render(<BloomThemeProvider mode={mode} fonts={false}>app</BloomThemeProvider>));
  expectDocument('light', buildScopeVars('oxy', 'light')['--background']!);

  mockColorScheme = 'dark';
  act(() => root.render(<BloomThemeProvider mode={mode} fonts={false}>app</BloomThemeProvider>));
  expectDocument('dark', buildScopeVars('oxy', 'dark')['--background']!);
});

it('follows preset and dynamic seed changes, then restores the preset when the seed clears', () => {
  act(() => root.render(<BloomThemeProvider mode="dark" colorPreset="blue" fonts={false}>app</BloomThemeProvider>));
  expectDocument('dark', buildScopeVars('blue', 'dark')['--background']!);

  act(() => root.render(<BloomThemeProvider mode="dark" colorPreset="pink" seed="#ff0000" fonts={false}>app</BloomThemeProvider>));
  expectDocument('dark', buildSeedScopeVars({ seed: '#ff0000', mode: 'dark' })['--background']!);

  act(() => root.render(<BloomThemeProvider mode="dark" colorPreset="pink" fonts={false}>app</BloomThemeProvider>));
  expectDocument('dark', buildScopeVars('pink', 'dark')['--background']!);
});

it('keeps subtree color and seed changes out of the document theme', () => {
  const renderScopes = (seed: string) => act(() => root.render(
    <BloomThemeProvider mode="dark" colorPreset="blue" fonts={false}>
      <BloomColorScope colorPreset="pink">
        <BloomSeedScope seed={seed}>scoped content</BloomSeedScope>
      </BloomColorScope>
    </BloomThemeProvider>,
  ));
  renderScopes('#ff0000');
  expectDocument('dark', buildScopeVars('blue', 'dark')['--background']!);
  renderScopes('#00ff00');
  expectDocument('dark', buildScopeVars('blue', 'dark')['--background']!);
});

it('keeps one managed entry ahead of theme metadata inserted after startup', () => {
  applyDocumentTheme('dark', '#101010');
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = '#ffffff';
  document.head.prepend(meta);
  applyDocumentTheme('light', '#fafafa');
  expectDocument('light', '#fafafa');
  expect(meta.content).toBe('#ffffff');
});

it.each(['ios', 'android'] as const)('does not mutate a document on %s', (platform) => {
  Platform.OS = platform;
  applyDocumentTheme('dark', '#101010');
  expect(document.documentElement.getAttribute('style')).toBeNull();
  expect(document.body.getAttribute('style')).toBeNull();
  expect(document.head.querySelector('meta[name="theme-color"]')).toBeNull();
});
