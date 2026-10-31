/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View, ScrollView } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View, ScrollView } };
});

import { AppShell } from '../app-shell/index.web';
import { Screen, ScreenScrollView } from '../screen/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it.each(['document', 'bounded'] as const)(
  'keeps document headers inset and reserves bounded headers inside the scroller',
  (flow) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const app = (headerPlacement: 'inset' | 'scroll-under', showHeader = true) => (
      <BloomThemeProvider fonts={false}>
        <AppShell
          testID="shell"
          scroll={flow === 'document' ? 'document' : 'fixed'}
          header={null}
          panelLayout={{
            flow,
            header: showHeader ? <div>Workspace header</div> : null,
            headerPlacement,
            panels: [
              {
                id: 'main',
                content: (
                  <Screen testID="route" scroll="content" documentScroll={flow === 'document'}>
                    <ScreenScrollView testID="scroller"><div data-testid="body">Page</div></ScreenScrollView>
                  </Screen>
                ),
              },
            ],
          }}
        />
      </BloomThemeProvider>
    );
    try {
      act(() => root.render(app('inset')));
      const get = (id: string) => container.querySelector(`[data-testid="${id}"]`) as HTMLElement;
      const workspace = get('shell-panels-workspace-content');
      const body = get('body');
      const route = get('route');
      const surface = get('content-panel-surface');
      expect(workspace).not.toBeNull();
      expect(body).not.toBeNull();
      if (flow === 'document') {
        expect(route.style.minHeight).toContain('56px');
        expect(surface.style.minHeight).toContain('56px');
      }
      const before = {
        workspace: workspace.getAttribute('style'),
        body: body.getAttribute('style'),
      };
      act(() => root.render(app('scroll-under')));
      expect(get('shell-panels-workspace-content')).toBe(workspace);
      expect(get('body')).toBe(body);
      if (flow === 'document') {
        expect({ workspace: workspace.getAttribute('style'), body: body.getAttribute('style') }).toEqual(before);
      } else {
        expect(workspace.style.paddingTop).toBe('');
        expect(body.parentElement?.style.paddingTop).toBe('56px');
      }
      act(() => root.render(app('scroll-under', false)));
      expect(get('route')).toBe(route);
      if (flow === 'document') {
        expect(route.style.minHeight).toContain('0px');
        expect(surface.style.minHeight).toContain('0px');
      }
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  },
);
