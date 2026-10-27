/**
 * The `pill` resize handle: a split's divider. A 4×36 bar, radius 2, centred
 * on the separator in the foreground colour, shown at 32% under the pointer or
 * focus and 55% while dragging, on a strip the gap plus 2px of each pane deep.
 * The web draws its states in CSS (`resize-handle-css.ts`); native holds them
 * in state. Same gestures, keys and semantics as the grip.
 */
import React from 'react';
import * as Native from 'react-native';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

let mockWeb = true;
jest.mock('../styles/platform', () => ({
  ...jest.requireActual('../styles/platform'),
  get IS_WEB() {
    return mockWeb;
  },
}));

import { ResizeHandle } from '../layout/ResizeHandle';
import {
  PILL_DRAG_OPACITY,
  PILL_HOVER_OPACITY,
  RESIZE_HANDLE,
  RESIZE_HANDLE_CSS,
} from '../layout/resize-handle-css';
import { AppShell } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';

let foreground = '';
function Foreground() {
  foreground = useTheme().colors.text;
  return null;
}
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    <Foreground />
    {children}
  </BloomThemeProvider>
);

beforeEach(() => {
  mockWeb = true;
});
afterEach(() => jest.restoreAllMocks());

const flat = (node: { props: { style?: unknown } }) =>
  StyleSheet.flatten(node.props.style as Native.StyleProp<Native.ViewStyle>) ?? {};
const pillOf = (screen: ReturnType<typeof render>) =>
  screen.getByTestId('handle').children[0] as unknown as { props: Record<string, unknown> };

