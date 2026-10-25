/**
 * Swipe-to-reply activates only on a drag towards the centre, never on the
 * first move.
 *
 * `activeOffsetX` is the range the finger may travel WITHOUT activating: RNGH
 * activates when `dx < start` or `dx > end` (`PanGestureHandler.shouldActivate`).
 * Bloom passed `[-9999, -12]` and `[12, 9999]`, ranges without 0, so the pan
 * activated on the first move event and cancelled the JS responder. Measured on
 * Android (Allo, Pixel 8a): holding a message opened no menu. This applies the
 * native rule to the recorded config.
 */
import { render } from '@testing-library/react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { MessageBubble } from '../message-bubble';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { MockGesture } from '../../__mocks__/react-native-gesture-handler';

function activates(direction: 'incoming' | 'outgoing', dx: number): boolean {
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MessageBubble direction={direction} text="Hola" onSwipeReply={() => {}} />
    </BloomThemeProvider>,
  );
  const gesture = screen.UNSAFE_getByType(GestureDetector).props.gesture as MockGesture;
  const [start, end] = gesture.__config.activeOffsetX as [number, number];
  screen.unmount();
  return dx < start || dx > end;
}

describe('swipe to reply', () => {
  it.each(['incoming', 'outgoing'] as const)(
    'does not activate on a %s bubble the finger has barely moved on',
    (direction) => {
      for (const dx of [0, 1, -1, 11, -11]) expect(activates(direction, dx)).toBe(false);
    },
  );

  it('activates on a drag towards the centre only', () => {
    expect(activates('incoming', 13)).toBe(true);
    expect(activates('incoming', -40)).toBe(false);
    expect(activates('outgoing', -13)).toBe(true);
    expect(activates('outgoing', 40)).toBe(false);
  });
});
