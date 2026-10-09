/** @jest-environment jsdom */
import React from 'react';
import { AccessibilityInfo, Platform, Text, TextInput } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AppShellSplitPanes } from '../app-shell/AppShellSplit';
import { useAppShellPaneActive } from '../app-shell/context';

const completed: (() => void)[] = [];
beforeEach(() => {
  completed.length = 0;
  jest.spyOn(Reanimated, 'withTiming').mockImplementation((value, _config, callback) => {
    completed.push(() => callback?.(true));
    return value;
  });
});
afterEach(() => jest.restoreAllMocks());

function Activity({ name }: { name: string }) {
  return <Text testID={`${name}-active`}>{String(useAppShellPaneActive())}</Text>;
}
function Frame({ selected = false, mobile = false, transition = 'slide' as 'slide' | 'none' }) {
  return <BloomThemeProvider mode="light"><AppShellSplitPanes transition={transition}
    variant="separated" testID="split" paneScroll={false}
    showList={!mobile || !selected} showDetail={selected}
    list={<><TextInput testID="draft" /><Activity name="list" /></>}
    detail={selected ? <Activity name="detail" /> : undefined} />
  </BloomThemeProvider>;
}

it('retains exiting detail, marks it inactive immediately and releases it on completion', () => {
  const view = render(<Frame selected />);
  view.rerender(<Frame />);
  expect(view.getByTestId('detail-active', { includeHiddenElements: true }).props.children).toBe('false');
  expect(view.getByTestId('split-pane-detail', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
  expect(view.getByTestId('split-pane-detail', { includeHiddenElements: true }).props['aria-hidden']).toBe(true);
  act(() => completed[completed.length - 1]!());
  expect(view.queryByTestId('detail-active', { includeHiddenElements: true })).toBeNull();
});

it('retains the mobile list only during its slide, while logical visibility changes immediately', () => {
  const view = render(<Frame mobile />);
  view.rerender(<Frame mobile selected />);
  expect(view.getByTestId('list-active', { includeHiddenElements: true }).props.children).toBe('false');
  expect(view.getByTestId('detail-active').props.children).toBe('true');
  act(() => completed[completed.length - 1]!());
  expect(view.queryByTestId('split-pane-list', { includeHiddenElements: true })).toBeNull();
  view.rerender(<Frame mobile />);
  expect(view.getByTestId('list-active').props.children).toBe('true');
  expect(view.getByTestId('detail-active', { includeHiddenElements: true }).props.children).toBe('false');
  act(() => completed[completed.length - 1]!());
  expect(view.queryByTestId('split-pane-detail', { includeHiddenElements: true })).toBeNull();
});

it('ignores stale completion after a rapid close/reopen', () => {
  const view = render(<Frame selected />);
  view.rerender(<Frame />);
  const oldClose = completed[completed.length - 1]!;
  view.rerender(<Frame selected />);
  act(oldClose);
  expect(view.getByTestId('detail-active').props.children).toBe('true');
  expect(view.getByTestId('split-pane-detail')).toBeTruthy();
});

it('preserves the desktop list instance while entering and leaving detail', () => {
  const mounted = jest.fn();
  function Draft() {
    const [value, setValue] = React.useState('');
    React.useEffect(mounted, []);
    return <TextInput testID="draft" value={value} onChangeText={setValue} />;
  }
  const frame = (selected: boolean) => <BloomThemeProvider mode="light"><AppShellSplitPanes transition="slide"
    list={<Draft />} detail={<Text>Detail</Text>} showDetail={selected} paneScroll={false} /></BloomThemeProvider>;
  const view = render(frame(false));
  fireEvent.changeText(view.getByTestId('draft'), 'Kept draft');
  view.rerender(frame(true));
  view.rerender(frame(false));
  act(() => completed[completed.length - 1]!());
  expect(view.getByTestId('draft').props.value).toBe('Kept draft');
  expect(mounted).toHaveBeenCalledTimes(1);
});

it('settles reduced motion without retaining invisible panes or starting an animation', () => {
  jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
  const view = render(<Frame mobile />);
  view.rerender(<Frame mobile selected />);
  expect(view.queryByTestId('split-pane-list', { includeHiddenElements: true })).toBeNull();
  view.rerender(<Frame mobile />);
  expect(view.queryByTestId('split-pane-detail', { includeHiddenElements: true })).toBeNull();
  expect(Reanimated.withTiming).not.toHaveBeenCalled();
});

it('leaves the default immediate unmount behavior intact', () => {
  const view = render(<Frame transition="none" selected />);
  view.rerender(<Frame transition="none" />);
  expect(view.queryByTestId('split-pane-detail', { includeHiddenElements: true })).toBeNull();
  expect(Reanimated.withTiming).not.toHaveBeenCalled();
});


it('settles a retained exit when the native reduced-motion preference changes', () => {
  let preferenceChanged: ((enabled: boolean) => void) | undefined;
  const remove = jest.fn();
  const accessibility: { addEventListener(event: 'reduceMotionChanged', listener: (enabled: boolean) => void): { remove(): void } } = AccessibilityInfo;
  jest.spyOn(accessibility, 'addEventListener').mockImplementation((_name, listener) => {
    preferenceChanged = listener;
    return { remove };
  });
  const view = render(<Frame mobile selected />);
  view.rerender(<Frame mobile />);
  expect(view.getByTestId('split-pane-detail', { includeHiddenElements: true })).toBeTruthy();
  act(() => preferenceChanged!(true));
  expect(view.queryByTestId('split-pane-detail', { includeHiddenElements: true })).toBeNull();
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

it('settles a retained exit when the web media preference changes', () => {
  const originalOS = Platform.OS;
  const originalMatchMedia = window.matchMedia;
  let changed: (() => void) | undefined;
  const remove = jest.fn();
  const media = { matches: false, addEventListener: (_type: string, handler: () => void) => { changed = handler; }, removeEventListener: remove };
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  window.matchMedia = jest.fn(() => media as unknown as MediaQueryList);
  try {
    const view = render(<Frame selected />);
    view.rerender(<Frame />);
    expect(view.getByTestId('split-pane-detail', { includeHiddenElements: true })).toBeTruthy();
    act(() => { media.matches = true; changed!(); });
    expect(view.queryByTestId('split-pane-detail', { includeHiddenElements: true })).toBeNull();
    view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
    window.matchMedia = originalMatchMedia;
  }
});
