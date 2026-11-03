/**
 * A `MenubarItem`'s standard editing `action` goes to the focused text field
 * first, as a Mac's Edit menu sends `copy:` to the first responder (OxyOS ADR
 * 0021, decision 3): enabled exactly when the field can do it, performed
 * there; with no field focused, the item's own handler and state.
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
  delete (ReactNative.TextInput as { State?: unknown }).State;
});

/** An Edit menu as a Mac's: the application copies its own selection when no field has focus. */
function Edit({
  onCopy,
  onFind,
  defaultValue,
}: {
  onCopy?: () => void;
  onFind?: () => void;
  defaultValue?: string;
}) {
  return (
    <Menubar defaultValue={defaultValue}>
      <MenubarMenu value="edit">
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem action="undo">Undo</MenubarItem>
          <MenubarItem action="redo">Redo</MenubarItem>
          <MenubarSeparator />
          <MenubarItem action="cut">Cut</MenubarItem>
          <MenubarItem action="copy" onPress={onCopy}>
            Copy
          </MenubarItem>
          <MenubarItem action="paste">Paste</MenubarItem>
          <MenubarItem action="pasteAndMatchStyle">Paste and Match Style</MenubarItem>
          <MenubarItem action="delete">Delete</MenubarItem>
          <MenubarItem action="selectAll">Select All</MenubarItem>
          <MenubarSeparator />
          <MenubarItem shortcut="Mod+F" onPress={onFind} disabled={!onFind}>
            Find…
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

/** Each command row's label and whether it is enabled, as the platform's bar was last told. */
function enabledRows(items: readonly PlatformMenuItem[]): Record<string, boolean> {
  return Object.fromEntries(
    items.flatMap((item) => (item.kind === 'item' ? [[item.label, item.enabled]] : [])),
  );
}

describe('a standard editing action, with the menu-bar capability', () => {
  it('is the application’s with no text field focused: its handler, else disabled', async () => {
    const bar = fakeMenuBar();
    const editing = fakeEditing();
    const onCopy = jest.fn();
    render(app(<Edit onCopy={onCopy} />, menuBarAdapter(bar, undefined, editing)));
    await settle();
    expect(enabledRows(bar.menus[0]?.items ?? [])).toEqual({
      Undo: false,
      Redo: false,
      Cut: false,
      Copy: true,
      Paste: false,
      'Paste and Match Style': false,
      Delete: false,
      'Select All': false,
      'Find…': false,
    });
    act(() => bar.choose(bar.idOf('Copy')));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(editing.perform).not.toHaveBeenCalled();
  });

  it('goes to the focused field, enabled as it validates, and is described again once', async () => {
    const bar = fakeMenuBar();
    const editing = fakeEditing();
    const onCopy = jest.fn();
    render(
      app(
        <Edit onCopy={onCopy} onFind={() => undefined} />,
        menuBarAdapter(bar, undefined, editing),
      ),
    );
    await settle();
    const before = bar.setMenus.mock.calls.length;
    act(() => editing.focus(['paste', 'pasteAndMatchStyle', 'selectAll']));
    await settle();
    expect(bar.setMenus).toHaveBeenCalledTimes(before + 1);
    // The field takes Copy too: with no selection it is disabled, never the application's.
    expect(enabledRows(bar.menus[0]?.items ?? [])).toEqual({
      Undo: false,
      Redo: false,
      Cut: false,
      Copy: false,
      Paste: true,
      'Paste and Match Style': true,
      Delete: false,
      'Select All': true,
      // Find is the application's own command; no text field claims it.
      'Find…': true,
    });
    act(() => bar.choose(bar.idOf('Copy')));
    expect(editing.perform).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
    act(() => bar.choose(bar.idOf('Paste')));
    expect(editing.perform.mock.calls).toEqual([['paste']]);

    // A selection made: Cut, Copy and Delete come on, once.
    act(() =>
      editing.focus(['undo', 'cut', 'copy', 'paste', 'pasteAndMatchStyle', 'delete', 'selectAll']),
    );
    await settle();
    expect(bar.setMenus).toHaveBeenCalledTimes(before + 2);
    expect(enabledRows(bar.menus[0]?.items ?? [])).toMatchObject({
      Undo: true,
      Cut: true,
      Copy: true,
      Delete: true,
    });
    act(() => bar.choose(bar.idOf('Copy')));
    act(() => bar.choose(bar.idOf('Delete')));
    act(() => bar.choose(bar.idOf('Undo')));
    expect(editing.perform.mock.calls).toEqual([['paste'], ['copy'], ['delete'], ['undo']]);
    expect(onCopy).not.toHaveBeenCalled();

    // The field gone: the application's Copy again.
    act(() => editing.focus(null));
    await settle();
    expect(enabledRows(bar.menus[0]?.items ?? [])).toMatchObject({ Copy: true, Paste: false });
    act(() => bar.choose(bar.idOf('Copy')));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(editing.perform).toHaveBeenCalledTimes(4);
  });

  it('never reaches a field that lost focus after the bar was told', async () => {
    const bar = fakeMenuBar();
    const editing = fakeEditing();
    const onCopy = jest.fn();
    render(app(<Edit onCopy={onCopy} />, menuBarAdapter(bar, undefined, editing)));
    await settle();
    act(() => editing.focus(['copy']));
    await settle();
    const copy = bar.idOf('Copy');
    // Focus leaves the field; the item runs before React renders again.
    editing.focus(null);
    act(() => bar.choose(copy));
    expect(editing.perform).not.toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('gives each action its standard chord, and a declared one wins', async () => {
    const bar = fakeMenuBar();
    render(
      app(
        <Menubar>
          <MenubarMenu value="edit">
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem action="undo">Undo</MenubarItem>
              <MenubarItem action="redo">Redo</MenubarItem>
              <MenubarItem action="cut">Cut</MenubarItem>
              <MenubarItem action="copy">Copy</MenubarItem>
              <MenubarItem action="paste">Paste</MenubarItem>
              <MenubarItem action="pasteAndMatchStyle">Paste and Match Style</MenubarItem>
              <MenubarItem action="delete">Delete</MenubarItem>
              <MenubarItem action="selectAll">Select All</MenubarItem>
              <MenubarItem action="redo" shortcut="Mod+Y">
                Redo again
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
        menuBarAdapter(bar),
      ),
    );
    await settle();
    const chords = Object.fromEntries(
      (bar.menus[0]?.items ?? []).flatMap((item) =>
        item.kind === 'item' ? [[item.label, item.shortcut ?? null]] : [],
      ),
    );
    expect(chords).toEqual({
      Undo: 'Mod+Z',
      Redo: 'Mod+Shift+Z',
      Cut: 'Mod+X',
      Copy: 'Mod+C',
      Paste: 'Mod+V',
      'Paste and Match Style': 'Mod+Alt+Shift+V',
      Delete: null,
      'Select All': 'Mod+A',
      'Redo again': 'Mod+Y',
    });
  });
});

describe('a standard editing action’s chord', () => {
  it('stays the field’s own key where the field edits with it, and reaches it through the item otherwise', async () => {
    const keyboard = fakeKeyboard();
    const editing = fakeEditing();
    const onCopy = jest.fn();
    let focused: object | null = null;
    (ReactNative.TextInput as { State?: unknown }).State = { currentlyFocusedInput: () => focused };
    render(app(<Edit onCopy={onCopy} />, menuBarAdapter(fakeMenuBar(), keyboard, editing)));
    await settle();
    focused = {};
    act(() => editing.focus(['copy', 'paste', 'pasteAndMatchStyle']));
    await settle();
    // Ctrl+C is the field's own key: the field copies once, Bloom takes nothing.
    act(() => {
      expect(keyboard.press({ key: 'c', ctrlKey: true })).toBe(false);
    });
    expect(editing.perform).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
    // Paste and Match Style is no key of the field's: the item performs it on the field.
    act(() => {
      expect(keyboard.press({ key: 'V', ctrlKey: true, altKey: true, shiftKey: true })).toBe(true);
    });
    expect(editing.perform.mock.calls).toEqual([['pasteAndMatchStyle']]);
    // No field: Ctrl+C is the application's Copy.
    focused = null;
    act(() => editing.focus(null));
    await settle();
    act(() => {
      expect(keyboard.press({ key: 'c', ctrlKey: true })).toBe(true);
    });
    expect(onCopy).toHaveBeenCalledTimes(1);
    // A disabled action's chord is not taken.
    act(() => {
      expect(keyboard.press({ key: 'V', ctrlKey: true, altKey: true, shiftKey: true })).toBe(false);
    });
    expect(editing.perform).toHaveBeenCalledTimes(1);
  });
});

describe('a standard editing action, drawn in the window', () => {
  it('draws its row disabled as the field validates it, and a press performs it there', async () => {
    const editing = fakeEditing();
    const onCopy = jest.fn();
    const screen = render(
      app(
        <Edit onCopy={onCopy} defaultValue="edit" />,
        menuBarAdapter(undefined, undefined, editing),
      ),
    );
    await settle();
    act(() => editing.focus(['copy']));
    await settle();
    fireEvent.press(screen.getByText('Copy'));
    expect(editing.perform.mock.calls).toEqual([['copy']]);
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('without the platform’s editing, is the application’s item as before', async () => {
    const onCopy = jest.fn();
    const screen = render(app(<Edit onCopy={onCopy} defaultValue="edit" />, null));
    await settle();
    fireEvent.press(screen.getByText('Copy'));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
