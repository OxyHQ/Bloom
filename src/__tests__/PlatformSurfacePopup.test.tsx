import type React from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
// Explicit native owner, not the web barrel.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { PlatformSurfaceProvider, usePopupSurface } from '../platform-surface/context';
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

function Menu({ onSelect }: { onSelect?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable testID="trigger">
          <Text>Open</Text>
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" testID="menu">
        <DropdownMenuItem onPress={onSelect}>Rename</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('usePopupSurface', () => {
  const wrapper =
    (value: PlatformSurfaceAdapter | null) =>
    ({ children }: { children: React.ReactNode }) => (
      <PlatformSurfaceProvider value={value}>{children}</PlatformSurfaceProvider>
    );

  it('is null without an adapter or without the capability', () => {
    expect(
      renderHook(() => usePopupSurface(), { wrapper: wrapper(null) }).result.current,
    ).toBeNull();
    const none: PlatformSurfaceAdapter = { platform: 'test', capabilities: new Set() };
    expect(
      renderHook(() => usePopupSurface(), { wrapper: wrapper(none) }).result.current,
    ).toBeNull();
  });

  it("is the adapter's component when it reports popup-surface", () => {
    const popup = adapter(() => {});
    expect(renderHook(() => usePopupSurface(), { wrapper: wrapper(popup) }).result.current).toBe(
      popup.PopupSurface,
    );
  });

  it('rejects an adapter that reports the capability without the component', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const broken: PlatformSurfaceAdapter = {
      platform: 'test',
      capabilities: new Set(['popup-surface']),
    };
    expect(() => renderHook(() => usePopupSurface(), { wrapper: wrapper(broken) })).toThrow(
      /reports 'popup-surface' without a PopupSurface/,
    );
    error.mockRestore();
  });
});

describe('DropdownMenu (native) with a popup-surface adapter', () => {
  it('opens its rows in the platform popup, anchored to the trigger with its placement', () => {
    const popup = jest.fn();
    const screen = render(
      <BloomProvider mode="light" platform={adapter(popup)}>
        <Menu />
      </BloomProvider>,
    );
    expect(screen.queryByTestId('platform-popup')).toBeNull();
    fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('platform-popup')).toBeTruthy();
    expect(screen.getByText('Rename')).toBeTruthy();
    const props = popup.mock.calls[popup.mock.calls.length - 1]?.[0] as PopupSurfaceProps;
    expect(props).toMatchObject({
      side: 'top',
      align: 'end',
      sideOffset: 4,
      alignOffset: 0,
      role: 'menu',
    });
    // The anchor is the trigger slot's own view (attached by the host on
    // device; the test renderer's styled primitive leaves it unset).
    expect(props.anchorRef).toHaveProperty('current');
  });

  it('names the menu once: the popup surface carries its role and label, the panel neither', () => {
    const popup = jest.fn();
    const screen = render(
      <BloomProvider mode="light" platform={adapter(popup)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Pressable testID="trigger">
              <Text>Open</Text>
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent label="Message actions">
            <DropdownMenuItem>Reply</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    const props = popup.mock.calls[popup.mock.calls.length - 1]?.[0] as PopupSurfaceProps;
    expect(props).toMatchObject({ role: 'menu', label: 'Message actions' });
    // The test surface renders a plain view, so any element named by the label is Bloom's own.
    expect(screen.queryAllByLabelText('Message actions')).toHaveLength(0);
  });

  it('moves screen-reader focus into the popup when it opens', () => {
    jest.useFakeTimers();
    const send = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    const node = {};
    try {
      const screen = render(
        <BloomProvider mode="light" platform={adapter(() => {})}>
          <Menu />
        </BloomProvider>,
        { createNodeMock: () => node },
      );
      fireEvent.press(screen.getByTestId('trigger'));
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(send).toHaveBeenCalledWith(node, 'focus');
      expect(send).toHaveBeenCalledTimes(1);
    } finally {
      send.mockRestore();
      jest.useRealTimers();
    }
  });

  it('closes when a row is chosen and when the platform dismisses the popup', () => {
    const popup = jest.fn();
    const select = jest.fn();
    const screen = render(
      <BloomProvider mode="light" platform={adapter(popup)}>
        <Menu onSelect={select} />
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    fireEvent.press(screen.getByText('Rename'));
    expect(select).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('platform-popup')).toBeNull();

    fireEvent.press(screen.getByTestId('trigger'));
    const props = popup.mock.calls[popup.mock.calls.length - 1]?.[0] as PopupSurfaceProps;
    act(() => props.onDismiss('outside-press'));
    expect(screen.queryByTestId('platform-popup')).toBeNull();
  });

  it('keeps the sheet when the adapter does not report popup-surface', () => {
    const popup = jest.fn();
    const screen = render(
      <BloomProvider
        mode="light"
        platform={{ platform: 'test', capabilities: new Set(), PopupSurface: () => null }}
      >
        <Menu />
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('platform-popup')).toBeNull();
    expect(popup).not.toHaveBeenCalled();
  });
});

describe('DropdownMenu (native) keyboard in a platform popup', () => {
  function Rows({ chosen }: { chosen: (row: string) => void }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Pressable testID="trigger">
            <Text>Open</Text>
          </Pressable>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onPress={() => chosen('Reply')}>Reply</DropdownMenuItem>
          <DropdownMenuItem disabled onPress={() => chosen('Forward')}>
            Forward
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => chosen('Archive')}>Archive</DropdownMenuItem>
          <DropdownMenuItem onPress={() => chosen('Move to folder')}>
            Move to folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function open(chosen: jest.Mock) {
    const popup = jest.fn();
    const screen = render(
      <BloomProvider mode="light" platform={adapter(popup)}>
        <Rows chosen={chosen} />
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    const key = (name: string) =>
      act(() => {
        const props = popup.mock.calls[popup.mock.calls.length - 1]?.[0] as
          | PopupSurfaceProps
          | undefined;
        props?.onKey?.(name);
      });
    return { screen, key };
  }

  it('moves an active row over enabled rows and activates it with Enter', () => {
    const chosen = jest.fn();
    const { screen, key } = open(chosen);
    key('ArrowDown');
    key('ArrowDown');
    key('Enter');
    // Reply, then Archive: the disabled Forward is skipped.
    expect(chosen).toHaveBeenCalledTimes(1);
    expect(chosen).toHaveBeenCalledWith('Archive');
    expect(screen.queryByTestId('platform-popup')).toBeNull();
  });

  it('goes to the ends with Home and End', () => {
    const chosen = jest.fn();
    const { key } = open(chosen);
    key('End');
    key('Home');
    key('Enter');
    expect(chosen).toHaveBeenLastCalledWith('Reply');
  });

  it('finds a row by its first letters', () => {
    const chosen = jest.fn();
    const { key } = open(chosen);
    key('m');
    key('Enter');
    expect(chosen).toHaveBeenCalledWith('Move to folder');
  });

  it('closes on Escape without activating anything', () => {
    const chosen = jest.fn();
    const { screen, key } = open(chosen);
    key('ArrowDown');
    key('Escape');
    expect(chosen).not.toHaveBeenCalled();
    expect(screen.queryByTestId('platform-popup')).toBeNull();
  });

  it('does nothing on Enter before a row is active', () => {
    const chosen = jest.fn();
    const { screen, key } = open(chosen);
    key('Enter');
    expect(chosen).not.toHaveBeenCalled();
    expect(screen.getByTestId('platform-popup')).toBeTruthy();
  });
});
