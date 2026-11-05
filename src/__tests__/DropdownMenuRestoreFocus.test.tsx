/**
 * A dropdown's trigger gives the screen reader's focus back to itself as its menu closes, unless
 * it says otherwise (`restoreFocus={false}`): a system menu opened with the pointer hands the
 * keyboard back to the window that had it, and a restore 50ms later would take it away again.
 */
import React from 'react';
import { AccessibilityInfo, Platform, Pressable, Text } from 'react-native';
import { render } from '@testing-library/react-native';
// Explicit native owner, not the web barrel.
import { DropdownMenu, DropdownMenuTrigger } from '../dropdown-menu/DropdownMenu';
import { FOCUS_SETTLE_MS } from '../hooks/use-accessibility-focus';

const setFocus = AccessibilityInfo.sendAccessibilityEvent as jest.Mock;
/**
 * The test renderer resolves a host ref to `null` unless told what a node is, and a null ref is
 * indistinguishable from "no restore": without it the `false` case below passes for the wrong
 * reason (`accessibility-focus.test.tsx`).
 */
const node = {};
const createNodeMock = () => node;

function Menu({ open, restoreFocus }: { open: boolean; restoreFocus?: boolean }) {
  return (
    <DropdownMenu open={open} onOpenChange={() => {}}>
      <DropdownMenuTrigger asChild restoreFocus={restoreFocus}>
        <Pressable testID="trigger">
          <Text>Input source</Text>
        </Pressable>
      </DropdownMenuTrigger>
    </DropdownMenu>
  );
}

/** The `focus` events sent as the menu opens and then closes. */
function focusesOnClose(restoreFocus?: boolean): number {
  const screen = render(<Menu open={false} restoreFocus={restoreFocus} />, { createNodeMock });
  screen.rerender(<Menu open restoreFocus={restoreFocus} />);
  jest.advanceTimersByTime(FOCUS_SETTLE_MS);
  setFocus.mockClear();
  screen.rerender(<Menu open={false} restoreFocus={restoreFocus} />);
  jest.advanceTimersByTime(FOCUS_SETTLE_MS);
  return setFocus.mock.calls.filter(([target, event]) => target === node && event === 'focus')
    .length;
}

beforeEach(() => {
  jest.useFakeTimers();
  setFocus.mockClear();
  Platform.OS = 'ios';
});

afterEach(() => {
  jest.useRealTimers();
  Platform.OS = 'ios';
});

it('gives the screen reader focus back to the trigger as the menu closes, by default', () => {
  expect(focusesOnClose()).toBe(1);
  expect(focusesOnClose(true)).toBe(1);
});

it('leaves it where the caller puts it with restoreFocus={false}', () => {
  expect(focusesOnClose(false)).toBe(0);
});
