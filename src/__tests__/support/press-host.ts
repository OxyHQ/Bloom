/**
 * Pressing a component's OWN host node, and proving the component is what
 * installed the handler being measured.
 *
 * `fireEvent.press` walks UP from the element it is handed to the nearest
 * ancestor carrying an `onPress` prop, and it does not stop at host nodes — a
 * COMPOSITE counts, because `getEventHandler` only reads `element.props`. So
 * `<Thing onPress={fn}>` written in a test's own JSX catches the press itself.
 * Measured on `ProfileCard`: with the handler deleted from the component the
 * card rendered as an inert `View`, and the test still reported exactly one
 * call. Green, and measuring nothing. Nine suites had the same shape.
 *
 * Asserting the host node's own `onPress` FIRST closes both halves:
 *
 *  - a component that installs no handler at all fails here, and
 *  - a component that installs one which drops the caller's fails on the call
 *    count, because `fireEvent` now finds a handler AT the node and never walks
 *    past it to the test's own JSX.
 *
 * `host` must therefore be the node the component itself made pressable — the
 * one carrying its `testID` / `accessibilityLabel` — not a `Text` deep inside
 * it, or the walk-up is back and so is the hole.
 */
import { fireEvent } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

export function pressHost(host: ReactTestInstance): void {
  expect(typeof host.props.onPress).toBe('function');
  fireEvent.press(host);
}
