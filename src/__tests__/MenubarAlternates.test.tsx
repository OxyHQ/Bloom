/**
 * An item's ALTERNATE (`MenubarItemProps.alternate`), as a Mac's `isAlternate`
 * item: shown in its item's place while exactly its modifiers are held, the
 * two one row of the open menu, each known to the bar with its own entry and
 * shortcut, read from the declaration while the menu is closed.
 */
import { Fragment } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '../menubar';
import { alternatePlaces, describeMenu, places } from '../menubar/description';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type {
  PlatformKeyEvent,
  PlatformModifiers,
  PlatformSurfaceAdapter,
} from '../platform-surface/types';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  type FakeKeyboard,
  fakeKeyboard,
  fakeMenuBar,
  menuBarAdapter,
} from './support/fake-menu-bar';

const settle = () => act(async () => undefined);

const originalOS = ReactNative.Platform.OS;
beforeEach(() => {
  ReactNative.Platform.OS = 'android';
});
afterEach(() => {
  ReactNative.Platform.OS = originalOS;
});

const NONE: PlatformModifiers = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

/** A native host's keys, telling the modifiers as they change (`subscribeModifiers`). */
function flagsKeyboard(): FakeKeyboard & { flags(held: Partial<PlatformModifiers>): void } {
  const keys = fakeKeyboard();
  const listeners = new Set<(held: PlatformModifiers) => void>();
  return {
    ...keys,
    subscribeModifiers(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    flags(held) {
      for (const listener of [...listeners]) listener({ ...NONE, ...held });
    },
  };
}

function rows(chosen: (row: string) => void) {
  return [
    <MenubarItem key="sleep" onPress={() => chosen('Sleep')}>
      Sleep
    </MenubarItem>,
    <MenubarItem key="restart" onPress={() => chosen('Restart, asked')}>
      Restart…
    </MenubarItem>,
    <MenubarItem key="restart-now" alternate="Alt" onPress={() => chosen('Restart, at once')}>
      Restart
    </MenubarItem>,
    <Fragment key="s">
      <MenubarSeparator />
    </Fragment>,
    <MenubarItem key="log-out" shortcut="Mod+Shift+Q" onPress={() => chosen('Log Out, asked')}>
      Log Out…
    </MenubarItem>,
    <MenubarItem
      key="log-out-now"
      alternate="Alt"
      shortcut="Mod+Alt+Shift+Q"
      onPress={() => chosen('Log Out, at once')}
    >
      Log Out
    </MenubarItem>,
    <Fragment key="s2">
      <MenubarSeparator />
    </Fragment>,
    // After a separator: no item to replace, so an ordinary item.
    <MenubarItem key="lock" alternate="Alt" onPress={() => chosen('Lock')}>
      Lock Screen
    </MenubarItem>,
  ];
}

function setup(
  adapter: (keyboard: FakeKeyboard) => PlatformSurfaceAdapter = menuBarAdapter.bind(
    null,
    undefined,
  ),
) {
  const keyboard = flagsKeyboard();
  const chosen = jest.fn<void, [string]>();
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={adapter(keyboard)}>
        <PortalProvider>
          <Menubar>
            <MenubarMenu value="system">
              <MenubarTrigger>System</MenubarTrigger>
              <MenubarContent>{rows(chosen)}</MenubarContent>
            </MenubarMenu>
          </Menubar>
          <PortalOutlet />
        </PortalProvider>
      </PlatformSurfaceProvider>
    </BloomThemeProvider>,
  );
  const press = (event: Omit<Partial<PlatformKeyEvent>, 'key'> & { key: string }) => {
    let taken = false;
    act(() => {
      taken = keyboard.press(event);
    });
    return taken;
  };
  const flags = (held: Partial<PlatformModifiers>) => act(() => keyboard.flags(held));
  const open = async () => {
    fireEvent.press(screen.getByText('System'));
    await settle();
  };
  /** The menu's drawn rows' labels, in order. */
  const shown = () =>
    ['Sleep', 'Restart…', 'Restart', 'Log Out…', 'Log Out', 'Lock Screen'].filter(
      (label) => screen.queryByText(label) !== null,
    );
  return { screen, chosen, press, flags, open, shown };
}

