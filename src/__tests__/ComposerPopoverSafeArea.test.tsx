/**
 * The composer's native popover stays inside the SAFE area.
 *
 * Its `Modal` draws edge to edge, and the placement used to clamp to the bare
 * window: the model picker's effort panel, opening below its chip near the
 * foot of the screen, "fitted" by 30px and landed under Android's gesture bar
 * (Pixel 8a, Android 16, Bloom 4.23.0).
 */
import React from 'react';
import { Text, type View } from 'react-native';
import * as ReactNative from 'react-native';
import * as SafeArea from 'react-native-safe-area-context';
import { act, fireEvent, render } from '@testing-library/react-native';

import { ComposerPopover } from '../composer-panel/ComposerPopover';
import { resolvedStyle } from './support/rendered-style';

const WINDOW = { width: 400, height: 800 };
const INSETS = { top: 40, bottom: 48, left: 0, right: 0 };

beforeEach(() => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ ...WINDOW, scale: 1, fontScale: 1 });
  jest.spyOn(SafeArea, 'useSafeAreaInsets').mockReturnValue(INSETS);
});
afterEach(() => jest.restoreAllMocks());

function place(anchor: { x: number; y: number; width: number; height: number }, panel: { width: number; height: number }, side: 'top' | 'bottom') {
  const anchorRef = {
    current: { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(anchor.x, anchor.y, anchor.width, anchor.height) } as unknown as View,
  };
  const screen = render(
    <ComposerPopover open onOpenChange={() => {}} anchorRef={anchorRef} label="Effort" side={side} sideOffset={10} testID="panel">
      <Text>Effort</Text>
    </ComposerPopover>,
  );
  act(() => {
    fireEvent(screen.getByTestId('panel'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, ...panel } } });
  });
  const style = resolvedStyle(screen.getByTestId('panel').props.style);
  return { top: style.top as number, bottom: (style.top as number) + panel.height };
}

it('flips a panel that would open under the gesture bar', () => {
  // Below the chip it ends at 762: inside the window (800 − 8), under the bar (800 − 48).
  const { top, bottom } = place({ x: 200, y: 560, width: 80, height: 32 }, { width: 300, height: 160 }, 'bottom');
  expect(bottom).toBeLessThanOrEqual(WINDOW.height - INSETS.bottom - 8);
  expect(top).toBe(560 - 10 - 160);
});

it('clamps a panel that fits on neither side to the safe area, not the window', () => {
  const { top, bottom } = place({ x: 20, y: 100, width: 80, height: 32 }, { width: 300, height: 680 }, 'bottom');
  expect(bottom).toBeLessThanOrEqual(WINDOW.height - INSETS.bottom - 8);
  expect(top).toBeGreaterThanOrEqual(INSETS.top + 8);
});