describe('the pill resize handle', () => {
  it('measures 4×36, radius 2, in the foreground colour, centred on an 11 strip', () => {
    const screen = render(<ResizeHandle testID="handle" variant="pill" onResize={() => {}} />, {
      wrapper,
    });
    const handle = screen.getByTestId('handle');
    expect(handle.props.dataSet).toEqual({
      bloomResizeHandle: '',
      bloomResizeHandleVariant: 'pill',
    });
    expect(handle.props.role).toBe('separator');
    expect(flat(handle)).toMatchObject({
      top: 0,
      bottom: 0,
      width: 11,
      insetInlineEnd: -5.5,
    });
    expect(flat(handle)).not.toHaveProperty('right');
    const pill = pillOf(screen);
    expect(pill.props.dataSet).toEqual({ bloomResizeHandlePill: '' });
    expect(flat(pill)).toEqual({
      width: RESIZE_HANDLE.pill.depth,
      height: RESIZE_HANDLE.pill.length,
      borderRadius: 2,
      backgroundColor: foreground,
    });
    expect(foreground).toBeTruthy();
  });

  it('lies along a horizontal separator, and takes its strip depth from the caller', () => {
    const screen = render(
      <ResizeHandle
        testID="handle"
        variant="pill"
        orientation="horizontal"
        thickness={15}
        onResize={() => {}}
      />,
      { wrapper },
    );
    expect(flat(screen.getByTestId('handle'))).toMatchObject({
      left: 0,
      right: 0,
      height: 15,
      bottom: -7.5,
    });
    expect(flat(pillOf(screen))).toMatchObject({ width: 36, height: 4 });
  });

  it('keeps the grip as the default, at its own classes', () => {
    const screen = render(<ResizeHandle testID="handle" onResize={() => {}} />, { wrapper });
    const handle = screen.getByTestId('handle');
    expect(handle.props.dataSet).toEqual({
      bloomResizeHandle: '',
      bloomResizeHandleVariant: 'grip',
    });
    expect(flat(handle)).not.toHaveProperty('width');
    expect(flat(handle)).not.toHaveProperty('insetInlineEnd');
  });

  it('drags and nudges like the grip', () => {
    const onResize = jest.fn();
    const onNudge = jest.fn();
    const screen = render(
      <ResizeHandle testID="handle" variant="pill" onResize={onResize} onNudge={onNudge} />,
      { wrapper },
    );
    const handle = screen.getByTestId('handle');
    fireEvent(handle, 'keyDown', { nativeEvent: { key: 'ArrowRight' } });
    expect(onNudge).toHaveBeenCalledWith(16);
    const target = {
      style: { setProperty: jest.fn() },
      setAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
      hasPointerCapture: () => true,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 11, height: 600 }),
    };
    fireEvent(handle, 'pointerDown', {
      preventDefault: jest.fn(),
      nativeEvent: { clientX: 100, clientY: 20, pointerId: 1 },
      currentTarget: target,
    });
    expect(target.setAttribute).toHaveBeenCalledWith('data-bloom-resize-handle-dragging', 'on');
    fireEvent(handle, 'pointerMove', {
      nativeEvent: { clientX: 140, clientY: 20, pointerId: 1 },
      currentTarget: target,
    });
    expect(onResize).toHaveBeenLastCalledWith(40);
  });

  it('draws its states in CSS on the web: hover and focus 32%, dragging 55%, no fade when motion is reduced', () => {
    const root = '[data-bloom-resize-handle][data-bloom-resize-handle-variant="pill"]';
    const rule = (selector: string) =>
      RESIZE_HANDLE_CSS.split('\n').find((line) => line.startsWith(selector)) ?? '';
    expect(RESIZE_HANDLE_CSS).toContain(`${root} [data-bloom-resize-handle-pill] { opacity: 0; }`);
    expect(RESIZE_HANDLE_CSS).toContain(
      `${root}:focus-visible [data-bloom-resize-handle-pill] { opacity: ${PILL_HOVER_OPACITY}; }`,
    );
    expect(rule(`${root}:hover`)).toContain('[data-bloom-resize-handle-pill],');
    expect(RESIZE_HANDLE_CSS).toContain(
      `${root} [data-bloom-resize-handle-pill="dragging"] { opacity: ${PILL_DRAG_OPACITY}; }`,
    );
    expect(rule(`${root}[data-bloom-resize-handle-dragging="on"]`)).toBeTruthy();
    // Later and more specific than the grip's own states, so they win.
    expect(RESIZE_HANDLE_CSS.indexOf(root)).toBeGreaterThan(
      RESIZE_HANDLE_CSS.indexOf('[data-bloom-resize-handle]:focus-visible'),
    );
    expect(RESIZE_HANDLE_CSS).toContain(
      // As specific as the rule that sets the fade, and later. A bare pill
      // selector lost to that rule, so reduced motion still faded.
      '@media (prefers-reduced-motion: reduce) { [data-bloom-resize-handle] [data-bloom-resize-handle-pill] { transition: none; } }',
    );
    expect(PILL_HOVER_OPACITY).toBe(0.32);
    expect(PILL_DRAG_OPACITY).toBe(0.55);
  });

  it('holds its states itself on native: nothing at rest, 32% under the pointer, 55% dragging', () => {
    mockWeb = false;
    const create = jest.spyOn(Native.PanResponder, 'create');
    const onResize = jest.fn();
    const screen = render(<ResizeHandle testID="handle" variant="pill" onResize={onResize} />, {
      wrapper,
    });
    const handle = screen.getByTestId('handle');
    const opacity = () => flat(pillOf(screen)).opacity;
    expect(opacity()).toBe(0);
    act(() => handle.props.onPointerEnter());
    expect(opacity()).toBe(PILL_HOVER_OPACITY);
    // The jest mock hands back the config the handle gave PanResponder.
    const pan = create.mock.calls[
      create.mock.calls.length - 1
    ]![0] as Required<Native.PanResponderCallbacks>;
    const event = { nativeEvent: { locationX: 5, locationY: 200 } } as never;
    act(() => pan.onPanResponderGrant(event, {} as never));
    expect(opacity()).toBe(PILL_DRAG_OPACITY);
    act(() => pan.onPanResponderMove(event, { dx: 30, dy: 0 } as never));
    expect(onResize).toHaveBeenLastCalledWith(30);
    act(() => pan.onPanResponderRelease(event, {} as never));
    expect(opacity()).toBe(PILL_HOVER_OPACITY);
    act(() => handle.props.onMouseLeave());
    expect(opacity()).toBe(0);
  });
});

describe('a split with pill dividers', () => {
  beforeEach(() =>
    jest
      .spyOn(Native, 'useWindowDimensions')
      .mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 }),
  );
  const split = (extra: Partial<AppShellPanelLayout>): AppShellPanelLayout => ({
    mode: 'split',
    gap: 7,
    panels: [
      { id: 'a', minWidth: 220, resizable: true },
      { id: 'b', minWidth: 220 },
    ],
    ...extra,
  });

  it('puts the pill between panes, its strip the gap plus 2px of each pane', () => {
    const screen = render(
      <AppShell testID="shell" panelLayout={split({ resizeHandle: 'pill' })} />,
      { wrapper },
    );
    const handle = screen.UNSAFE_getByType(ResizeHandle);
    expect(handle.props.variant).toBe('pill');
    expect(handle.props.thickness).toBe(11);
    const joined = render(
      <AppShell testID="shell" panelLayout={split({ resizeHandle: 'pill', gap: 0 })} />,
      { wrapper },
    );
    expect(joined.UNSAFE_getByType(ResizeHandle).props.thickness).toBe(4);
  });

  it('keeps the grip unless asked', () => {
    const screen = render(<AppShell testID="shell" panelLayout={split({})} />, { wrapper });
    const handle = screen.UNSAFE_getByType(ResizeHandle);
    expect(handle.props.variant).toBeUndefined();
    expect(handle.props.thickness).toBeUndefined();
  });
});
