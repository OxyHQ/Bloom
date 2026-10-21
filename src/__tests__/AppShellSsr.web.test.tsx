/** @jest-environment jsdom */
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 1440,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const { StyleSheet } = jest.requireActual('react-native-web');
  const component = (tag: string) =>
    React.forwardRef(({ style, ...props }: { style?: unknown }, ref: unknown) =>
      React.createElement(tag, { ...props, ref, style: StyleSheet.flatten(style) }),
    );
  const Svg = component('svg');
  return {
    ...Object.fromEntries(
      [
        'Path',
        'Circle',
        'Rect',
        'G',
        'Defs',
        'LinearGradient',
        'RadialGradient',
        'Stop',
        'ClipPath',
        'Pattern',
        'Mask',
        'Line',
        'Polygon',
        'Polyline',
        'Ellipse',
        'Text',
        'TSpan',
        'Image',
        'Filter',
        'FeGaussianBlur',
      ].map((name) => [name, component(name[0]!.toLowerCase() + name.slice(1))]),
    ),
    __esModule: true,
    default: Svg,
    Svg,
  };
});

import { Text } from 'react-native';
import { AppShell } from '../app-shell/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiHomeLine } from '../icons/remix';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';
import { installConstructedStyleSheets } from './support/constructed-style-sheets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Fixture({ layout }: { layout: Partial<AppShellPanelLayout> }) {
  return (
    <BloomThemeProvider mode="light">
      <AppShell
        testID="ssr-shell"
        header={null}
        drawer="reveal"
        contentMaxWidth="none"
        sidebar={{ items: [{ key: 'inbox', label: 'Inbox', icon: RiHomeLine }] }}
        panelLayout={{
          mode: 'split',
          flow: 'bounded',
          appearance: 'separated',
          activePanel: 'detail',
          panels: [
            { id: 'list', width: 380, content: <Text>Mailbox list</Text> },
            { id: 'detail', content: <Text>Readable server content</Text> },
          ],
          ...layout,
        }}
      />
    </BloomThemeProvider>
  );
}

describe('AppShell server layout', () => {
  const sheets = installConstructedStyleSheets();
  const observer = globalThis.ResizeObserver;
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });
  afterAll(() => {
    sheets.uninstall();
    globalThis.ResizeObserver = observer;
  });
  let host: HTMLDivElement;
  let root: Root | undefined;
  let consoleErrors: jest.SpyInstance;
  const css = globalThis.CSS;
  beforeEach(() => {
    consoleErrors = jest.spyOn(console, 'error').mockImplementation(() => {});
    host = document.createElement('div');
    document.body.append(host);
  });
  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    root = undefined;
    host.remove();
    Object.defineProperty(globalThis, 'CSS', { value: css, configurable: true });
    consoleErrors.mockRestore();
  });

  it.each<Partial<AppShellPanelLayout>>([
    { mode: 'split', collapseBelow: 'lg' },
    { mode: 'deck' },
    { axis: 'vertical', flow: 'bounded' },
    { axis: 'vertical', flow: 'document' },
  ])(
    'renders readable fluid content before JS and hydrates without changing the tree: %j',
    async (layout) => {
      Object.defineProperty(globalThis, 'CSS', { value: undefined, configurable: true });
      const fixture = <Fixture layout={layout} />;
      host.innerHTML = renderToString(fixture);
      const active = host.querySelector<HTMLElement>('[data-testid="ssr-shell-panels-detail"]')!;
      expect(active.textContent).toContain('Readable server content');
      expect(active.style.width).toBe('100%');
      expect(active.getAttribute('aria-hidden')).toBeNull();
      expect(
        host.querySelector('[data-testid="ssr-shell-panels-list"]')?.getAttribute('aria-hidden'),
      ).toBe('true');
      if (layout.axis === 'vertical')
        expect(active.style.height).toBe(layout.flow === 'document' ? 'auto' : '100%');

      // A real browser has CSS.supports and a nonzero viewport; the SSR process
      // has neither. Hydration must still start from the identical snapshot.
      Object.defineProperty(globalThis, 'CSS', {
        value: { supports: () => true },
        configurable: true,
      });
      const errors: unknown[] = [];
      await act(async () => {
        root = hydrateRoot(host, fixture, { onRecoverableError: (error) => errors.push(error) });
      });
      expect(errors).toEqual([]);
      expect(
        consoleErrors.mock.calls.filter((call) => /hydrat|didn't match/i.test(String(call[0]))),
      ).toEqual([]);
      expect(host.querySelector('[data-testid="ssr-shell-panels-detail"]')).toBe(active);
      expect(host.querySelector('[data-bloom-layout]')).not.toBeNull();
    },
  );
});
