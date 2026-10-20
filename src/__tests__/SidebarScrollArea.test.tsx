import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Text, ScrollView, Platform } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ScrollSurface } from '../layout/ScrollSurface';
import {
  ScrollMetricsProvider,
  useScrollMetricsValue,
  type ScrollMetrics,
} from '../layout/scroll-metrics';
import { resolvedStyle } from './support/rendered-style';

jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...base,
    __esModule: true,
    useAnimatedScrollHandler:
      (listeners: { onScroll?: (event: NativeScrollEvent) => void }) =>
      (event: NativeSyntheticEvent<NativeScrollEvent>) =>
        listeners.onScroll?.(event.nativeEvent),
  };
});
import { fireEvent, render } from '@testing-library/react-native';
import { SidebarScrollArea } from '../sidebar/SidebarScrollArea';

function mount() {
  const onScroll = jest.fn();
  const onContentSizeChange = jest.fn();
  const onLayout = jest.fn();
  const ui = () => (
    <BloomThemeProvider fonts={false}>
      <SidebarScrollArea
        testID="scroll"
        fadeColor="rgb(32, 40, 48)"
        contentContainerStyle={{ padding: 8, gap: 12 }}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
      >
        <Text>Rows</Text>
      </SidebarScrollArea>
    </BloomThemeProvider>
  );
  const view = render(ui());
  // The Reanimated test mock evaluates styles on render, not a device UI clock.
  const refresh = () => view.rerender(ui());
  const scroll = view.getByTestId('scroll');
  const layout = (height: number) => {
    fireEvent(scroll, 'layout', { nativeEvent: { layout: { width: 240, height } } });
    refresh();
  };
  const content = (height: number) => {
    fireEvent(scroll, 'contentSizeChange', 240, height);
    refresh();
  };
  const move = (y: number, height = 100, contentHeight = 400) => {
    fireEvent.scroll(scroll, {
      nativeEvent: {
        contentOffset: { x: 0, y },
        layoutMeasurement: { width: 240, height },
        contentSize: { width: 240, height: contentHeight },
      },
    });
    refresh();
  };
  const top = () => view.queryByTestId('scroll-fade-top', { includeHiddenElements: true });
  const bottom = () => view.queryByTestId('scroll-fade-bottom', { includeHiddenElements: true });
  const topOpacity = () => resolvedStyle(top()!.props.style).opacity;
  const bottomOpacity = () => resolvedStyle(bottom()!.props.style).opacity;
  return {
    view,
    scroll,
    layout,
    content,
    move,
    top,
    bottom,
    topOpacity,
    bottomOpacity,
    onScroll,
    onContentSizeChange,
    onLayout,
  };
}
it('waits for both measurements, then marks only edges containing more content', () => {
  const m = mount();
  expect(m.topOpacity()).toBe(0);
  expect(m.bottomOpacity()).toBe(0);
  m.content(400);
  expect(m.bottomOpacity()).toBe(0);
  m.layout(100);
  expect(m.topOpacity()).toBe(0);
  expect(m.bottomOpacity()).toBe(1);
  m.move(150);
  expect(m.topOpacity()).toBe(1);
  expect(m.bottomOpacity()).toBe(1);
  m.move(300);
  expect(m.topOpacity()).toBe(1);
  expect(m.bottomOpacity()).toBe(0);
  m.move(0);
  expect(m.topOpacity()).toBe(0);
  expect(m.bottomOpacity()).toBe(1);
});
it('clears stale fades after content shrinks or the viewport grows, ignoring subpixel overflow', () => {
  const m = mount();
  m.layout(100);
  m.content(400);
  m.move(150);
  m.content(80);
  expect(m.topOpacity()).toBe(0);
  expect(m.bottomOpacity()).toBe(0);
  m.content(400);
  m.layout(500);
  expect(m.topOpacity()).toBe(0);
  expect(m.bottomOpacity()).toBe(0);
  m.layout(399.5);
  expect(m.topOpacity()).toBe(0);
  expect(m.bottomOpacity()).toBe(0);
});
it('preserves content padding and consumer callbacks and never captures edge presses', () => {
  const m = mount();
  m.layout(100);
  m.content(400);
  m.move(150);
  expect(m.scroll.props.contentContainerStyle).toEqual({ padding: 8, gap: 12 });
  expect(m.onLayout).toHaveBeenCalledTimes(1);
  expect(m.onContentSizeChange).toHaveBeenCalledWith(240, 400);
  expect(m.onScroll).toHaveBeenCalledTimes(1);
  expect(m.top()!.props.pointerEvents).toBe('none');
  expect(m.bottom()!.props.pointerEvents).toBe('none');
  expect(m.top()!.props['aria-hidden']).toBe(true);
});

