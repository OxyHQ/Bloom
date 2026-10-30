/**
 * The native `ContextMenu` on a platform with popups (OxyOS ADR 0027): the
 * secondary button opens it where it pressed, in the platform's popup anchored
 * to the trigger at that point; the innermost trigger takes the press; a child
 * that states its role keeps it. Without popups, a phone's sheet as before.
 */
import { Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../context-menu/ContextMenu';
import { BloomProvider } from '../provider';
import type { PlatformSurfaceAdapter, PopupSurfaceProps } from '../platform-surface/types';

function adapter(popup: (props: PopupSurfaceProps) => void): PlatformSurfaceAdapter {
  return {
    platform: 'test',
    capabilities: new Set(['popup-surface']),
    PopupSurface: (props) => {
      popup(props);
      return <View testID="platform-popup">{props.children}</View>;
    },
  };
}

/** A press of a pointer's button, as a host sends it (W3C `pointerdown`). */
const pointer = (button: number, clientX: number, clientY: number) => {
  const event = {
    nativeEvent: { button, clientX, clientY },
    stopPropagation: jest.fn(),
  };
  return event;
};

function Item({ onRename }: { onRename: () => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild label="notes.md">
        <View testID="item" accessibilityRole="list" accessible>
          <Text>notes.md</Text>
        </View>
      </ContextMenuTrigger>
      <ContextMenuContent testID="menu">
        <ContextMenuItem onPress={onRename}>Rename</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** The trigger's wrapper: where a press bubbles to. */
function wrapperOf(screen: ReturnType<typeof render>) {
  const item = screen.getByTestId('item');
  return item.parent?.parent ?? item;
}

it('opens at the secondary press, in the platform popup anchored to the trigger at that point', () => {
  const popup = jest.fn();
  const onRename = jest.fn();
  // The trigger's wrapper is measured in the window as the menu opens: here at (100, 40).
  const screen = render(
    <BloomProvider mode="light" platform={adapter(popup)}>
      <Item onRename={onRename} />
    </BloomProvider>,
    {
      createNodeMock: () => ({
        measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
          callback(100, 40, 200, 30),
      }),
    },
  );
  const wrapper = wrapperOf(screen);

  // The primary button opens nothing.
  fireEvent(wrapper, 'pointerDown', pointer(0, 130, 55));
  expect(screen.queryByTestId('platform-popup')).toBeNull();

  const press = pointer(2, 130, 55);
  act(() => {
    fireEvent(wrapper, 'pointerDown', press);
  });
  expect(press.stopPropagation).toHaveBeenCalled();
  expect(screen.getByTestId('platform-popup')).toBeTruthy();
  const props = popup.mock.calls[popup.mock.calls.length - 1]?.[0] as PopupSurfaceProps;
  expect(props.point).toEqual({ x: 30, y: 15 });
  expect(props.role).toBe('menu');
  expect(props).toMatchObject({ side: 'bottom', align: 'start', sideOffset: 0, alignOffset: 0 });
  fireEvent.press(screen.getByText('Rename'));
  expect(onRename).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('platform-popup')).toBeNull();
});

it('keeps the role a trigger child states, without a menu button state', () => {
  const screen = render(
    <BloomProvider mode="light" platform={adapter(() => {})}>
      <Item onRename={() => {}} />
    </BloomProvider>,
  );
  const item = screen.getByTestId('item');
  expect(item.props.accessibilityRole).toBe('list');
  expect(item.props['aria-expanded']).toBeUndefined();
  expect(item.props['aria-haspopup']).toBeUndefined();
});

it('keeps a phone its sheet: without popups the secondary button opens nothing anchored', () => {
  const screen = render(
    <BloomProvider mode="light">
      <Item onRename={() => {}} />
    </BloomProvider>,
  );
  act(() => {
    fireEvent(wrapperOf(screen), 'pointerDown', pointer(2, 10, 10));
  });
  expect(screen.queryByTestId('platform-popup')).toBeNull();
});
