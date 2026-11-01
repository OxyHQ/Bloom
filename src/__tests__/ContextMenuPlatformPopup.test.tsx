/**
 * The native `ContextMenu` on a platform with popups (OxyOS ADR 0027): the
 * secondary button opens it where it pressed, in the platform's popup anchored
 * to the trigger at that point; the innermost trigger takes the press; a child
 * that states its role keeps it. Without popups, a phone's sheet as before.
 */
import React from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
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

/**
 * A menu the caller opens for a view it renders no trigger around (OxyOS's
 * text fields: the platform owns the field and opens its Cut, Copy and Paste):
 * `anchorRef` is the view the popup hangs from, `anchor` the point in the
 * window, and the point handed to the platform is relative to that view.
 */
function FieldMenu({
  anchor,
  field,
  onClose,
  onCopy,
}: {
  anchor: { x: number; y: number } | null;
  field: React.RefObject<React.ComponentRef<typeof View> | null>;
  onClose: () => void;
  onCopy: () => void;
}) {
  return (
    <ContextMenu
      anchor={anchor}
      anchorRef={field}
      onAnchorChange={(next) => next === null && onClose()}
    >
      <ContextMenuContent testID="menu">
        <ContextMenuItem onPress={onCopy}>Copy</ContextMenuItem>
        <ContextMenuItem disabled onPress={() => {}}>
          Paste
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

it('opens without a trigger in the platform popup, hanging from `anchorRef` at the point', () => {
  const popup = jest.fn();
  const onCopy = jest.fn();
  const onClose = jest.fn();
  const field = React.createRef<React.ComponentRef<typeof View>>();
  const createNodeMock = () => ({
    measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
      callback(40, 100, 300, 32),
  });
  const page = (anchor: { x: number; y: number } | null) => (
    <BloomProvider mode="light" platform={adapter(popup)}>
      <View ref={field} testID="field" />
      <FieldMenu anchor={anchor} field={field} onClose={onClose} onCopy={onCopy} />
    </BloomProvider>
  );
  const screen = render(page(null), { createNodeMock });
  expect(screen.queryByTestId('platform-popup')).toBeNull();

  screen.rerender(page({ x: 70, y: 116 }));
  expect(screen.getByTestId('platform-popup')).toBeTruthy();
  const props = popup.mock.calls[popup.mock.calls.length - 1]?.[0] as PopupSurfaceProps;
  expect(props.anchorRef).toBe(field);
  expect(props.point).toEqual({ x: 30, y: 16 });
  expect(props.role).toBe('menu');

  fireEvent.press(screen.getByText('Copy'));
  expect(onCopy).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('gives screen-reader focus back to `anchorRef` when it closes', () => {
  jest.useFakeTimers();
  const sent = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
  try {
    const field = React.createRef<React.ComponentRef<typeof View>>();
    const fieldNode = {
      measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
        callback(0, 0, 100, 20),
    };
    const page = (anchor: { x: number; y: number } | null) => (
      <BloomProvider mode="light" platform={adapter(() => {})}>
        <View ref={field} testID="field" />
        <FieldMenu anchor={anchor} field={field} onClose={() => {}} onCopy={() => {}} />
      </BloomProvider>
    );
    const screen = render(page({ x: 10, y: 10 }), { createNodeMock: () => fieldNode });
    sent.mockClear();
    screen.rerender(page(null));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(sent).toHaveBeenCalledWith(field.current, 'focus');
  } finally {
    sent.mockRestore();
    jest.useRealTimers();
  }
});
