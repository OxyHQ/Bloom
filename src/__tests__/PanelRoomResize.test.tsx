/**
 * Panes follow their room at once: a window or container resizing lays the
 * panels (and a window's reading envelope around them) out immediately, as a
 * live resize does on macOS and Android, while a change of the layout itself
 * (a panel shown or hidden) still moves. Animating
 * toward a width the window already has left a pane's trailing content outside
 * a shrinking window for the motion's length (OxyOS's sample, a menu anchored
 * there).
 */
import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';

import { AppShell } from '../app-shell';
import * as motion from '../app-shell/panel-motion';
import * as recipes from '../motion/recipes';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import { fakeWindow } from './support/fake-window';
import { resolvedStyle } from './support/rendered-style';

function setWidth(width: number) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

const layout = (inboxVisible: boolean): AppShellPanelLayout => ({
  mode: 'split',
  gap: 8,
  panels: [
    {
      id: 'inbox',
      width: 340,
      visible: inboxVisible,
      content: <ReactNative.Text>Inbox</ReactNative.Text>,
    },
    { id: 'detail', content: <ReactNative.Text>Detail</ReactNative.Text> },
  ],
});

const ui = (inboxVisible: boolean, windowed = false) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {windowed ? (
      <PlatformSurfaceProvider value={fakeWindow().adapter}>
        <AppShell testID="shell" panelLayout={layout(inboxVisible)} />
      </PlatformSurfaceProvider>
    ) : (
      <AppShell testID="shell" panelLayout={layout(inboxVisible)} />
    )}
  </BloomThemeProvider>
);

/** Each panel layout change: its target width and whether it lands at once. */
function moves(spy: jest.SpyInstance) {
  return spy.mock.calls.map(([, target, , immediate]) => ({
    width: (target as { width: number }).width,
    immediate: immediate as boolean,
  }));
}

it('a resized window lays its panes out at once, with no motion', () => {
  expect(ReactNative.Platform.OS).not.toBe('web');
  setWidth(1440);
  const animate = jest.spyOn(motion, 'animatePanelLayout');
  const screen = render(ui(true));
  animate.mockClear();
  setWidth(1200);
  screen.rerender(ui(true));
  // Only the detail pane changes: 240 narrower, landing at once.
  expect(moves(animate)).toEqual([{ width: 852, immediate: true }]);
  animate.mockClear();
  setWidth(1440);
  screen.rerender(ui(true));
  expect(moves(animate)).toEqual([{ width: 1092, immediate: true }]);
});

it('a panel shown or hidden still moves, in a window of the same size', () => {
  setWidth(1440);
  const animate = jest.spyOn(motion, 'animatePanelLayout');
  const screen = render(ui(true));
  animate.mockClear();
  screen.rerender(ui(false));
  expect(moves(animate).length).toBeGreaterThan(0);
  expect(moves(animate).every((move) => !move.immediate)).toBe(true);
  animate.mockClear();
  screen.rerender(ui(true));
  expect(moves(animate).length).toBeGreaterThan(0);
  expect(moves(animate).every((move) => !move.immediate)).toBe(true);
});

it("a window's reading envelope follows its resize at once too", () => {
  // In a window the panels sit in the shell's numeric reading envelope, which
  // sprang toward the new width on its own.
  setWidth(1440);
  const animate = jest.spyOn(recipes, 'animateMotion');
  const screen = render(ui(true, true));
  animate.mockClear();
  setWidth(1200);
  screen.rerender(ui(true, true));
  expect(
    animate.mock.calls.map(([, target, intent, immediate]) => [target, intent, immediate]),
  ).toEqual([[1168, 'expand', true]]);
});

describe('the commit that resizes a window', () => {
  // What React commits for the new size is what the window shows: a width that
  // came from an animated value would be the previous one until the next frame.
  const size = (screen: ReturnType<typeof render>, id: string) => {
    const box = resolvedStyle(screen.getByTestId(id).props.style);
    return { width: box.width, flexBasis: box.flexBasis };
  };

  it.each([
    [1200, 1440, 1092, 1408],
    [1440, 1200, 852, 1168],
  ])('from %i to %i lays the panes and the envelope out at once', (from, to, detail, content) => {
    setWidth(from);
    const screen = render(ui(true, true));
    setWidth(to);
    screen.rerender(ui(true, true));
    expect(size(screen, 'shell-panels-detail')).toEqual({ width: detail, flexBasis: 'auto' });
    expect(size(screen, 'shell-panels-inbox')).toEqual({ width: 340, flexBasis: 'auto' });
    expect(size(screen, 'shell-content')).toEqual({ width: content, flexBasis: 'auto' });
  });

  it('a panel hidden lands its neighbour at its new width once the motion ends', () => {
    setWidth(1440);
    const screen = render(ui(true, true));
    screen.rerender(ui(false, true));
    // jest's timing ends at once: React then rests at the motion's target (the
    // whole window, alone), while the animated size hands over at the same value.
    const detail = size(screen, 'shell-panels-detail');
    expect(detail.width).toBe(1440);
    expect([1440, 'auto']).toContain(detail.flexBasis);
  });
});
