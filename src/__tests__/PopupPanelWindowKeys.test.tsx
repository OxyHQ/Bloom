/**
 * A native menu in a platform popup takes the keys from the window while it is
 * open, as a Mac's menu tracking does. A native host (OxyOS) offers every key
 * to the window's handlers (`PlatformKeyboard`) before it sends it to the
 * popup; a window's own keys (`useWindowKeys`: a file list's arrows) stand
 * aside while an anchored surface is open (`hasOpenFloatingSurface`), and the
 * popup panel is one for as long as it is mounted. Before, only the web's
 * `FloatingPanel` said so: Dropsea's list took ↓ and its context menu's rows
 * never moved.
 */
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { hasOpenFloatingSurface } from '../floating/escape-stack';
import { useWindowKeys } from '../kbd/use-window-keys';
import { BloomProvider } from '../provider';
import type {
  PlatformKeyEvent,
  PlatformSurfaceAdapter,
  PopupSurfaceProps,
} from '../platform-surface/types';

/** A host with popups and the window's keys: `press` offers a key as the host does. */
function host() {
  let listener: ((event: PlatformKeyEvent) => boolean) | null = null;
  let popup: PopupSurfaceProps | null = null;
  const adapter: PlatformSurfaceAdapter = {
    platform: 'test',
    capabilities: new Set(['popup-surface']),
    PopupSurface: (props) => {
      popup = props;
      return <>{props.children}</>;
    },
    keyboard: {
      subscribe(next) {
        listener = next;
        return () => {
          listener = null;
        };
      },
    },
  };
  /** The window's handlers first; a key none took goes to the popup, while one is open. */
  const press = (key: string) =>
    act(() => {
      const event = { key, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };
      if (listener?.(event)) return;
      popup?.onKey?.(key);
    });
  return { adapter, press, closed: () => (popup = null) };
}

function List({
  onKey,
  onChoose,
}: {
  onKey: (key: string) => void;
  onChoose: (row: string) => void;
}) {
  // A file list's own keys, as Dropsea's: it takes the arrows.
  useWindowKeys((event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return false;
    onKey(event.key);
    return true;
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable testID="trigger">
          <Text>notes.md</Text>
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onPress={() => onChoose('Open')}>Open</DropdownMenuItem>
        <DropdownMenuItem onPress={() => onChoose('Rename')}>Rename</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

it("gives an open popup menu the keys the window's own handlers would take", () => {
  const { adapter, press, closed } = host();
  const onKey = jest.fn();
  const onChoose = jest.fn();
  const screen = render(
    <BloomProvider mode="light" platform={adapter}>
      <List onKey={onKey} onChoose={onChoose} />
    </BloomProvider>,
  );
  // No menu open: the list has its arrows.
  press('ArrowDown');
  expect(onKey).toHaveBeenCalledTimes(1);
  expect(hasOpenFloatingSurface()).toBe(false);

  // The menu open: its rows have them, and the list hears nothing.
  fireEvent.press(screen.getByTestId('trigger'));
  expect(hasOpenFloatingSurface()).toBe(true);
  press('ArrowDown');
  press('ArrowDown');
  press('Enter');
  expect(onKey).toHaveBeenCalledTimes(1);
  expect(onChoose).toHaveBeenCalledWith('Rename');

  // Closed: the list has its arrows again.
  closed();
  expect(hasOpenFloatingSurface()).toBe(false);
  press('ArrowUp');
  expect(onKey).toHaveBeenCalledTimes(2);
  expect(onKey).toHaveBeenLastCalledWith('ArrowUp');
});
