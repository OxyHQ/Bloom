import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ScrollRestorationScope, useScrollRestorationContext } from '../scroll/context';
import type { ScrollOffsetStore } from '../scroll/store';
import type { ScrollRouterAdapter } from '../scroll/types';

const adapter: ScrollRouterAdapter = {
  useScreenContentId: () => 'route',
  useScreenFocusEffect: () => undefined,
};
let current: ScrollOffsetStore;
let renders = 0;
function Probe() {
  const { store } = useScrollRestorationContext();
  current = store;
  renders++;
  return <Text>{store.read('route')}</Text>;
}

beforeEach(() => {
  jest.useFakeTimers();
  renders = 0;
});
afterEach(() => {
  jest.useRealTimers();
});

it('hydrates before children render and emits one settled snapshot without per-pixel rerenders', () => {
  const change = jest.fn();
  const screen = render(
    <ScrollRestorationScope
      adapter={adapter}
      initialSnapshot={{ route: 42 }}
      onSnapshotChange={change}
    >
      <Probe />
    </ScrollRestorationScope>,
  );
  expect(screen.getByText('42')).toBeTruthy();
  const initialRenders = renders;
  act(() => {
    current.save('route', 100);
    current.save('route', 200);
    current.save('route', 300);
  });
  expect(renders).toBe(initialRenders);
  expect(change).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(200));
  expect(change).toHaveBeenCalledTimes(1);
  expect(change).toHaveBeenCalledWith({ route: 300 });
  screen.unmount();
});

it('flushes the latest observed offset immediately on navigation and unmount', () => {
  const change = jest.fn();
  const screen = render(
    <ScrollRestorationScope adapter={adapter} onSnapshotChange={change}>
      <Probe />
    </ScrollRestorationScope>,
  );
  act(() => {
    current.save('route', 45);
    current.flush();
  });
  expect(change).toHaveBeenLastCalledWith({ route: 45 });
  act(() => current.save('route', 70));
  screen.unmount();
  expect(change).toHaveBeenLastCalledWith({ route: 70 });
  act(() => jest.runAllTimers());
  expect(change).toHaveBeenCalledTimes(2);
});

it('replaces only the scroll scope when the accepted workspace identity changes', () => {
  const screen = render(
    <ScrollRestorationScope adapter={adapter} scopeKey="first" initialSnapshot={{ route: 12 }}>
      <Probe />
    </ScrollRestorationScope>,
  );
  const original = current;
  screen.rerender(
    <ScrollRestorationScope adapter={adapter} scopeKey="first" initialSnapshot={{ route: 90 }}>
      <Probe />
    </ScrollRestorationScope>,
  );
  expect(current).toBe(original);
  expect(current.read('route')).toBe(12);
  screen.rerender(
    <ScrollRestorationScope adapter={adapter} scopeKey="second" initialSnapshot={{ route: 90 }}>
      <Probe />
    </ScrollRestorationScope>,
  );
  expect(current).not.toBe(original);
  expect(screen.getByText('90')).toBeTruthy();
  screen.unmount();
});

it('isolates nested panels and prunes removed navigation entries', () => {
  const outer = jest.fn();
  const inner = jest.fn();
  let outerStore: ScrollOffsetStore;
  function Outer() {
    outerStore = useScrollRestorationContext().store;
    return null;
  }
  const screen = render(
    <ScrollRestorationScope
      adapter={adapter}
      initialSnapshot={{ 'a%00': 5, 'removed%00': 20 }}
      contentIds={['a']}
      onSnapshotChange={outer}
    >
      <Outer />
      <ScrollRestorationScope adapter={adapter} onSnapshotChange={inner}>
        <Probe />
      </ScrollRestorationScope>
    </ScrollRestorationScope>,
  );
  act(() => {
    current.save('route', 80);
    jest.advanceTimersByTime(200);
  });
  expect(inner).toHaveBeenCalledWith({ route: 80 });
  expect(outerStore!.read('a\0')).toBe(5);
  expect(outerStore!.has('removed\0')).toBe(false);
  expect(outer).toHaveBeenCalledWith({ 'a%00': 5 });
  screen.unmount();
});
