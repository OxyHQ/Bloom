/** @jest-environment jsdom */
import type React from 'react';
import { useEffect, useId } from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { createPanelLayoutView } from '../app-shell/AppShellPanelLayout';
import type { AppShellPanelDefinition, AppShellPanelLayout } from '../app-shell/panel-layout-types';
import { AppShellRegionContext } from '../layout/app-shell-region';
import { ScreenHostContext } from '../screen/context';
import { ScrollRestorationProvider } from '../scroll/context';
import type { useScrollRestoration } from '../scroll/use-scroll-restoration';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

const bindings = new Map<string, boolean>();
const useRestorationProbe: typeof useScrollRestoration = (target, options) => {
  const id = useId();
  useEffect(() => {
    bindings.set(id, target === 'window' && options?.enabled !== false);
    return () => {
      bindings.delete(id);
    };
  }, [id, target, options?.enabled]);
  return { onScroll: () => {}, restorePending: false };
};
const passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const Layout = createPanelLayoutView(
  passthrough,
  passthrough,
  passthrough,
  () => null,
  useRestorationProbe,
  passthrough,
  passthrough,
);
const adapter = { useScreenContentId: () => 'route', useScreenFocusEffect: () => {} };
const region = {
  flow: 'document' as const,
  framed: true,
  gutter: 8,
  viewportInset: { top: 8, bottom: 8 },
  bottomReserve: 0,
  underBottomBar: false,
  revealed: false,
  maskColor: '#fff',
};
const originalOS = Platform.OS;
beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  mockWindowSize({ width: 1440, height: 900 });
});
afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  jest.restoreAllMocks();
});

function group(
  id: string,
  split = false,
): AppShellPanelDefinition & { group: AppShellPanelLayout } {
  return {
    id,
    keepMounted: true,
    group: {
      mode: 'split',
      axis: 'vertical',
      flow: 'bounded',
      singlePanelFlow: 'document',
      panels: [
        { id: `${id}-content`, keepMounted: true },
        { id: `${id}-extra`, visible: split, keepMounted: true },
      ],
    },
  };
}

function tree(layout: AppShellPanelLayout, active = true) {
  return (
    <BloomThemeProvider fonts={false}>
      <ScrollRestorationProvider adapter={adapter}>
        <ScreenHostContext.Provider value={{ active }}>
          <AppShellRegionContext.Provider value={{ ...region, flow: layout.flow ?? 'document' }}>
            <Layout layout={{ flow: 'document', ...layout }} shellWidth={1440} gap={8} />
          </AppShellRegionContext.Provider>
        </ScreenHostContext.Provider>
      </ScrollRestorationProvider>
    </BloomThemeProvider>
  );
}
const enabledWindows = () => [...bindings.values()].filter(Boolean).length;

it('delegates to the primary group, never to the root or a selected secondary group', () => {
  const view = render(
    tree({ panels: [group('main', true), group('secondary')], activePanel: 'secondary' }),
  );
  // The main group is still bounded even though the root and secondary group
  // can already use document flow. Restoring the root here jumps the whole app.
  expect(enabledWindows()).toBe(0);
  view.rerender(tree({ panels: [group('main'), group('secondary')], activePanel: 'secondary' }));
  expect(enabledWindows()).toBe(1);
  view.rerender(
    tree({ panels: [group('main', true), group('secondary')], expandedPanel: 'secondary' }),
  );
  expect(enabledWindows()).toBe(1);
  view.rerender(
    tree({ mode: 'deck', flow: 'bounded', panels: [group('main'), group('secondary')] }),
  );
  expect(enabledWindows()).toBe(0);
});

it('keeps root restoration for a direct primary alongside nested and hidden groups', () => {
  render(
    tree({
      panels: [{ ...group('hidden'), visible: false }, { id: 'main' }, group('secondary')],
      activePanel: 'secondary',
    }),
  );
  expect(enabledWindows()).toBe(1);
});

it('delegates through multiple primary groups and stops when the ancestor is inactive', () => {
  const nested = group('outer');
  nested.group.panels = [group('inner'), { id: 'hidden', visible: false }];
  const layout = { panels: [nested, group('secondary')] };
  const view = render(tree(layout));
  expect(enabledWindows()).toBe(1);
  view.rerender(tree(layout, false));
  expect(enabledWindows()).toBe(0);
});
