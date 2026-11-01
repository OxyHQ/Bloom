/**
 * `ContextMenu`'s controlled form on NATIVE: a non-null `anchor` presents the
 * same bottom sheet a long press does (its position means nothing to a sheet),
 * `null` takes it away, and a dismissal from inside the sheet asks the caller
 * to clear the anchor. A trigger in this form reports the press instead of
 * opening on its own. The web half is `ContextMenuControlled.web.test.tsx`.
 */
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  type ContextMenuAnchor,
} from '../context-menu';
import { LONG_PRESS_MS } from '../floating/LongPressArea';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const calls = { open: jest.fn(), anchor: jest.fn(), rename: jest.fn() };
beforeEach(() => {
  jest.useFakeTimers();
  for (const fn of Object.values(calls)) fn.mockClear();
});
afterEach(() => jest.useRealTimers());

function settle() {
  act(() => {
    jest.advanceTimersByTime(1000);
  });
}

function Controlled({
  withTrigger = false,
  follow = true,
}: {
  withTrigger?: boolean;
  follow?: boolean;
}) {
  const [anchor, setAnchor] = useState<ContextMenuAnchor | null>(null);
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Pressable accessibilityLabel="Open" onPress={() => setAnchor({ x: 10, y: 20 })}>
        <Text>Open</Text>
      </Pressable>
      <Pressable accessibilityLabel="Clear" onPress={() => setAnchor(null)}>
        <Text>Clear</Text>
      </Pressable>
      <ContextMenu
        anchor={anchor}
        onOpenChange={calls.open}
        onAnchorChange={(next) => {
          calls.anchor(next);
          if (follow) setAnchor(next);
        }}
      >
        {withTrigger ? (
          <ContextMenuTrigger label="Message actions">
            <Text>Hold me</Text>
          </ContextMenuTrigger>
        ) : null}
        <ContextMenuContent>
          <ContextMenuItem onPress={calls.rename}>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </BloomThemeProvider>
  );
}

it('presents the sheet exactly while the anchor is non-null', () => {
  const screen = render(<Controlled />);
  settle();
  expect(screen.queryByText('Rename')).toBeNull();

  fireEvent.press(screen.getByLabelText('Open'));
  settle();
  expect(screen.getByText('Rename')).toBeTruthy();
  expect(calls.open).not.toHaveBeenCalled();

  fireEvent.press(screen.getByLabelText('Clear'));
  settle();
  expect(screen.queryByText('Rename')).toBeNull();
  // The caller closed it; the sheet's own exit does not report back.
  expect(calls.open).not.toHaveBeenCalled();
});

it('a row asks the caller to clear the anchor, once', () => {
  const screen = render(<Controlled />);
  fireEvent.press(screen.getByLabelText('Open'));
  settle();
  fireEvent.press(screen.getByText('Rename'));
  settle();
  expect(calls.rename).toHaveBeenCalledTimes(1);
  expect(calls.open.mock.calls).toEqual([[false]]);
  expect(calls.anchor.mock.calls).toEqual([[null]]);
  expect(screen.queryByText('Rename')).toBeNull();
});

it('a long press on a trigger reports the press point and opens once stored', () => {
  const screen = render(<Controlled withTrigger follow={false} />);
  const area = screen.getByLabelText('Message actions');
  fireEvent(area, 'touchStart', { nativeEvent: { pageX: 120, pageY: 340, touches: [{}] } });
  act(() => {
    jest.advanceTimersByTime(LONG_PRESS_MS);
  });
  expect(calls.open).toHaveBeenCalledWith(true);
  expect(calls.anchor).toHaveBeenCalledWith({ x: 120, y: 340 });
  settle();
  expect(screen.queryByText('Rename')).toBeNull();
});

it("the trigger's longpress action asks for its frame, and opens once stored", () => {
  // The trigger's wrapper, measured in the window as the action opens it: at (16, 200), 300 × 48.
  const screen = render(<Controlled withTrigger />, {
    createNodeMock: () => ({
      measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
        callback(16, 200, 300, 48),
    }),
  });
  const area = screen.getByLabelText('Message actions');
  expect(area.props.accessibilityActions).toEqual([{ name: 'longpress', label: 'Show menu' }]);
  fireEvent(area, 'accessibilityAction', { nativeEvent: { actionName: 'longpress' } });
  expect(calls.open).toHaveBeenCalledWith(true);
  expect(calls.anchor).toHaveBeenCalledTimes(1);
  expect(calls.anchor).toHaveBeenCalledWith({ top: 200, right: 316, bottom: 248, left: 16 });
  settle();
  expect(screen.getByText('Rename')).toBeTruthy();
});

it('a disabled trigger offers no longpress and ignores one', () => {
  const screen = render(
    <ContextMenu onOpenChange={calls.open}>
      <ContextMenuTrigger label="Message actions" disabled>
        <Text>Hold me</Text>
      </ContextMenuTrigger>
    </ContextMenu>,
  );
  const area = screen.getByLabelText('Message actions');
  expect(area.props.accessibilityActions).toBeUndefined();
  area.props.onAccessibilityAction?.({ nativeEvent: { actionName: 'longpress' } });
  expect(calls.open).not.toHaveBeenCalled();
});

it('an asChild child keeps its own actions beside the longpress, each answered by its owner', () => {
  const own = jest.fn();
  const screen = render(
    <ContextMenu onOpenChange={calls.open}>
      <ContextMenuTrigger asChild>
        <Pressable
          accessibilityRole="listitem"
          accessibilityLabel="report.txt"
          accessibilityActions={[{ name: 'rename', label: 'Rename' }]}
          onAccessibilityAction={(event) => own(event.nativeEvent.actionName)}
        >
          <Text>report.txt</Text>
        </Pressable>
      </ContextMenuTrigger>
    </ContextMenu>,
  );
  const item = screen.getByLabelText('report.txt');
  expect(item.props.accessibilityActions).toEqual([
    { name: 'rename', label: 'Rename' },
    { name: 'longpress', label: 'Show menu' },
  ]);
  expect(item.props['aria-expanded']).toBeUndefined();
  fireEvent(item, 'accessibilityAction', { nativeEvent: { actionName: 'rename' } });
  expect(own.mock.calls).toEqual([['rename']]);
  expect(calls.open).not.toHaveBeenCalled();
  fireEvent(item, 'accessibilityAction', { nativeEvent: { actionName: 'longpress' } });
  expect(own.mock.calls).toEqual([['rename']]);
  expect(calls.open).toHaveBeenCalledWith(true);
});

it("gives a Button child the trigger's longpress, with no expanded state", () => {
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ContextMenu onOpenChange={calls.open}>
        <ContextMenuTrigger asChild>
          <Button testID="icon" accessibilityLabel="Stash" onPress={() => {}}>
            Stash
          </Button>
        </ContextMenuTrigger>
      </ContextMenu>
    </BloomThemeProvider>,
  );
  const icon = screen.getByTestId('icon');
  expect(icon.props.accessibilityActions).toEqual([{ name: 'longpress', label: 'Show menu' }]);
  expect(icon.props['aria-expanded']).toBeUndefined();
  expect(icon.props.accessibilityState?.expanded).toBeUndefined();
  fireEvent(icon, 'accessibilityAction', { nativeEvent: { actionName: 'longpress' } });
  expect(calls.open).toHaveBeenCalledWith(true);
});