it.each(['ios', 'android'])('retains the %s system indicator and one scroll owner', (platform) => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: platform });
  try {
    const m = mount();
    expect(m.view.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
    expect(m.scroll.props.showsVerticalScrollIndicator).toBe(true);
    expect(m.scroll.props.indicatorStyle).toBe('black');
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: previous });
  }
});
it('keeps sidebar measurements separate from the surrounding screen', () => {
  const metrics: Record<string, ScrollMetrics | null> = {};
  function Probe({ id }: { id: string }) {
    metrics[id] = useScrollMetricsValue();
    return null;
  }
  const view = render(
    <BloomThemeProvider fonts={false}>
      <ScrollMetricsProvider>
        <Probe id="page" />
        <SidebarScrollArea testID="side" fadeColor="#ffffff">
          <Probe id="sidebar" />
        </SidebarScrollArea>
      </ScrollMetricsProvider>
    </BloomThemeProvider>,
  );
  fireEvent.scroll(view.getByTestId('side'), {
    nativeEvent: {
      contentOffset: { x: 0, y: 120 },
      contentSize: { width: 200, height: 400 },
      layoutMeasurement: { width: 200, height: 100 },
    },
  });
  expect(metrics.sidebar!.scrollY.value).toBe(120);
  expect(metrics.sidebar!.contentHeight.value).toBe(400);
  expect(metrics.page!.scrollY.value).toBe(0);
  expect(metrics.page!.contentHeight.value).toBe(-1);
});
it('keeps existing ScrollSurface sizing defaults and separates new host layout from content layout', () => {
  const ui = (custom: boolean) => (
    <BloomThemeProvider fonts={false}>
      <ScrollSurface
        testID="surface"
        {...(custom
          ? {
              hostStyle: { flexShrink: 1 },
              style: { minHeight: 0 },
              fadeColor: 'rgba(20, 40, 60, 0.5)',
              fadeHeight: 40,
              fadeBottom: true,
            }
          : {})}
      >
        <Text>Content</Text>
      </ScrollSurface>
    </BloomThemeProvider>
  );
  const view = render(ui(false));
  expect(resolvedStyle(view.getByTestId('surface').props.style).height).toBe('100%');
  expect(
    resolvedStyle(view.getByTestId('surface-fade-top', { includeHiddenElements: true }).props.style)
      .height,
  ).toBe(24);
  view.rerender(ui(true));
  expect(resolvedStyle(view.getByTestId('surface-viewport').props.style).flexShrink).toBe(1);
  expect(resolvedStyle(view.getByTestId('surface').props.style).height).toBeUndefined();
  fireEvent.scroll(view.getByTestId('surface'), {
    nativeEvent: {
      contentOffset: { x: 0, y: 20 },
      contentSize: { width: 200, height: 400 },
      layoutMeasurement: { width: 200, height: 100 },
    },
  });
  view.rerender(ui(true));
  const edge = view.getByTestId('surface-fade-top', { includeHiddenElements: true });
  expect(resolvedStyle(edge.props.style).height).toBe(40);
  expect(resolvedStyle(edge.props.style).opacity).toBe(0.25);
});
