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

import { Text, View } from 'react-native';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { AppShellPanelContext } from '../app-shell/context';
import { PanelCssContext } from '../app-shell/panel-layout-css';
import {
  AppShell,
  AppShellMenuButton,
  AppShellPanelVisibility,
  useAppShellPanel,
} from '../app-shell/index.web';
import { BloomProvider } from '../provider/BloomProvider';
import { PageHeader } from '../page-header/PageHeader';
import type { ServerStylePolicy } from '../styles/context';
import { RiHomeLine } from '../icons/remix';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';
import { installConstructedStyleSheets } from './support/constructed-style-sheets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Fixture({
  layout,
  ssrStyles,
}: {
  layout: Partial<AppShellPanelLayout>;
  ssrStyles?: ServerStylePolicy;
}) {
  return (
    <BloomProvider mode="light" fonts={false} ssrStyles={ssrStyles}>
      <AppShell
        testID="ssr-shell"
        header={null}
        topBar={<Text>Compact top navigation</Text>}
        bottomBar={<Text>Compact bottom navigation</Text>}
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
            {
              id: 'detail',
              content: (
                <>
                  <AppShellPanelVisibility when="alone" testID="compact-header">
                    <Text>Compact header</Text>
                  </AppShellPanelVisibility>
                  <Text>Readable server content</Text>
                </>
              ),
            },
          ],
          ...layout,
        }}
      />
    </BloomProvider>
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

  it('hydrates a visibility-aware panel without replacing its server content', async () => {
    function Probe() {
      const { visibilityReady } = useAppShellPanel();
      return <Text testID="visibility-probe">{visibilityReady ? 'ready' : 'pending'}</Text>;
    }
    Object.defineProperty(globalThis, 'CSS', { value: undefined, configurable: true });
    const fixture = (
      <Fixture ssrStyles="inline" layout={{ panels: [{ id: 'main', content: <Probe /> }] }} />
    );
    host.innerHTML = renderToString(fixture);
    const probe = host.querySelector('[data-testid="visibility-probe"]');
    expect(probe?.textContent).toBe('pending');
    Object.defineProperty(globalThis, 'CSS', {
      value: { supports: () => true },
      configurable: true,
    });
    const errors: unknown[] = [];
    await act(async () => {
      root = hydrateRoot(host, fixture, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelector('[data-testid="visibility-probe"]')).toBe(probe);
    expect(probe?.textContent).toBe('ready');
  });

  it('delivers header container insets in server HTML and adopts them without replacing the bar', async () => {
    const app = (
      <BloomProvider fonts={false} ssrStyles="inline">
        <PageHeader title="Inbox" scrim="none" testID="server-header" />
      </BloomProvider>
    );
    host.innerHTML = renderToString(app);
    const bar = host.querySelector('[data-bloom-page-header-bar]');
    const style = host.querySelector('[data-bloom-server-style="bloom-page-header-layout"]');
    expect(bar).not.toBeNull();
    expect(style?.textContent).toContain('--bloom-page-header-inset: 16px');
    expect(style?.textContent).toContain('padding-left: var(--bloom-page-header-inset) !important');
    expect(style?.textContent).toContain('@container bloom-page-header (min-width: 640px)');
    expect(style?.textContent).toContain('--bloom-page-header-inset: 24px');
    const errors: unknown[] = [];
    await act(async () => {
      root = hydrateRoot(host, app, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelector('[data-bloom-page-header-bar]')).toBe(bar);
    expect(host.querySelector('[data-bloom-server-style="bloom-page-header-layout"]')).toBeNull();
    expect(
      sheets.adopted().some((sheet) => sheet.cssText.includes('--bloom-page-header-inset')),
    ).toBe(true);
  });

  it.each(['drawer', 'panel'] as const)(
    'keeps the canonical menu trigger and header stable through %s hydration',
    async (navigationMode) => {
      Object.defineProperty(globalThis, 'CSS', {
        value: { supports: () => true },
        configurable: true,
      });
      const readStyle = window.getComputedStyle.bind(window);
      const styleSpy = jest.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
        const style = readStyle(element);
        if (!element.hasAttribute('data-bloom-shell-frame')) return style;
        const readValue = style.getPropertyValue.bind(style);
        style.getPropertyValue = (name) =>
          name === '--bloom-nav-mode' ? navigationMode : readValue(name);
        return style;
      });
      const app = (
        <BloomProvider fonts={false} ssrStyles="inline">
          <AppShell
            header={null}
            navFrom={777}
            sidebar={{ items: [] }}
            panelLayout={{
              panels: [
                {
                  id: 'list',
                  content: (
                    <PageHeader
                      title="Inbox"
                      leading={<AppShellMenuButton testID="responsive-menu" />}
                      testID="responsive-header"
                    />
                  ),
                },
              ],
            }}
          />
        </BloomProvider>
      );
      try {
        host.innerHTML = renderToString(app);
        const menu = host.querySelector<HTMLElement>('[data-testid="responsive-menu"]');
        const start = host.querySelector('[data-testid="responsive-header-start"]');
        expect(menu).not.toBeNull();
        expect(menu?.style.display).toBe('var(--bloom-drawer-trigger-display, none)');
        // Hiding the button itself removes both its width and the flex gap.
        expect(menu?.parentElement).toBe(start);
        const css = [...host.querySelectorAll('style')].map((node) => node.textContent).join('');
        expect(css).toContain('width < 777px');
        expect(css).toContain('--bloom-drawer-trigger-display:flex');
        expect(css).toContain('--bloom-drawer-trigger-display:none');
        const errors: unknown[] = [];
        await act(async () => {
          root = hydrateRoot(host, app, { onRecoverableError: (error) => errors.push(error) });
        });
        expect(errors).toEqual([]);
        expect(host.querySelector('[data-testid="responsive-menu"]')).toBe(menu);
        expect(menu?.parentElement).toBe(start);
        expect(menu?.style.display).toBe('var(--bloom-drawer-trigger-display, none)');
      } finally {
        styleSpy.mockRestore();
      }
    },
  );

  it('does not apply an outer compositor visibility variable to an inner legacy panel', () => {
    host.innerHTML = renderToString(
      <PanelCssContext.Provider value="outer-compositor">
        <AppShellPanelContext.Provider value={{ alone: true, framed: false }}>
          <AppShellPanelVisibility when="alone" testID="legacy-header">
            Header
          </AppShellPanelVisibility>
        </AppShellPanelContext.Provider>
      </PanelCssContext.Provider>,
    );
    expect(host.querySelector<HTMLElement>('[data-testid="legacy-header"]')?.style.display).toBe(
      'flex',
    );
  });

  it.each(['reveal', 'overlay'] as const)(
    'reserves arbitrary bottom chrome through flow before measurement (%s)',
    async (drawer) => {
      Object.defineProperty(globalThis, 'CSS', {
        value: { supports: () => true },
        configurable: true,
      });
      function Edge({ name }: { name: string }) {
        return <Text testID={name}>{useBottomEdgeInset()}</Text>;
      }
      function Bar({ height }: { height: number }) {
        return <View testID="custom-bar" style={{ height }} />;
      }
      function Reserved({ height = 96, reserve = true, document = false }) {
        return (
          <BloomProvider mode="light" fonts={false} ssrStyles="inline">
            <AppShell
              testID="reserved"
              header={null}
              drawer={drawer}
              sidebar={{ items: [] }}
              bottomBar={<Bar height={height} />}
              bottomBarVisibility="always"
              reserveBottomBarSpace={reserve}
              panelLayout={{
                flow: document ? 'document' : 'bounded',
                panels: [{ id: 'content', content: <Edge name="inside-edge" /> }],
              }}
            />
            <Edge name="outside-edge" />
          </BloomProvider>
        );
      }
      host.innerHTML = renderToString(<Reserved />);
      const bar = host.querySelector<HTMLElement>('[data-testid="reserved-bottom-bar"]');
      const content = host.querySelector('[data-testid="inside-edge"]');
      const group = host.querySelector<HTMLElement>('[data-bloom-panel-group]');
      if (!bar || !group) throw new Error('Missing server-rendered shell chrome or panel group');
      expect(bar.style.position).toBe('relative');
      expect(bar.style.flexShrink).toBe('0');
      expect(host.querySelector<HTMLElement>('[data-testid="custom-bar"]')?.style.height).toBe(
        '96px',
      );
      expect(group.style.paddingBottom).toBe('0px');
      const errors: unknown[] = [];
      await act(async () => {
        root = hydrateRoot(host, <Reserved />, { onRecoverableError: (e) => errors.push(e) });
      });
      expect(errors).toEqual([]);
      expect(host.querySelector('[data-testid="inside-edge"]')).toBe(content);
      expect(content?.textContent).toBe('0');
      expect(host.querySelector('[data-testid="outside-edge"]')?.textContent).toBe('0');
      expect(group.style.paddingBottom).toBe('0px');
      if (!root) throw new Error('Hydration did not produce a root');
      const mounted = root;
      await act(async () => mounted.render(<Reserved height={143} />));
      expect(host.querySelector('[data-testid="inside-edge"]')).toBe(content);
      expect(host.querySelector<HTMLElement>('[data-testid="custom-bar"]')?.style.height).toBe(
        '143px',
      );
      expect(group.style.paddingBottom).toBe('0px');
      await act(async () => mounted.render(<Reserved height={143} reserve={false} />));
      expect(bar.style.position).toBe('absolute');
      expect(group.style.paddingBottom).toBe('0px');
      expect(host.querySelector('[data-testid="inside-edge"]')).toBe(content);
      await act(async () => mounted.render(<Reserved height={143} document />));
      expect(bar.style.position).toBe('fixed');
      expect(host.querySelector('[data-testid="outside-edge"]')?.textContent).toBe('0');
      expect(host.querySelector('[data-testid="inside-edge"]')).toBe(content);
    },
  );

  it.each(['inline', { nonce: 'app-shell-nonce' }] as const)(
    'ships responsive compositor CSS before JS with %j and preserves every panel',
    async (policy) => {
      Object.defineProperty(globalThis, 'CSS', { value: undefined, configurable: true });
      const fixture = (
        <Fixture layout={{ mode: 'split', collapseBelow: 'lg' }} ssrStyles={policy} />
      );
      host.innerHTML = renderToString(fixture);
      const list = host.querySelector('[data-testid="ssr-shell-panels-list"]');
      const detail = host.querySelector('[data-testid="ssr-shell-panels-detail"]');
      expect(list?.textContent).toContain('Mailbox list');
      expect(detail?.textContent).toContain('Readable server content');
      expect(host.querySelector('[data-bloom-layout]')).not.toBeNull();
      const styles = [...host.querySelectorAll('style[data-bloom-server-style]')].filter((sheet) =>
        sheet.getAttribute('data-bloom-server-style')?.startsWith('bloom-panels-'),
      );
      expect(styles).toHaveLength(2);
      expect(host.querySelector('[data-testid="ssr-shell-top-bar"]')?.textContent).toContain(
        'Compact top navigation',
      );
      expect(host.querySelector('[data-testid="ssr-shell-bottom-bar"]')?.textContent).toContain(
        'Compact bottom navigation',
      );
      const css = styles.map((sheet) => sheet.textContent).join('');
      expect(css).toContain('@container');
      expect(css).toMatch(/data-bloom-shell-bar-visibility="compact"\]\{display:flex!important/);
      expect(css).toMatch(/data-bloom-shell-bar-visibility="compact"\]\{display:none!important/);
      expect(css).toContain('--bloom-panel-alone-display:flex');
      expect(css).toContain('--bloom-panel-alone-display:none');
      expect(
        host.querySelector<HTMLElement>('[data-testid="compact-header"]')?.style.display,
      ).toContain('var(--bloom-panel-alone-display');
      Object.defineProperty(globalThis, 'CSS', {
        value: { supports: () => true },
        configurable: true,
      });
      const errors: unknown[] = [];
      await act(async () => {
        root = hydrateRoot(host, fixture, { onRecoverableError: (error) => errors.push(error) });
      });
      expect(errors).toEqual([]);
      expect(host.querySelector('[data-testid="ssr-shell-panels-list"]')).toBe(list);
      expect(host.querySelector('[data-testid="ssr-shell-panels-detail"]')).toBe(detail);
      expect(host.querySelector('[data-bloom-server-style]')).toBeNull();
      expect(
        sheets.adopted().some((sheet) => sheet.cssText.includes('--bloom-panel-alone-display')),
      ).toBe(true);
    },
  );

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
