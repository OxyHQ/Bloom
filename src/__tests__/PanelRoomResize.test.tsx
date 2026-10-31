/**
 * Panes follow their room natively: the panels (and a window's reading envelope
 * around them) are flex, so a window or container resizing lays them out in
 * Yoga's pass, as a live resize does on macOS and Android, with nothing in
 * React changing or moving; a change of the layout itself (a panel shown or
 * hidden) still moves. Panes once sized in pixels from a measured width
 * trailed a resizing window by the two commits that measurement took.
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
import { mockWindowSize } from './support/window-size';
import { resolvedStyle } from './support/rendered-style';

function setWidth(width: number) {
  mockWindowSize({ width, height: 900, scale: 1, fontScale: 1 });
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

/** Each panel layout change: its target flex and whether it lands at once. */
function moves(spy: jest.SpyInstance) {
  return spy.mock.calls.map(([, target, , immediate]) => ({
    ...(target as { grow: number; basis: number; visible: boolean }),
    immediate: immediate as boolean,
  }));
}
const style = (screen: ReturnType<typeof render>, id: string) =>
  resolvedStyle(screen.getByTestId(id).props.style);

it('a resized window lays its panes out natively: nothing in React moves or changes', () => {
  expect(ReactNative.Platform.OS).not.toBe('web');
  setWidth(1440);
  const animate = jest.spyOn(motion, 'animatePanelFlex');
  const screen = render(ui(true));
  const before = {
    inbox: style(screen, 'shell-panels-inbox'),
    detail: style(screen, 'shell-panels-detail'),
  };
  // The inbox keeps its 340 beside the flexible detail, which takes the rest
  // (each basis a width under `flexBasis: auto`, which Yoga reads on every layout).
  expect(before.inbox).toMatchObject({ flexGrow: 0, flexBasis: 'auto', width: 340, flexShrink: 1 });
  expect(before.detail).toMatchObject({
    flexGrow: 1,
    flexBasis: 'auto',
    width: 0,
    flexShrink: 1,
    marginInlineStart: 8,
  });
  animate.mockClear();
  for (const width of [1200, 1440]) {
    setWidth(width);
    screen.rerender(ui(true));
    expect(moves(animate)).toEqual([]);
    expect(style(screen, 'shell-panels-inbox')).toEqual(before.inbox);
    expect(style(screen, 'shell-panels-detail')).toEqual(before.detail);
  }
});

it('a panel shown or hidden still moves, in a window of the same size', () => {
  setWidth(1440);
  const animate = jest.spyOn(motion, 'animatePanelFlex');
  const screen = render(ui(true));
  animate.mockClear();
  screen.rerender(ui(false));
  expect(moves(animate).length).toBeGreaterThan(0);
  expect(moves(animate).every((move) => !move.immediate)).toBe(true);
  // Alone, the detail fills the group.
  expect(moves(animate)).toContainEqual(
    expect.objectContaining({ grow: 1, basis: 0, visible: true }),
  );
  animate.mockClear();
  screen.rerender(ui(true));
  expect(moves(animate).length).toBeGreaterThan(0);
  expect(moves(animate).every((move) => !move.immediate)).toBe(true);
});

it("a window's reading envelope is flex too: a resize changes nothing React draws", () => {
  // In a window the panels fill the shell's reading envelope, which grows into
  // whatever room the row leaves; it once sprang toward each new width.
  setWidth(1440);
  const animate = jest.spyOn(recipes, 'animateMotion');
  const screen = render(ui(true, true));
  const content = style(screen, 'shell-content');
  expect(content).toMatchObject({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    width: 0,
    minWidth: 0,
  });
  animate.mockClear();
  setWidth(1200);
  screen.rerender(ui(true, true));
  expect(animate).not.toHaveBeenCalled();
  expect(style(screen, 'shell-content')).toEqual(content);
});
