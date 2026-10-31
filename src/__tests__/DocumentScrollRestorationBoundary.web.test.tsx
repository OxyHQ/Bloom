/** @jest-environment jsdom */
import { act, Fragment, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { AppShell } from '../app-shell/index.web';
import {
  DocumentScrollRestorationBoundary,
  ScrollRestorationProvider,
  useScrollRestoration,
} from '../scroll/index.web';
import type { ScrollRouterAdapter } from '../scroll/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const adapter: ScrollRouterAdapter = {
  // Like Alia, the shell and focused outlet are inside the same parent route.
  useScreenContentId: () => '(app)',
  useScreenFocusEffect: (effect) => useEffect(effect, [effect]),
};

function FocusedRoute({ path }: { path: string }) {
  useScrollRestoration('window', { key: path, enabled: path !== '/chat' });
  return <span>{path}</span>;
}

it.each([
  { external: true, newPageOffset: 0 },
  { external: false, newPageOffset: 450 },
])('restores route identities with external ownership $external', ({ external, newPageOffset }) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let y = 0;
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 6000,
  });
  const originalScrollTo = window.scrollTo;
  const originalRaf = window.requestAnimationFrame;
  const originalCancel = window.cancelAnimationFrame;
  window.scrollTo = ((first: number | ScrollToOptions, second?: number) => {
    y = typeof first === 'number' ? (second ?? 0) : (first.top ?? y);
  }) as typeof window.scrollTo;
  window.requestAnimationFrame = (callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    frames.delete(id);
  };
  const settle = () => {
    for (let i = 0; i < 12 && frames.size; i++) {
      const pending = [...frames.values()];
      frames.clear();
      act(() =>
        pending.forEach((callback) => {
          callback(performance.now());
        }),
      );
    }
  };
  const Owner = external ? DocumentScrollRestorationBoundary : Fragment;
  const render = (path: string) =>
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <ScrollRestorationProvider adapter={adapter}>
            {path === '/outside' ? (
              <span>Outside the app group</span>
            ) : (
              <Owner>
                <AppShell
                  scroll="document"
                  panelLayout={{
                    flow: 'document',
                    panels: [{ id: 'main', content: <FocusedRoute path={path} /> }],
                  }}
                />
              </Owner>
            )}
          </ScrollRestorationProvider>
        </BloomThemeProvider>,
      ),
    );
  const scroll = (offset: number) =>
    act(() => {
      y = offset;
      window.dispatchEvent(new Event('scroll'));
    });
  try {
    render('/library');
    settle();
    scroll(450);
    render('/tasks');
    settle();
    expect(y).toBe(0);
    scroll(230);
    render('/chat');
    settle();
    // The conversation's timeline positions the window itself.
    scroll(900);
    render('/library');
    settle();
    expect(y).toBe(450);
    render('/tasks');
    settle();
    expect(y).toBe(230);
    render('/library');
    settle();
    scroll(450);
    // Leaving the app group unmounts the panel scope. A new route in a new
    // group mount must not inherit the previous group's document offset.
    render('/outside');
    render('/new-page');
    settle();
    expect(y).toBe(newPageOffset);
  } finally {
    act(() => root.unmount());
    container.remove();
    window.scrollTo = originalScrollTo;
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCancel;
  }
});
