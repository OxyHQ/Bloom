/**
 * A `MenubarItem`'s `about` and `settings` actions: the application's own
 * standard commands, which a platform with an application menu (a Mac's,
 * OxyOS's) shows there (OxyOS ADR 0021). The item stays the application's (no
 * text field takes it), Settings… brings ⌘, / Ctrl+, and the platform is told
 * which command each is.
 */
import type React from 'react';
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
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformMenuItem, PlatformSurfaceAdapter } from '../platform-surface/types';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeEditing, fakeKeyboard, fakeMenuBar, menuBarAdapter } from './support/fake-menu-bar';

function app(ui: React.ReactElement, adapter: PlatformSurfaceAdapter | null) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={adapter}>
        <PortalProvider>
          {ui}
          <PortalOutlet />
        </PortalProvider>
      </PlatformSurfaceProvider>
    </BloomThemeProvider>
  );
}

const settle = () => act(async () => undefined);

const originalOS = ReactNative.Platform.OS;
beforeEach(() => {
  ReactNative.Platform.OS = 'android';
});
afterEach(() => {
  ReactNative.Platform.OS = originalOS;
});

/** A File menu that holds the application's About and Settings…, as a web app's might. */
function File({
  onAbout,
  onSettings,
  defaultValue,
}: {
  onAbout?: () => void;
  onSettings?: () => void;
  defaultValue?: string;
}) {
  return (
    <Menubar defaultValue={defaultValue}>
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem shortcut="Mod+N" onPress={() => undefined}>
            New
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem action="about" onPress={onAbout}>
            About Notes
          </MenubarItem>
          <MenubarItem action="settings" onPress={onSettings}>
            Settings…
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

/** Each command row as the platform's bar was told it. */
function rows(items: readonly PlatformMenuItem[]) {
  return items.flatMap((item) =>
    item.kind === 'item'
      ? [
          {
            label: item.label,
            enabled: item.enabled,
            shortcut: item.shortcut ?? null,
            action: item.action ?? null,
          },
        ]
      : [],
  );
}

describe('the application’s About and Settings… actions, with the menu-bar capability', () => {
  it('tell the platform which command each is, Settings… with Mod+,', async () => {
    const bar = fakeMenuBar();
    render(
      app(
        <File onAbout={() => undefined} onSettings={() => undefined} />,
        menuBarAdapter(bar, undefined, fakeEditing()),
      ),
    );
    await settle();
    expect(rows(bar.menus[0]?.items ?? [])).toEqual([
      { label: 'New', enabled: true, shortcut: 'Mod+N', action: null },
      { label: 'About Notes', enabled: true, shortcut: null, action: 'about' },
      { label: 'Settings…', enabled: true, shortcut: 'Mod+,', action: 'settings' },
    ]);
  });

  it('are the application’s, never a focused field’s, and disabled with no handler', async () => {
    const bar = fakeMenuBar();
    const editing = fakeEditing();
    const onSettings = jest.fn();
    render(app(<File onSettings={onSettings} />, menuBarAdapter(bar, undefined, editing)));
    await settle();
    act(() => editing.focus(['paste', 'selectAll']));
    await settle();
    expect(rows(bar.menus[0]?.items ?? [])).toMatchObject([
      { label: 'New', enabled: true },
      { label: 'About Notes', enabled: false, action: 'about' },
      { label: 'Settings…', enabled: true, action: 'settings' },
    ]);
    act(() => bar.choose(bar.idOf('Settings…')));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(editing.perform).not.toHaveBeenCalled();
  });

  it('run Settings… once for Ctrl+, in the window, a field focused or not', async () => {
    const keyboard = fakeKeyboard();
    const editing = fakeEditing();
    const onSettings = jest.fn();
    render(app(<File onSettings={onSettings} />, menuBarAdapter(fakeMenuBar(), keyboard, editing)));
    await settle();
    act(() => {
      expect(keyboard.press({ key: ',', code: 'Comma', ctrlKey: true })).toBe(true);
    });
    expect(onSettings).toHaveBeenCalledTimes(1);
    // A field keeps only the keys it edits with: Ctrl+, is not one.
    act(() => editing.focus(['paste']));
    await settle();
    act(() => {
      expect(keyboard.press({ key: ',', code: 'Comma', ctrlKey: true })).toBe(true);
    });
    expect(onSettings).toHaveBeenCalledTimes(2);
    expect(editing.perform).not.toHaveBeenCalled();
  });

  it('a declared shortcut wins over Settings…’s own', async () => {
    const bar = fakeMenuBar();
    render(
      app(
        <Menubar>
          <MenubarMenu value="app">
            <MenubarTrigger>Notes</MenubarTrigger>
            <MenubarContent>
              <MenubarItem action="settings" shortcut="Mod+;" onPress={() => undefined}>
                Preferences…
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
        menuBarAdapter(bar),
      ),
    );
    await settle();
    expect(rows(bar.menus[0]?.items ?? [])).toEqual([
      { label: 'Preferences…', enabled: true, shortcut: 'Mod+;', action: 'settings' },
    ]);
  });
});

describe('the application’s About and Settings… actions, drawn in the window', () => {
  it('stay where they are declared, Settings… with its chord, and run their handlers', async () => {
    const onAbout = jest.fn();
    const onSettings = jest.fn();
    const screen = render(
      app(<File onAbout={onAbout} onSettings={onSettings} defaultValue="file" />, null),
    );
    await settle();
    expect(screen.getByText('About Notes')).toBeTruthy();
    expect(screen.getByText('Ctrl+,')).toBeTruthy();
    fireEvent.press(screen.getByText('Settings…'));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onAbout).not.toHaveBeenCalled();
  });
});
