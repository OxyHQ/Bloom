/**
 * Menus on a desktop with platform popups (an OxyOS window or its shell): `Menubar` opens each
 * menu as the web's desktop menu in the platform's popup, submenus fly out beside their rows in
 * popups of their own, and the bar is driven from the keyboard by its `focusValue`.
 */
import { useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
// Explicit native owners, not the web barrels.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '../menubar/Menubar';
import { menubarKey } from '../menubar/use-menubar-keys';
import { BloomProvider } from '../provider';
import type {
  PlatformKeyEvent,
  PlatformSurfaceAdapter,
  PopupSurfaceProps,
  SurfaceCapability,
} from '../platform-surface/types';

interface Desktop {
  adapter: PlatformSurfaceAdapter;
  /** Each popup's latest props, by testID (a panel's own, `flyout` for a submenu's). */
  popups: Map<string, PopupSurfaceProps>;
  /** The bar's keys, as the platform offers them; true when Bloom took the key. */
  press: (key: string, modifiers?: Partial<PlatformKeyEvent>) => boolean;
}

function desktop(capabilities: SurfaceCapability[] = ['popup-surface', 'pointer']): Desktop {
  const popups = new Map<string, PopupSurfaceProps>();
  const listeners = new Set<(event: PlatformKeyEvent) => boolean>();
  return {
    popups,
    press: (key, modifiers) => {
      let taken = false;
      act(() => {
        for (const listener of listeners) {
          taken =
            listener({
              key,
              altKey: false,
              ctrlKey: false,
              metaKey: false,
              shiftKey: false,
              ...modifiers,
            }) || taken;
        }
      });
      return taken;
    },
    adapter: {
      platform: 'test',
      capabilities: new Set(capabilities),
      keyboard: {
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      },
      PopupSurface: (props) => {
        const id =
          props.role === 'menu' && props.label === 'Submenu' ? 'flyout' : (props.testID ?? 'popup');
        popups.set(id, props);
        return <View testID={`platform-${id}`}>{props.children}</View>;
      },
    },
  };
}

function Actions({ chosen }: { chosen: (row: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable testID="trigger">
          <Text>Open</Text>
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent testID="menu">
        <DropdownMenuItem onPress={() => chosen('Reply')}>Reply</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger testID="more">More actions</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onPress={() => chosen('Copy link')}>Copy link</DropdownMenuItem>
            <DropdownMenuItem onPress={() => chosen('Print')}>Print</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem testID="delete" onPress={() => chosen('Delete')}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('a submenu on a desktop flies out beside its row, in a popup of its own', () => {
  function open(capabilities?: SurfaceCapability[]) {
    const chosen = jest.fn();
    const platform = desktop(capabilities);
    const screen = render(
      <BloomProvider mode="light" platform={platform.adapter}>
        <Actions chosen={chosen} />
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    const key = (name: string) => act(() => platform.popups.get('menu')?.onKey?.(name));
    return { screen, platform, chosen, key };
  }

  it('opens as a flyout panel anchored to its row, one seam off the parent panel', () => {
    const { screen, platform, key } = open();
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowRight');
    expect(screen.getByTestId('platform-flyout')).toBeTruthy();
    // Not inside the parent's panel: a popup of its own.
    expect(screen.getByTestId('platform-menu')).toBeTruthy();
    expect(platform.popups.get('flyout')).toMatchObject({
      side: 'right',
      align: 'start',
      // The 2px seam, measured from the parent panel's edge: its 6px padding and 1px border
      // are between the row and that edge.
      sideOffset: 9,
      alignOffset: 0,
      role: 'menu',
    });
  });

  it('takes the keys its popup is sent as the parent panel takes them', () => {
    const { screen, platform, chosen, key } = open();
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowRight');
    // The flyout's popup has the keyboard now: its keys go to the same navigation.
    act(() => platform.popups.get('flyout')?.onKey?.('ArrowDown'));
    act(() => platform.popups.get('flyout')?.onKey?.('Enter'));
    expect(chosen).toHaveBeenCalledWith('Print');
    expect(screen.queryByTestId('platform-menu')).toBeNull();
  });

  it('closes on ArrowLeft and Escape back to its row, the menu staying open', () => {
    const { screen, platform, chosen, key } = open();
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowRight');
    act(() => platform.popups.get('flyout')?.onKey?.('ArrowLeft'));
    expect(screen.queryByTestId('platform-flyout')).toBeNull();
    key('ArrowRight');
    act(() => platform.popups.get('flyout')?.onKey?.('Escape'));
    expect(screen.queryByTestId('platform-flyout')).toBeNull();
    expect(screen.getByTestId('platform-menu')).toBeTruthy();
    key('ArrowDown');
    key('Enter');
    expect(chosen).toHaveBeenCalledWith('Delete');
  });

  it('opens when the pointer moves onto its row, and closes after the grace once it moves on', () => {
    jest.useFakeTimers();
    try {
      const { screen } = open();
      fireEvent(screen.getByTestId('more'), 'hoverIn');
      expect(screen.getByTestId('platform-flyout')).toBeTruthy();
      fireEvent(screen.getByText('Copy link'), 'hoverIn');
      // Into the flyout: it stays open, past the grace.
      act(() => jest.advanceTimersByTime(400));
      expect(screen.getByTestId('platform-flyout')).toBeTruthy();
      fireEvent(screen.getByTestId('delete'), 'hoverIn');
      act(() => jest.advanceTimersByTime(299));
      expect(screen.getByTestId('platform-flyout')).toBeTruthy();
      act(() => jest.advanceTimersByTime(1));
      expect(screen.queryByTestId('platform-flyout')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('stays an inline disclosure where touch drives the popups', () => {
    const { screen, key } = open(['popup-surface']);
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowRight');
    expect(screen.queryByTestId('platform-flyout')).toBeNull();
    expect(screen.getByText('Copy link')).toBeTruthy();
  });

  it('flies out in a window too (the `window` capability is a desktop)', () => {
    const platform = desktop();
    const windowed = desktop();
    expect(platform.adapter.capabilities.has('pointer')).toBe(true);
    windowed.adapter = {
      ...windowed.adapter,
      capabilities: new Set(['popup-surface', 'window']),
      window: {
        controls: 'bloom',
        metrics: {
          controls: { start: 0, top: 0, width: 0, height: 0 },
          room: { top: 0, leading: 0 },
          radius: 0,
        },
        getState: () => ({ active: true, maximized: false, fullscreen: false }),
        subscribe: () => () => {},
        close: () => {},
        minimize: () => {},
        zoom: () => {},
        startMove: () => {},
      },
    };
    const screen = render(
      <BloomProvider mode="light" platform={windowed.adapter}>
        <Actions chosen={() => {}} />
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    act(() => windowed.popups.get('menu')?.onKey?.('ArrowDown'));
    act(() => windowed.popups.get('menu')?.onKey?.('ArrowDown'));
    act(() => windowed.popups.get('menu')?.onKey?.('ArrowRight'));
    expect(screen.getByTestId('platform-flyout')).toBeTruthy();
  });
});

function Bar({
  chosen,
  initialFocus,
  onFocus,
}: {
  chosen: (row: string) => void;
  initialFocus?: string;
  onFocus?: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState<string | undefined>(undefined);
  const [focus, setFocus] = useState<string | undefined>(initialFocus);
  return (
    <>
      <Text testID="state">{`open: ${open ?? 'none'}, keyboard: ${focus ?? 'elsewhere'}`}</Text>
      <Pressable testID="focus-bar" onPress={() => setFocus('app')} />
      <Menubar
        value={open}
        onValueChange={setOpen}
        focusValue={focus}
        onFocusValueChange={(value) => {
          setFocus(value);
          onFocus?.(value);
        }}
      >
        <MenubarMenu value="app">
          <MenubarTrigger testID="app">Allo</MenubarTrigger>
          <MenubarContent testID="app-menu">
            <MenubarItem onPress={() => chosen('Hide')}>Hide Allo</MenubarItem>
            <MenubarItem onPress={() => chosen('Quit')}>Quit Allo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="file">
          <MenubarTrigger testID="file">File</MenubarTrigger>
          <MenubarContent testID="file-menu">
            <MenubarItem testID="new" onPress={() => chosen('New')}>
              New
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger testID="recent">Open Recent</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onPress={() => chosen('notes.txt')}>notes.txt</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger testID="edit" disabled>
            Edit
          </MenubarTrigger>
          <MenubarContent testID="edit-menu">
            <MenubarItem onPress={() => chosen('Undo')}>Undo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="help">
          <MenubarTrigger testID="help">Help</MenubarTrigger>
          <MenubarContent testID="help-menu">
            <MenubarItem onPress={() => chosen('Docs')}>Documentation</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
}

describe('Menubar on a desktop with platform popups', () => {
  function bar(initialFocus?: string) {
    const chosen = jest.fn();
    const onFocus = jest.fn();
    const platform = desktop();
    const screen = render(
      <BloomProvider mode="light" platform={platform.adapter}>
        <Bar chosen={chosen} initialFocus={initialFocus} onFocus={onFocus} />
      </BloomProvider>,
    );
    const state = () => screen.getByTestId('state').props.children as string;
    return { screen, platform, chosen, onFocus, state };
  }

  it("opens each menu in the platform's popup with the web's menubar placement, never a sheet", () => {
    const { screen, platform } = bar();
    fireEvent.press(screen.getByText('File'));
    expect(screen.getByTestId('platform-file-menu')).toBeTruthy();
    expect(platform.popups.get('file-menu')).toMatchObject({
      side: 'bottom',
      align: 'start',
      sideOffset: 8,
      alignOffset: -4,
      role: 'menu',
    });
  });

  it('closes a menu its owner closes, though the bar is controlled with `undefined`', () => {
    const { screen, chosen, state } = bar();
    fireEvent.press(screen.getByText('File'));
    fireEvent.press(screen.getByText('New'));
    expect(chosen).toHaveBeenCalledWith('New');
    expect(state()).toBe('open: none, keyboard: elsewhere');
    expect(screen.queryByTestId('platform-file-menu')).toBeNull();
  });

  it('takes no key while the keyboard is elsewhere', () => {
    const { platform, state } = bar();
    expect(platform.press('ArrowRight')).toBe(false);
    expect(platform.press('ArrowDown')).toBe(false);
    expect(state()).toBe('open: none, keyboard: elsewhere');
  });

  it('moves across the titles with ← and →, round the ends, skipping a disabled menu', () => {
    const { platform, state } = bar('app');
    expect(platform.press('ArrowRight')).toBe(true);
    expect(state()).toBe('open: none, keyboard: file');
    platform.press('ArrowRight');
    expect(state()).toBe('open: none, keyboard: help');
    platform.press('ArrowRight');
    expect(state()).toBe('open: none, keyboard: app');
    platform.press('ArrowLeft');
    expect(state()).toBe('open: none, keyboard: help');
  });

  it('opens the focused menu on its first row with ↓, Return or Space', () => {
    for (const key of ['ArrowDown', 'Enter', ' ']) {
      const { screen, platform, chosen } = bar('file');
      expect(platform.press(key)).toBe(true);
      expect(screen.getByTestId('platform-file-menu')).toBeTruthy();
      // The first row is active: Return chooses it.
      act(() => platform.popups.get('file-menu')?.onKey?.('Enter'));
      expect(chosen).toHaveBeenCalledWith('New');
      screen.unmount();
    }
  });

  it('opens on the last row with ↑', () => {
    const { platform, chosen } = bar('app');
    platform.press('ArrowUp');
    act(() => platform.popups.get('app-menu')?.onKey?.('Enter'));
    expect(chosen).toHaveBeenCalledWith('Quit');
  });

  it('with a menu open, ← and → open the next one in its place, on its first row', () => {
    const { screen, platform, chosen, state } = bar('app');
    platform.press('ArrowDown');
    expect(platform.press('ArrowRight')).toBe(true);
    expect(state()).toBe('open: file, keyboard: file');
    expect(screen.queryByTestId('platform-app-menu')).toBeNull();
    act(() => platform.popups.get('file-menu')?.onKey?.('Enter'));
    expect(chosen).toHaveBeenCalledWith('New');
  });

  it('leaves → to the open menu on a row that opens a submenu, and ← inside it', () => {
    const { screen, platform, state } = bar('file');
    platform.press('ArrowDown');
    act(() => platform.popups.get('file-menu')?.onKey?.('ArrowDown'));
    // Open Recent is active: → is the menu's, which opens the submenu.
    expect(platform.press('ArrowRight')).toBe(false);
    act(() => platform.popups.get('file-menu')?.onKey?.('ArrowRight'));
    expect(screen.getByTestId('platform-flyout')).toBeTruthy();
    expect(state()).toBe('open: file, keyboard: file');
    // Inside it ← is the menu's too: it closes the submenu.
    expect(platform.press('ArrowLeft')).toBe(false);
    act(() => platform.popups.get('flyout')?.onKey?.('ArrowLeft'));
    expect(screen.queryByTestId('platform-flyout')).toBeNull();
    // Back on Open Recent's row, ← is the bar's again.
    expect(platform.press('ArrowLeft')).toBe(true);
    expect(state()).toBe('open: app, keyboard: app');
  });

  it('moves to a title by its first letters', () => {
    const { platform, state } = bar('app');
    platform.press('h');
    expect(state()).toBe('open: none, keyboard: help');
    // A disabled menu is never a match.
    platform.press('e');
    expect(state()).toBe('open: none, keyboard: help');
  });

  it('leaves the bar on Escape, and when a row is chosen; Escape in a menu closes it back to its title', () => {
    const { platform, chosen, onFocus, state } = bar('file');
    platform.press('ArrowDown');
    act(() => platform.popups.get('file-menu')?.onKey?.('Escape'));
    expect(state()).toBe('open: none, keyboard: file');
    expect(platform.press('Escape')).toBe(true);
    expect(state()).toBe('open: none, keyboard: elsewhere');
    expect(onFocus).toHaveBeenLastCalledWith(undefined);
    expect(chosen).not.toHaveBeenCalled();
  });

  it('gives up the keyboard when a row is chosen', () => {
    const { platform, chosen, state } = bar('help');
    platform.press('Enter');
    act(() => platform.popups.get('help-menu')?.onKey?.('Enter'));
    expect(chosen).toHaveBeenCalledWith('Docs');
    expect(state()).toBe('open: none, keyboard: elsewhere');
  });

  // A Mac's bar with a menu open: the pointer crossing the titles opens each one's menu in the open
  // one's place, without a press.
  const move = (screen: ReturnType<typeof render>, testID: string, pointerType = 'mouse') =>
    fireEvent(screen.getByTestId(testID), 'pointerMove', { nativeEvent: { pointerType } });

  it('with a menu open, the pointer crossing onto another title opens its menu in place, no press', () => {
    const { screen, platform, chosen, state } = bar();
    fireEvent.press(screen.getByText('File'));
    move(screen, 'help');
    expect(state()).toBe('open: help, keyboard: elsewhere');
    expect(screen.queryByTestId('platform-file-menu')).toBeNull();
    expect(screen.getByTestId('platform-help-menu')).toBeTruthy();
    // Opened by the pointer: no row is active, so Return chooses nothing.
    act(() => platform.popups.get('help-menu')?.onKey?.('Enter'));
    expect(chosen).not.toHaveBeenCalled();
    move(screen, 'app');
    expect(state()).toBe('open: app, keyboard: elsewhere');
  });

  it('listens to the pointer only while another menu is open: never at rest, on the open title or a disabled one', () => {
    const { screen } = bar();
    for (const title of ['app', 'file', 'edit', 'help']) {
      expect(screen.getByTestId(title).props.onPointerMove).toBeUndefined();
    }
    fireEvent.press(screen.getByText('File'));
    expect(screen.getByTestId('file').props.onPointerMove).toBeUndefined();
    expect(screen.getByTestId('edit').props.onPointerMove).toBeUndefined();
    expect(screen.getByTestId('app').props.onPointerMove).toBeInstanceOf(Function);
    expect(screen.getByTestId('help').props.onPointerMove).toBeInstanceOf(Function);
  });

  it('takes a finger dragging across the titles for no intent', () => {
    const { screen, state } = bar();
    fireEvent.press(screen.getByText('File'));
    move(screen, 'help', 'touch');
    expect(state()).toBe('open: file, keyboard: elsewhere');
  });

  it("moves the keyboard's title with the pointer's, while the bar has the keyboard", () => {
    const { screen, platform, state } = bar('app');
    platform.press('ArrowDown');
    move(screen, 'file');
    expect(state()).toBe('open: file, keyboard: file');
    // The keys go on from there.
    platform.press('ArrowRight');
    expect(state()).toBe('open: help, keyboard: help');
  });

  it('names the bar as the view the pointer goes on driving, for the menu and not its submenu', () => {
    const { screen, platform } = bar();
    fireEvent.press(screen.getByText('File'));
    const tracking = platform.popups.get('file-menu')?.trackingRef;
    expect(tracking).toBeTruthy();
    // The bar's own view, the one carrying its role (the test renderer hands host views their ref
    // as a prop).
    expect(screen.getByLabelText('Menu bar').props.ref).toBe(tracking);
    act(() => platform.popups.get('file-menu')?.onKey?.('ArrowDown'));
    act(() => platform.popups.get('file-menu')?.onKey?.('ArrowDown'));
    act(() => platform.popups.get('file-menu')?.onKey?.('ArrowRight'));
    expect(platform.popups.get('flyout')?.trackingRef).toBeUndefined();
  });

  it('with a menu opened by a press, ← and → open the next one in its place, the keyboard left where it was', () => {
    const { screen, platform, chosen, state } = bar();
    fireEvent.press(screen.getByText('File'));
    expect(platform.press('ArrowRight')).toBe(true);
    expect(state()).toBe('open: help, keyboard: elsewhere');
    expect(screen.queryByTestId('platform-file-menu')).toBeNull();
    expect(platform.press('ArrowLeft')).toBe(true);
    expect(state()).toBe('open: file, keyboard: elsewhere');
    // Its other keys are the menu's own, never the bar's.
    expect(platform.press('ArrowDown')).toBe(false);
    expect(platform.press('h')).toBe(false);
    expect(platform.press('Escape')).toBe(false);
    // Opened from the keys, on its first row: Return chooses it.
    act(() => platform.popups.get('file-menu')?.onKey?.('Enter'));
    expect(chosen).toHaveBeenCalledWith('New');
  });

  it('leaves → to a menu opened by a press on a row that opens a submenu', () => {
    const { screen, platform, state } = bar();
    fireEvent.press(screen.getByText('File'));
    act(() => platform.popups.get('file-menu')?.onKey?.('ArrowDown'));
    act(() => platform.popups.get('file-menu')?.onKey?.('ArrowDown'));
    expect(platform.press('ArrowRight')).toBe(false);
    expect(state()).toBe('open: file, keyboard: elsewhere');
  });

  it('never takes a key with Ctrl, Alt or Meta', () => {
    const { platform, state } = bar('app');
    expect(platform.press('ArrowRight', { ctrlKey: true })).toBe(false);
    expect(platform.press('ArrowDown', { altKey: true })).toBe(false);
    expect(platform.press('h', { metaKey: true })).toBe(false);
    expect(state()).toBe('open: none, keyboard: app');
  });
});

describe('the screen reader in a menu driven from the keyboard', () => {
  it('follows the row the keys make active, never the pointer', () => {
    jest.useFakeTimers();
    const send = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    const settle = () => act(() => jest.advanceTimersByTime(50));
    try {
      const platform = desktop();
      const screen = render(
        <BloomProvider mode="light" platform={platform.adapter}>
          <Bar chosen={() => {}} initialFocus="file" />
        </BloomProvider>,
        {
          createNodeMock: (element) => ({ testID: (element.props as { testID?: string }).testID }),
        },
      );
      const rows = () =>
        send.mock.calls
          .filter(([, type]) => type === 'focus')
          .map(([node]) => (node as { testID?: string }).testID)
          .filter((id) => id === 'new' || id === 'recent');
      platform.press('ArrowDown');
      settle();
      expect(rows()).toEqual(['new']);
      act(() => platform.popups.get('file-menu')?.onKey?.('ArrowDown'));
      settle();
      expect(rows()).toEqual(['new', 'recent']);
      fireEvent(screen.getByTestId('new'), 'hoverIn');
      settle();
      expect(rows()).toEqual(['new', 'recent']);
      // The title, then the rows: opened on a row, the panel itself never took the focus first.
      expect(send.mock.calls.map(([node]) => (node as { testID?: string }).testID)).toEqual([
        'file',
        'new',
        'recent',
      ]);
    } finally {
      send.mockRestore();
      jest.useRealTimers();
    }
  });
});

describe('the screen reader as one menu of the bar replaces another', () => {
  it('stays with the menu that opened: the closed title never takes it back; closing outright gives it back', () => {
    jest.useFakeTimers();
    const send = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    const settle = () => act(() => jest.advanceTimersByTime(50));
    try {
      const platform = desktop();
      const screen = render(
        <BloomProvider mode="light" platform={platform.adapter}>
          <Bar chosen={() => {}} />
        </BloomProvider>,
        {
          createNodeMock: (element) => ({ testID: (element.props as { testID?: string }).testID }),
        },
      );
      const titles = () =>
        send.mock.calls
          .filter(([, type]) => type === 'focus')
          .map(([node]) => (node as { testID?: string }).testID)
          .filter((id) => id === 'app' || id === 'file' || id === 'help');
      fireEvent.press(screen.getByText('Help'));
      settle();
      // Help's menu replaced by File's (the pointer), then by Help's again (→): no title is focused.
      fireEvent(screen.getByTestId('file'), 'pointerMove', {
        nativeEvent: { pointerType: 'mouse' },
      });
      settle();
      platform.press('ArrowRight');
      settle();
      expect(titles()).toEqual([]);
      // Closed outright (Escape), the focus goes back to its title.
      act(() => platform.popups.get('help-menu')?.onKey?.('Escape'));
      settle();
      expect(titles()).toEqual(['help']);
    } finally {
      send.mockRestore();
      jest.useRealTimers();
    }
  });
});

describe('menubarKey', () => {
  it('is a no-op without the keyboard on the bar', () => {
    const setFocusValue = jest.fn();
    const taken = menubarKey(
      { key: 'ArrowRight', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false },
      {
        order: ['a'],
        menus: new Map(),
        focusValue: undefined,
        openValue: undefined,
        setFocusValue,
        setOpenValue: jest.fn(),
      },
      { text: '', at: 0 },
    );
    expect(taken).toBe(false);
    expect(setFocusValue).not.toHaveBeenCalled();
  });
});
