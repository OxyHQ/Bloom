/** @jest-environment jsdom */
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { ComponentRef } from 'react';
import type { ScrollView } from 'react-native';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
// Match Metro's web-fork resolution while exercising real ScrollSurface/Area/Viewport.
jest.mock('../layout/ScrollSurface', () => jest.requireActual('../layout/ScrollSurface.web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return {
    ...base,
    __esModule: true,
    default: { ...base.default, View },
    useAnimatedScrollHandler:
      (listeners: { onScroll?: (event: NativeScrollEvent) => void }) =>
      (event: NativeSyntheticEvent<NativeScrollEvent>) =>
        listeners.onScroll?.(event.nativeEvent),
  };
});

import { Sidebar } from '../sidebar';
import { RiHomeLine } from '../icons/remix/RiHomeLine';
import { SidebarScrollArea } from '../sidebar/SidebarScrollArea';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it.each(['panel', 'rail'] as const)(
  '%s sidebar uses one shared scrollbar and keeps fixed chrome outside the viewport',
  (variant) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <BloomThemeProvider fonts={false}>
            <Sidebar
              testID="side"
              variant={variant}
              header={<div data-testid="fixed-header" />}
              footer={<div data-testid="fixed-footer" />}
              showThemeToggle={false}
              showSearch={false}
              items={[{ key: 'page', label: 'Page', icon: RiHomeLine }]}
            />
          </BloomThemeProvider>,
        ),
      );
      expect(host.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
      expect(host.querySelectorAll('[data-bloom-scrollbar-thumb]')).toHaveLength(1);
      const owner = host.querySelector('[data-bloom-scroll-area]')!;
      expect(owner.querySelector('[data-testid="fixed-footer"]')).toBeNull();
      expect(host.querySelector('[data-testid="fixed-footer"]')).not.toBeNull();
      if (variant === 'panel') {
        expect(host.querySelector('[data-testid="fixed-header"]')).not.toBeNull();
        expect(owner.querySelector('[data-testid="fixed-header"]')).toBeNull();
      }
      expect(host.querySelector('[data-bloom-sidebar-scroll]')).toBeNull();
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('forwards the actual scroll ref used by sidebar drag auto-scroll, without remounting the owner', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const ref = createRef<ComponentRef<typeof ScrollView>>();
  const onScroll = jest.fn();
  const render = (label: string) =>
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <SidebarScrollArea ref={ref} fadeColor="#ffffff" onScroll={onScroll}>
            <div>{label}</div>
          </SidebarScrollArea>
        </BloomThemeProvider>,
      ),
    );
  try {
    render('First');
    const owner = ref.current!.getScrollableNode() as unknown as HTMLElement;
    expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
    const scrollTo = jest.fn();
    Object.defineProperty(owner, 'scroll', { configurable: true, value: scrollTo });
    act(() => ref.current!.scrollTo({ y: 180, animated: false }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 180, left: 0, behavior: 'auto' });
    Object.defineProperties(owner, {
      scrollHeight: { configurable: true, value: 500 },
      clientHeight: { configurable: true, value: 100 },
      scrollTop: { configurable: true, value: 180 },
    });
    act(() => owner.dispatchEvent(new Event('scroll')));
    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onScroll.mock.calls[0][0].nativeEvent.contentOffset.y).toBe(180);
    render('Second');
    expect(ref.current!.getScrollableNode()).toBe(owner);
    expect(host.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
