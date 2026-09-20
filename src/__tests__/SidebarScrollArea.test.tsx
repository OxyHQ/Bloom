import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SidebarScrollArea } from '../sidebar/SidebarScrollArea';

function mount() {
  const onScroll = jest.fn();
  const onContentSizeChange = jest.fn();
  const onLayout = jest.fn();
  const view = render(<SidebarScrollArea testID="scroll" fadeColor="rgb(32, 40, 48)" contentContainerStyle={{ padding: 8, gap: 12 }} onScroll={onScroll} onContentSizeChange={onContentSizeChange} onLayout={onLayout}><Text>Rows</Text></SidebarScrollArea>);
  const scroll = view.getByTestId('scroll');
  const layout = (height: number) => fireEvent(scroll, 'layout', { nativeEvent: { layout: { width: 240, height } } });
  const content = (height: number) => fireEvent(scroll, 'contentSizeChange', 240, height);
  const move = (y: number, height = 100, contentHeight = 400) => fireEvent.scroll(scroll, { nativeEvent: { contentOffset: { x: 0, y }, layoutMeasurement: { width: 240, height }, contentSize: { width: 240, height: contentHeight } } });
  const top = () => view.queryByTestId('scroll-fade-top', { includeHiddenElements: true });
  const bottom = () => view.queryByTestId('scroll-fade-bottom', { includeHiddenElements: true });
  return { view, scroll, layout, content, move, top, bottom, onScroll, onContentSizeChange, onLayout };
}
it('waits for both measurements, then marks only edges containing more content', () => {
  const m = mount();
  expect(m.top()).toBeNull(); expect(m.bottom()).toBeNull();
  m.content(400); expect(m.bottom()).toBeNull();
  m.layout(100); expect(m.top()).toBeNull(); expect(m.bottom()).not.toBeNull();
  m.move(150); expect(m.top()).not.toBeNull(); expect(m.bottom()).not.toBeNull();
  m.move(300); expect(m.top()).not.toBeNull(); expect(m.bottom()).toBeNull();
  m.move(0); expect(m.top()).toBeNull(); expect(m.bottom()).not.toBeNull();
});
it('clears stale fades after content shrinks or the viewport grows, ignoring subpixel overflow', () => {
  const m = mount(); m.layout(100); m.content(400); m.move(150);
  m.content(80); expect(m.top()).toBeNull(); expect(m.bottom()).toBeNull();
  m.content(400); m.layout(500); expect(m.top()).toBeNull(); expect(m.bottom()).toBeNull();
  m.layout(399.5); expect(m.top()).toBeNull(); expect(m.bottom()).toBeNull();
});
it('preserves content padding and consumer callbacks and never captures edge presses', () => {
  const m = mount(); m.layout(100); m.content(400); m.move(150);
  expect(m.scroll.props.contentContainerStyle).toEqual({ padding: 8, gap: 12 });
  expect(m.onLayout).toHaveBeenCalledTimes(1); expect(m.onContentSizeChange).toHaveBeenCalledWith(240, 400); expect(m.onScroll).toHaveBeenCalledTimes(1);
  expect(m.top()!.props.pointerEvents).toBe('none'); expect(m.bottom()!.props.pointerEvents).toBe('none');
  expect(m.top()!.props['aria-hidden']).toBe(true);
});
