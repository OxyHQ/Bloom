import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { NativeScrollEvent } from 'react-native';
import { useAnimatedScrollHandler, type ScrollHandlerProcessed } from 'react-native-reanimated';

// Reanimated's real processed handlers are non-callable objects. The global
// function-shaped mock cannot detect accidentally calling one on the JS thread.
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const React = jest.requireActual('react');
  return { ...base,
    useAnimatedScrollHandler: (listeners: Record<string, Function>) => {
      const context = React.useRef({}).current;
      return { listeners, context };
    },
    useComposedEventHandler: (handlers: unknown[]) => ({ handlers: handlers.filter(Boolean) }),
  };
});

import { ScrollMetricsProvider, useAnimatedScrollMetricsBinding, useScrollMetricsBinding } from '../layout';
import { remainingScrollDistance, useScrollMetricsValue, type ScrollMetrics } from '../layout/scroll-metrics';
import { TabBarMinimizeProvider, useMinimizeOnScroll, useMinimizeState, type MinimizeState } from '../tab-bar';

type Binding = ReturnType<typeof useAnimatedScrollMetricsBinding>;
type Processed = { handlers?: Processed[]; listeners?: Record<string, (event: NativeScrollEvent, context: Record<string, number>) => void>; context?: Record<string, number> };
function dispatch(handler: Binding['onScroll'], name: string, y = 0, contentHeight = 1000, viewportHeight = 400) {
  const event = { contentOffset: { x: 0, y }, contentSize: { width: 390, height: contentHeight }, layoutMeasurement: { width: 390, height: viewportHeight } } as NativeScrollEvent;
  const visit = (processed: Processed) => {
    processed.handlers?.forEach(visit);
    processed.listeners?.[name]?.(event, processed.context!);
  };
  act(() => visit(handler as unknown as Processed));
}

it.each(['option', 'outer'] as const)('composes non-callable animated handlers via %s, preserving minimize, drag/momentum and context', order => {
  let binding!: Binding;
  let metrics!: ScrollMetrics;
  let state!: MinimizeState;
  let renders = 0;
  const calls: string[] = [];
  const counts: number[] = [];
  function Probe() {
    renders++;
    const consumer = useAnimatedScrollHandler({
      onScroll: (_event, context) => { context.count = Number(context.count ?? 0) + 1; counts.push(Number(context.count)); calls.push('scroll'); },
      onBeginDrag: () => calls.push('begin'), onEndDrag: () => calls.push('end'),
      onMomentumBegin: () => calls.push('momentum-start'), onMomentumEnd: () => calls.push('momentum-end'),
    }, [calls, counts]);
    const minimize = useMinimizeOnScroll(consumer);
    const own = useAnimatedScrollMetricsBinding({ handler: order === 'option' ? minimize : null });
    const outer = useMinimizeOnScroll(own.onScroll);
    binding = order === 'option' ? own : { ...own, onScroll: outer };
    metrics = useScrollMetricsValue()!;
    state = useMinimizeState();
    return null;
  }
  const view = render(<ScrollMetricsProvider><TabBarMinimizeProvider><Probe /></TabBarMinimizeProvider></ScrollMetricsProvider>);
  expect(typeof binding.onScroll).toBe('object');
  dispatch(binding.onScroll, 'onScroll', 100);
  expect(metrics.scrollY.value).toBe(100);
  expect(remainingScrollDistance(metrics)).toBe(500);
  expect(state.target.value).toBe(1);
  dispatch(binding.onScroll, 'onScroll', 40);
  expect(state.target.value).toBe(0);
  dispatch(binding.onScroll, 'onScroll', 900);
  expect(metrics.scrollY.value).toBe(600);
  expect(remainingScrollDistance(metrics)).toBe(0);
  dispatch(binding.onScroll, 'onScroll', -30);
  expect(metrics.scrollY.value).toBe(0);
  if (order === 'option') {
    for (const event of ['onBeginDrag', 'onEndDrag', 'onMomentumBegin', 'onMomentumEnd']) dispatch(binding.onScroll, event);
    expect(calls).toEqual(['scroll', 'scroll', 'scroll', 'scroll', 'begin', 'end', 'momentum-start', 'momentum-end']);
    expect(counts).toEqual([1, 2, 3, 4]);
  }
  expect(renders).toBe(1);
  view.unmount();
});

it('measures initial and resized extents, updates content size, and forwards measurement callbacks', () => {
  let binding!: Binding, metrics!: ScrollMetrics;
  const onLayout = jest.fn(), onContentSizeChange = jest.fn();
  function Probe() { binding = useAnimatedScrollMetricsBinding({ onLayout, onContentSizeChange }); metrics = useScrollMetricsValue()!; return null; }
  render(<ScrollMetricsProvider><Probe /></ScrollMetricsProvider>);
  expect(remainingScrollDistance(metrics)).toBe(0);
  const layout = (height: number) => act(() => binding.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height } } } as Parameters<Binding['onLayout']>[0]));
  const content = (height: number) => act(() => binding.onContentSizeChange(390, height));
  layout(400); content(1000);
  expect(remainingScrollDistance(metrics)).toBe(600);
  dispatch(binding.onScroll, 'onScroll', 580);
  layout(600);
  expect(metrics.scrollY.value).toBe(400);
  expect(remainingScrollDistance(metrics)).toBe(0);
  content(1200);
  expect(remainingScrollDistance(metrics)).toBe(200);
  content(200);
  expect(metrics.scrollY.value).toBe(0);
  expect(remainingScrollDistance(metrics)).toBe(0);
  expect(onLayout).toHaveBeenCalledTimes(2);
  expect(onContentSizeChange).toHaveBeenCalledTimes(3);
});

it('reports incorrect processed-handler use in the ordinary binding before an event fires', () => {
  function Misuse() { useScrollMetricsBinding({ onScroll: { workletEventHandler: {} } as unknown as ScrollHandlerProcessed }); return null; }
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try { expect(() => render(<Misuse />)).toThrow('useAnimatedScrollMetricsBinding({ handler })'); }
  finally { error.mockRestore(); }
});
