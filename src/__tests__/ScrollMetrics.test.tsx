import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ScrollArea, ScrollMetricsProvider, ScreenScope } from '../layout';
import { remainingScrollDistance, useScrollMetricsValue, type ScrollMetrics } from '../layout/scroll-metrics';
import { PageHeader } from '../page-header';
import { PageFooter } from '../page-footer';
import { resolvedStyle, classNamesOn, styleEntries } from './support/rendered-style';

function layout(view: ReturnType<typeof render>, id: string, height: number) {
  fireEvent(view.getByTestId(id), 'layout', { nativeEvent: { layout: { width: 390, height, x: 0, y: 0 } } });
}
function content(view: ReturnType<typeof render>, id: string, height: number) {
  fireEvent(view.getByTestId(id), 'contentSizeChange', 390, height);
}
function scroll(view: ReturnType<typeof render>, id: string, y: number, contentHeight = 1000, viewportHeight = 400) {
  fireEvent.scroll(view.getByTestId(id), { nativeEvent: { contentOffset: { x: 0, y }, contentSize: { width: 390, height: contentHeight }, layoutMeasurement: { width: 390, height: viewportHeight } } });
}

it('measures before scroll, clamps bounce, updates resize and preserves caller events without rerendering content', () => {
  let metrics: ScrollMetrics | null = null;
  let renders = 0;
  function Probe() { renders++; metrics = useScrollMetricsValue(); return <Text>Content</Text>; }
  const onLayout = jest.fn(), onContentSizeChange = jest.fn(), onScroll = jest.fn();
  const view = render(<ScrollMetricsProvider><ScrollArea testID="area" onLayout={onLayout} onContentSizeChange={onContentSizeChange} onScroll={onScroll}><Probe /></ScrollArea></ScrollMetricsProvider>);
  expect(remainingScrollDistance(metrics)).toBe(0);
  layout(view, 'area', 400);
  content(view, 'area', 1000);
  expect(remainingScrollDistance(metrics)).toBe(600);
  scroll(view, 'area', 590);
  expect(remainingScrollDistance(metrics)).toBe(10);
  scroll(view, 'area', 620);
  expect(remainingScrollDistance(metrics)).toBe(0);
  scroll(view, 'area', -40);
  expect(remainingScrollDistance(metrics)).toBe(600);
  scroll(view, 'area', 600);
  layout(view, 'area', 800);
  expect(remainingScrollDistance(metrics)).toBe(0);
  content(view, 'area', 1200);
  expect(remainingScrollDistance(metrics)).toBe(200);
  content(view, 'area', 200);
  expect(remainingScrollDistance(metrics)).toBe(0);
  expect(metrics!.scrollY.value).toBe(0);
  expect(onLayout).toHaveBeenCalledTimes(2);
  expect(onContentSizeChange).toHaveBeenCalledTimes(3);
  expect(onScroll).toHaveBeenCalledTimes(4);
  expect(renders).toBe(1);
});

it('coordinates header and footer endpoints, while keeping default and explicit footer modes', () => {
  let refresh: () => void = () => {};
  function Chrome() {
    const [revision, bump] = React.useReducer(x => x + 1, 0);
    refresh = bump;
    // The Jest animation mock evaluates on render; this only drives the test clock.
    return <><PageHeader testID={`header`} title={String(revision)} scrim="auto" safeArea={false} />
      <PageFooter testID="footer" scrim="auto" safeArea={false} style={{ opacity: revision >= 0 ? 1 : 0 }} />
      <PageFooter testID="always" /><PageFooter testID="none" scrim="none" /></>;
  }
  const view = render(<BloomThemeProvider><ScrollMetricsProvider><Chrome /><ScrollArea testID="area"><Text>Content</Text></ScrollArea></ScrollMetricsProvider></BloomThemeProvider>);
  const opacity = (id: string) => resolvedStyle(view.getByTestId(`${id}-scrim`).props.style).opacity;
  expect(opacity('header')).toBe(0);
  expect(opacity('footer')).toBe(0);
  expect(opacity('always')).toBe(1);
  expect(view.queryByTestId('none-scrim')).toBeNull();
  layout(view, 'area', 400); content(view, 'area', 1000); act(refresh);
  expect(opacity('header')).toBe(0); expect(opacity('footer')).toBe(1);
  scroll(view, 'area', 10); act(refresh);
  expect(opacity('header')).toBe(0.5); expect(opacity('footer')).toBe(1);
  scroll(view, 'area', 590); act(refresh);
  expect(opacity('footer')).toBe(0.5);
  scroll(view, 'area', 600); act(refresh);
  expect(opacity('footer')).toBe(0);
  content(view, 'area', 200); act(refresh);
  expect(opacity('header')).toBe(0); expect(opacity('footer')).toBe(0);
});

it('isolates independent panes and clears inherited metrics for modal screen scopes', () => {
  const seen: Record<string, ScrollMetrics | null> = {};
  function Probe({ id }: { id: string }) { seen[id] = useScrollMetricsValue(); return null; }
  const view = render(<ScrollMetricsProvider><Probe id="outer" /><ScrollArea testID="outer-area" />
    <ScrollMetricsProvider><Probe id="inner" /><ScrollArea testID="inner-area" /></ScrollMetricsProvider>
    <ScreenScope><Probe id="modal" /></ScreenScope>
  </ScrollMetricsProvider>);
  scroll(view, 'outer-area', 200);
  expect(seen.outer!.scrollY.value).toBe(200);
  expect(seen.inner!.scrollY.value).toBe(0);
  expect(seen.modal).toBeNull();
  scroll(view, 'inner-area', 600);
  expect(remainingScrollDistance(seen.inner!)).toBe(0);
  expect(remainingScrollDistance(seen.outer!)).toBe(400);
});


it('maps viewport and content utilities without a consumer JSX transform', () => {
  const view = render(<ScrollMetricsProvider><ScrollArea testID="styled" className="flex-1" contentContainerClassName="p-4" style={{ minHeight: 0 }} contentContainerStyle={{ gap: 12 }} /></ScrollMetricsProvider>);
  const area = view.getByTestId('styled');
  expect(classNamesOn(area.props.style)).toContain('flex-1');
  expect(styleEntries(area.props.contentContainerStyle)).toContainEqual({ $$css: true, contentContainerClassName: 'p-4' });
  expect(resolvedStyle(area.props.style).minHeight).toBe(0);
  expect(resolvedStyle(area.props.contentContainerStyle).gap).toBe(12);
});
