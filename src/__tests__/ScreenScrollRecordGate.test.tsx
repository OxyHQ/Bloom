// `useScreenScroll` hands restoration the offset on JS only once it has moved a
// point since the last one it sent, and every offset at either end of the range.
//
// Every scroll frame used to cross to JS (`runOnJS`) and `store.save`, which
// re-arms the store's 200 ms persistence debounce. The gate must still save the
// first offset a scroller reports and the measured bottom exactly (the first
// genuine scroll there must save), and it subscribes to nothing but the scroll
// event: a drag-end or momentum-end subscription would replace the caller's own
// `onScrollEndDrag` / `onMomentumScrollEnd` (Reanimated's props filter).
//
// Jest's Reanimated mock gives no handler; this one keeps the worklets the hook
// passes so a suite can drive them as the UI thread would.

import { createElement, type ReactElement, type ReactNode } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { ScreenContext, type ScreenContextValue } from '../screen/context';
import { useScreenScroll } from '../screen/use-screen-scroll';
import type { ScrollRestorationBinding } from '../scroll/types';

type Handlers = Record<string, ((event: NativeScrollEvent) => void) | undefined>;
const handlers: { current: Handlers } = { current: {} };

jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...base,
    __esModule: true,
    useAnimatedScrollHandler: (next: Handlers) => {
      handlers.current = next;
      return jest.fn();
    },
  };
});

// A 2000-point list in an 800-point viewport: the measured bottom is 1200.
function event(y: number): NativeScrollEvent {
  return {
    contentOffset: { x: 0, y },
    contentSize: { width: 400, height: 2000 },
    layoutMeasurement: { width: 400, height: 800 },
    contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
    zoomScale: 1,
  };
}

function bind(wrapper?: (props: { children: ReactNode }) => ReactElement) {
  const saved: number[] = [];
  const restoration: ScrollRestorationBinding = {
    restorePending: false,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      saved.push(e.nativeEvent.contentOffset.y),
  };
  renderHook(() => useScreenScroll({ restoration }), { wrapper });
  const { onScroll } = handlers.current;
  if (!onScroll) throw new Error('no scroll handler');
  return { saved, onScroll };
}

it('subscribes to the scroll event only, so the caller keeps its drag and momentum callbacks', () => {
  bind();
  expect(Object.keys(handlers.current)).toEqual(['onScroll']);
});

it('sends the first offset, then only moves of at least a point', () => {
  const { saved, onScroll } = bind();
  for (const y of [5, 5.4, 5.9, 6, 6.5, 6.99, 7, 7, 40, 39.2, 38.9]) onScroll(event(y));
  expect(saved).toEqual([5, 6, 7, 40, 38.9]);
});

it('saves the measured bottom and the top exactly, however small the last move', () => {
  const { saved, onScroll } = bind();
  onScroll(event(1199.2));
  onScroll(event(1199.8)); // under a point, mid-range: not sent
  onScroll(event(1200)); // the measured bottom
  onScroll(event(1200)); // the same offset again: not sent
  expect(saved).toEqual([1199.2, 1200]);
  onScroll(event(0.6));
  onScroll(event(0.2));
  onScroll(event(0)); // the top
  expect(saved).toEqual([1199.2, 1200, 0.6, 0]);
});

it('sends nothing while another scroller of the screen is active', () => {
  const box = (value: unknown) => ({ value });
  const screen = {
    active: true,
    scrollY: box(0),
    collapseProgress: box(0),
    collapseTarget: box(0),
    activeScrollerId: box(null),
  } as unknown as ScreenContextValue;
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(ScreenContext.Provider, { value: screen }, children);
  const first = bind(wrapper);
  first.onScroll(event(10));
  // A second scroller of the same screen takes over.
  const second = bind(wrapper);
  first.onScroll(event(500));
  expect(first.saved).toEqual([10]);
  second.onScroll(event(500));
  expect(second.saved).toEqual([500]);
});

it('crosses to JS only when there is restoration to hear it', () => {
  renderHook(() => useScreenScroll());
  expect(() => handlers.current.onScroll?.(event(10))).not.toThrow();
});