describe('a closed menu’s description', () => {
  it('carries an alternate placed after an item, with its modifiers; not one after a separator', () => {
    const description = describeMenu(rows(() => undefined));
    const items = description.entries.filter((entry) => entry.kind === 'item');
    expect(items.map(({ label, alternate }) => [label, alternate])).toEqual([
      ['Sleep', undefined],
      ['Restart…', undefined],
      ['Restart', 'Alt'],
      ['Log Out…', undefined],
      ['Log Out', 'Alt'],
      ['Lock Screen', undefined],
    ]);
    expect(description.unread).toEqual([]);
  });

  it('spells the modifiers one way, and pairs an alternate only right after an item', () => {
    const description = describeMenu([
      <MenubarItem key="a">Close</MenubarItem>,
      <MenubarItem key="b" alternate="shift + alt">
        Close All
      </MenubarItem>,
      <MenubarItem key="c" alternate="Hyper">
        Not an alternate
      </MenubarItem>,
    ]);
    expect(description.entries.map(({ alternate }) => alternate)).toEqual([
      undefined,
      'Alt+Shift',
      undefined,
    ]);
    expect(alternatePlaces(places([null, <MenubarItem key="x" alternate="Alt" />]))).toEqual([
      false,
      false,
    ]);
  });

  it('runs both shortcuts while the menu is closed, and mounts none of its rows', async () => {
    const { screen, chosen, press } = setup();
    await settle();
    expect(screen.queryByText('Log Out…')).toBeNull();
    expect(press({ key: 'Q', ctrlKey: true, shiftKey: true })).toBe(true);
    expect(press({ key: 'Q', ctrlKey: true, altKey: true, shiftKey: true })).toBe(true);
    expect(chosen.mock.calls.map(([row]) => row)).toEqual(['Log Out, asked', 'Log Out, at once']);
  });
});

describe('an open menu', () => {
  it('shows the alternate in its item’s place while its modifiers are held, the item again after', async () => {
    const { flags, open, shown } = setup();
    await settle();
    await open();
    expect(shown()).toEqual(['Sleep', 'Restart…', 'Log Out…', 'Lock Screen']);
    flags({ altKey: true });
    expect(shown()).toEqual(['Sleep', 'Restart', 'Log Out', 'Lock Screen']);
    flags({});
    expect(shown()).toEqual(['Sleep', 'Restart…', 'Log Out…', 'Lock Screen']);
  });

  it('matches the modifiers exactly: Option with Shift is not Option', async () => {
    const { flags, open, shown } = setup();
    await settle();
    await open();
    flags({ altKey: true, shiftKey: true });
    expect(shown()).toEqual(['Sleep', 'Restart…', 'Log Out…', 'Lock Screen']);
  });

  it('runs what is shown: the alternate while Option is held', async () => {
    const { screen, chosen, flags, open } = setup();
    await settle();
    await open();
    flags({ altKey: true });
    fireEvent.press(screen.getByText('Restart'));
    await settle();
    expect(chosen.mock.calls).toEqual([['Restart, at once']]);
  });

  it('follows a key press’s flags on a platform that tells no modifier changes', async () => {
    const keyboard = fakeKeyboard();
    const chosen = jest.fn<void, [string]>();
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PlatformSurfaceProvider value={menuBarAdapter(undefined, keyboard)}>
          <PortalProvider>
            <Menubar>
              <MenubarMenu value="system">
                <MenubarTrigger>System</MenubarTrigger>
                <MenubarContent>{rows(chosen)}</MenubarContent>
              </MenubarMenu>
            </Menubar>
            <PortalOutlet />
          </PortalProvider>
        </PlatformSurfaceProvider>
      </BloomThemeProvider>,
    );
    await settle();
    fireEvent.press(screen.getByText('System'));
    await settle();
    act(() => {
      keyboard.press({ key: 'Alt', altKey: true });
    });
    expect(screen.getByText('Restart')).toBeTruthy();
    expect(screen.queryByText('Restart…')).toBeNull();
  });

  it('runs both shortcuts whichever is shown', async () => {
    const { chosen, flags, open, press } = setup();
    await settle();
    await open();
    flags({ altKey: true });
    expect(press({ key: 'Q', ctrlKey: true, shiftKey: true })).toBe(true);
    expect(chosen.mock.calls.map(([row]) => row)).toEqual(['Log Out, asked']);
    await open();
    expect(press({ key: 'Q', ctrlKey: true, altKey: true, shiftKey: true })).toBe(true);
    expect(chosen.mock.calls.map(([row]) => row)).toEqual(['Log Out, asked', 'Log Out, at once']);
  });
});

describe("the platform's bar", () => {
  it('shows the item, not its alternate, whose shortcut still runs', async () => {
    const bar = fakeMenuBar();
    const { chosen, press } = setup((keyboard) => menuBarAdapter(bar, keyboard));
    await settle();
    const [menu] = bar.menus;
    const labels = menu?.items.map((item) => (item.kind === 'separator' ? '-' : item.label));
    expect(labels).toEqual(['Sleep', 'Restart…', '-', 'Log Out…', '-', 'Lock Screen']);
    expect(press({ key: 'Q', ctrlKey: true, altKey: true, shiftKey: true })).toBe(true);
    expect(chosen.mock.calls).toEqual([['Log Out, at once']]);
  });
});
