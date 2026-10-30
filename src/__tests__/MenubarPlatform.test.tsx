/**
 * With the `menu-bar` capability (OxyOS ADR 0021, decision 2) a `Menubar`
 * draws nothing in the window: it describes its declaration to the platform's
 * bar, exactly, and runs the item the person chooses there exactly as a press
 * on its row would. And on every platform each item's shortcut runs it
 * (decision 3), here through an adapter's key source (a native host).
 */
import type React from 'react';
import { useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import * as Parts from '../menubar';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '../menubar';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeKeyboard, fakeMenuBar, menuBarAdapter } from './support/fake-menu-bar';
import { declaration } from './support/menubar-declaration';

const ID = expect.stringMatching(/^bloom-menu-\d+$/);

function app(ui: React.ReactElement | null, adapter: PlatformSurfaceAdapter | null) {
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

function draw(ui: React.ReactElement | null, adapter: PlatformSurfaceAdapter | null) {
  const screen = render(app(ui, adapter));
  return Object.assign(screen, {
    redraw: (next: React.ReactElement, nextAdapter = adapter) =>
      screen.rerender(app(next, nextAdapter)),
  });
}

/** Lets the commit's coalesced description (a microtask) go out. */
const settle = () => act(async () => undefined);

const originalOS = ReactNative.Platform.OS;
afterEach(() => {
  ReactNative.Platform.OS = originalOS;
  delete (ReactNative.TextInput as { State?: unknown }).State;
  jest.restoreAllMocks();
});

/** The fixture's declaration, its check item and radio group held in state. */
function Stateful({ handlers = {} }: { handlers?: Parameters<typeof declaration>[1] }) {
  const [dense, setDense] = useState(false);
  const [layout, setLayout] = useState('comfortable');
  return declaration(
    Parts,
    {
      ...handlers,
      onDense: (next) => {
        handlers.onDense?.(next);
        setDense(next);
      },
      onLayout: (next) => {
        handlers.onLayout?.(next);
        setLayout(next);
      },
    },
    { dense, layout },
  );
}

describe('with the menu-bar capability', () => {
  it('draws nothing in the window', async () => {
    const empty = JSON.stringify(draw(null, null).toJSON());
    const screen = draw(<Stateful />, menuBarAdapter(fakeMenuBar()));
    await settle();
    expect(JSON.stringify(screen.toJSON())).toBe(empty);
  });

  it('describes its declaration exactly, once', async () => {
    const bar = fakeMenuBar();
    draw(<Stateful />, menuBarAdapter(bar));
    await settle();
    expect(bar.setMenus).toHaveBeenCalledTimes(1);
    expect(bar.menus).toEqual([
      {
        id: ID,
        label: 'File',
        items: [
          // The `⌘N` hint is drawn text, not a chord: it is not part of the label.
          { kind: 'item', id: ID, label: 'New tab', enabled: true },
          { kind: 'item', id: ID, label: 'Open…', enabled: true },
          { kind: 'separator' },
          {
            kind: 'submenu',
            id: ID,
            label: 'Share',
            enabled: true,
            items: [{ kind: 'item', id: ID, label: 'Email link', enabled: true }],
          },
          { kind: 'item', id: ID, label: 'Print', enabled: false },
        ],
      },
      { id: ID, label: 'Edit', items: [{ kind: 'item', id: ID, label: 'Undo', enabled: true }] },
      {
        id: ID,
        label: 'View',
        items: [
          { kind: 'item', id: ID, label: 'Dense rows', enabled: true, checked: false },
          // A group's label: shown, never chosen.
          { kind: 'item', id: ID, label: 'Layout', enabled: false },
          { kind: 'item', id: ID, label: 'Comfortable', enabled: true, checked: true },
          { kind: 'item', id: ID, label: 'Compact', enabled: true, checked: false },
        ],
      },
    ]);
    // Every id is its own.
    const ids = JSON.stringify(bar.menus).match(/bloom-menu-\d+/g) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(13);
  });

  it('describes shortcuts as chords, labels as text, disabled menus and submenus', async () => {
    const bar = fakeMenuBar();
    draw(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>
            <ReactNative.Text>File</ReactNative.Text>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem shortcut="mod+shift+n">
              <ReactNative.View />
              <ReactNative.Text>New window</ReactNative.Text>
            </MenubarItem>
            <MenubarItem accessibilityLabel="Save" shortcut="Mod+S">
              <ReactNative.View />
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger disabled>Export</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem shortcut="Alt+F4">PDF</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="window">
          <MenubarTrigger disabled>Window</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Zoom</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
      menuBarAdapter(bar),
    );
    await settle();
    expect(bar.menus).toEqual([
      {
        id: ID,
        label: 'File',
        items: [
          { kind: 'item', id: ID, label: 'New window', enabled: true, shortcut: 'Mod+Shift+N' },
          { kind: 'item', id: ID, label: 'Save', enabled: true, shortcut: 'Mod+S' },
          {
            kind: 'submenu',
            id: ID,
            label: 'Export',
            enabled: false,
            items: [{ kind: 'item', id: ID, label: 'PDF', enabled: false, shortcut: 'Alt+F4' }],
          },
        ],
      },
      {
        id: ID,
        label: 'Window',
        items: [{ kind: 'item', id: ID, label: 'Zoom', enabled: false }],
      },
    ]);
  });

  it('runs the chosen item exactly once, as a press on its row would', async () => {
    const bar = fakeMenuBar();
    const handlers = { onNew: jest.fn(), onOpen: jest.fn(), onEmail: jest.fn(), onUndo: jest.fn() };
    draw(<Stateful handlers={handlers} />, menuBarAdapter(bar));
    await settle();
    act(() => bar.choose(bar.idOf('Email link')));
    expect(handlers.onEmail).toHaveBeenCalledTimes(1);
    act(() => bar.choose(bar.idOf('Undo')));
    expect(handlers.onUndo).toHaveBeenCalledTimes(1);
    expect(handlers.onNew).not.toHaveBeenCalled();
    expect(handlers.onOpen).not.toHaveBeenCalled();
    // An id it never gave, or a menu's, runs nothing.
    act(() => bar.choose('bloom-menu-0'));
    act(() => bar.choose(bar.idOf('File')));
    expect(Object.values(handlers).flatMap((fn) => fn.mock.calls)).toHaveLength(2);
  });

  it('round-trips a check item and a radio group through their own handlers', async () => {
    const bar = fakeMenuBar();
    const onDense = jest.fn();
    const onLayout = jest.fn();
    draw(<Stateful handlers={{ onDense, onLayout }} />, menuBarAdapter(bar));
    await settle();
    const view = () => bar.menus[2]?.items;

    act(() => bar.choose(bar.idOf('Dense rows')));
    await settle();
    expect(onDense).toHaveBeenCalledTimes(1);
    expect(onDense).toHaveBeenCalledWith(true);
    // One description for the commit that changed it.
    expect(bar.setMenus).toHaveBeenCalledTimes(2);
    expect(view()?.[0]).toMatchObject({ label: 'Dense rows', checked: true });

    act(() => bar.choose(bar.idOf('Dense rows')));
    await settle();
    expect(onDense).toHaveBeenLastCalledWith(false);
    expect(view()?.[0]).toMatchObject({ checked: false });

    act(() => bar.choose(bar.idOf('Compact')));
    await settle();
    expect(onLayout).toHaveBeenCalledTimes(1);
    expect(onLayout).toHaveBeenCalledWith('compact');
    expect(view()?.slice(2)).toMatchObject([
      { label: 'Comfortable', checked: false },
      { label: 'Compact', checked: true },
    ]);
    // Choosing the selected radio item selects it again, as its row does.
    act(() => bar.choose(bar.idOf('Compact')));
    expect(onLayout).toHaveBeenCalledTimes(2);
    expect(bar.setMenus).toHaveBeenCalledTimes(4);
  });

  it('describes a disabled item disabled and never runs it', async () => {
    const bar = fakeMenuBar();
    const onPrint = jest.fn();
    const onPdf = jest.fn();
    const onZoom = jest.fn();
    draw(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled onPress={onPrint}>
              Print
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger disabled>Export</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onPress={onPdf}>PDF</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="window">
          <MenubarTrigger disabled>Window</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onPress={onZoom}>Zoom</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
      menuBarAdapter(bar),
    );
    await settle();
    expect(bar.menus[0]?.items[0]).toMatchObject({ label: 'Print', enabled: false });
    for (const label of ['Print', 'PDF', 'Zoom']) act(() => bar.choose(bar.idOf(label)));
    expect(onPrint).not.toHaveBeenCalled();
    expect(onPdf).not.toHaveBeenCalled();
    expect(onZoom).not.toHaveBeenCalled();
  });

  it('describes again once per commit, never per item, and not when nothing changed', async () => {
    const bar = fakeMenuBar();
    function Many({ count, title }: { count: number; title: string }) {
      return (
        <Menubar>
          <MenubarMenu value="go">
            <MenubarTrigger>{title}</MenubarTrigger>
            <MenubarContent>
              {Array.from({ length: count }, (_, index) => `Item ${index}`).map((label) => (
                <MenubarItem key={label}>{label}</MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    }
    const screen = draw(<Many count={20} title="Go" />, menuBarAdapter(bar));
    await settle();
    expect(bar.setMenus).toHaveBeenCalledTimes(1);
    expect(bar.menus[0]?.items).toHaveLength(20);
    const firstIds = bar.menus[0]?.items.map((item) => (item.kind === 'item' ? item.id : ''));

    screen.redraw(<Many count={20} title="Go" />, menuBarAdapter(bar));
    await settle();
    // A new adapter object but the same bar, and the same description: no call.
    expect(bar.setMenus).toHaveBeenCalledTimes(1);

    screen.redraw(<Many count={21} title="Navigate" />, menuBarAdapter(bar));
    await settle();
    expect(bar.setMenus).toHaveBeenCalledTimes(2);
    expect(bar.menus[0]?.label).toBe('Navigate');
    // Ids are stable while an item is mounted.
    expect(
      bar.menus[0]?.items.slice(0, 20).map((item) => (item.kind === 'item' ? item.id : '')),
    ).toEqual(firstIds);
  });

  it('keeps the declared order when an item mounts later between two others', async () => {
    const bar = fakeMenuBar();
    function Edit({ withCut }: { withCut: boolean }) {
      return (
        <Menubar>
          <MenubarMenu value="edit">
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
              {/* biome-ignore lint/complexity/noUselessFragments: a fragment's items take the content's own positions. */}
              <>
                {withCut && <MenubarItem>Cut</MenubarItem>}
                <MenubarItem>Copy</MenubarItem>
              </>
              <MenubarSeparator />
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    }
    const adapter = menuBarAdapter(bar);
    const screen = draw(<Edit withCut={false} />, adapter);
    await settle();
    screen.redraw(<Edit withCut />);
    await settle();
    expect(
      bar.menus[0]?.items.map((item) => (item.kind === 'separator' ? '—' : item.label)),
    ).toEqual(['Undo', 'Cut', 'Copy', '—', 'Paste']);
  });

  it('gives the platform no menus once it unmounts', async () => {
    const bar = fakeMenuBar();
    const screen = draw(<Stateful />, menuBarAdapter(bar));
    await settle();
    expect(bar.listeners).toBe(1);
    screen.unmount();
    await settle();
    expect(bar.setMenus).toHaveBeenCalledTimes(2);
    expect(bar.setMenus).toHaveBeenLastCalledWith([]);
    expect(bar.listeners).toBe(0);
  });

  it('lets the first mounted bar publish; a second warns and takes over when it goes', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const bar = fakeMenuBar();
    const adapter = menuBarAdapter(bar);
    const keyboard = fakeKeyboard();
    const withKeys = { ...adapter, keyboard };
    const onFirst = jest.fn();
    const onSecond = jest.fn();
    function Two({ first }: { first: boolean }) {
      return (
        <>
          {first ? (
            <Menubar>
              <MenubarMenu value="a">
                <MenubarTrigger>First</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem shortcut="Mod+N" onPress={onFirst}>
                    One
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          ) : null}
          <Menubar>
            <MenubarMenu value="b">
              <MenubarTrigger>Second</MenubarTrigger>
              <MenubarContent>
                <MenubarItem shortcut="Mod+N" onPress={onSecond}>
                  Two
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </>
      );
    }
    const screen = draw(<Two first />, withKeys);
    await settle();
    expect(bar.menus.map((menu) => menu.label)).toEqual(['First']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('only the first mounted Menubar publishes');
    // Only the publishing bar's shortcuts are live.
    act(() => {
      keyboard.press({ key: 'n', metaKey: true });
    });
    expect(onFirst).toHaveBeenCalledTimes(1);
    expect(onSecond).not.toHaveBeenCalled();

    screen.redraw(<Two first={false} />);
    await settle();
    expect(bar.menus.map((menu) => menu.label)).toEqual(['Second']);
    act(() => {
      keyboard.press({ key: 'n', metaKey: true });
    });
    expect(onSecond).toHaveBeenCalledTimes(1);
    expect(onFirst).toHaveBeenCalledTimes(1);
  });

  it('throws when an adapter reports it without a bar', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      draw(declaration(Parts), { platform: 'test', capabilities: new Set(['menu-bar']) }),
    ).toThrow("reports 'menu-bar' without a menuBar");
  });
});

describe('shortcuts, from an adapter key source', () => {
  function Commands({
    onNew,
    onPrint,
    onCopy,
    dense,
    onDense,
  }: {
    onNew: () => void;
    onPrint?: () => void;
    onCopy?: () => void;
    dense?: boolean;
    onDense?: (next: boolean) => void;
  }) {
    return (
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem shortcut="Mod+N" onPress={onNew}>
              New
            </MenubarItem>
            <MenubarItem shortcut="Mod+P" disabled onPress={onPrint}>
              Print
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Edit</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem shortcut="Mod+C" onPress={onCopy}>
                  Copy
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarCheckboxItem
              shortcut="Mod+Shift+D"
              checked={dense ?? false}
              onCheckedChange={onDense ?? (() => undefined)}
            >
              Dense
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );
  }

  it.each([
    ['with the capability', true],
    ['without it, the menu closed', false],
  ])('runs the item for its chord, %s', async (_name, capability) => {
    ReactNative.Platform.OS = 'android';
    const keyboard = fakeKeyboard();
    const onNew = jest.fn();
    const onCopy = jest.fn();
    const onDense = jest.fn();
    draw(
      <Commands onNew={onNew} onCopy={onCopy} onDense={onDense} />,
      menuBarAdapter(capability ? fakeMenuBar() : undefined, keyboard),
    );
    await settle();
    let taken = false;
    act(() => {
      taken = keyboard.press({ key: 'n', code: 'KeyN', ctrlKey: true });
    });
    expect(taken).toBe(true);
    expect(onNew).toHaveBeenCalledTimes(1);
    // In a closed submenu too.
    act(() => {
      keyboard.press({ key: 'c', ctrlKey: true });
    });
    expect(onCopy).toHaveBeenCalledTimes(1);
    // A check item toggles.
    act(() => {
      keyboard.press({ key: 'D', ctrlKey: true, shiftKey: true });
    });
    expect(onDense).toHaveBeenCalledWith(true);
    // Not ⌘ on Android, and not without the modifier or with another.
    for (const press of [
      { key: 'n', metaKey: true },
      { key: 'n' },
      { key: 'n', ctrlKey: true, altKey: true },
      { key: 'N', ctrlKey: true, shiftKey: true },
    ]) {
      act(() => {
        expect(keyboard.press(press)).toBe(false);
      });
    }
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('maps Mod to ⌘ on Apple platforms, and draws it so', async () => {
    ReactNative.Platform.OS = 'ios';
    const keyboard = fakeKeyboard();
    const onNew = jest.fn();
    const screen = draw(
      <Menubar defaultValue="file">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem shortcut="Mod+N" onPress={onNew}>
              New
            </MenubarItem>
            <MenubarItem shortcut="Mod+Shift+Z">Redo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
      menuBarAdapter(undefined, keyboard),
    );
    await settle();
    expect(screen.getByText('⌘N')).toBeTruthy();
    expect(screen.getByText('⇧⌘Z')).toBeTruthy();
    act(() => {
      expect(keyboard.press({ key: 'n', ctrlKey: true })).toBe(false);
    });
    act(() => {
      expect(keyboard.press({ key: 'n', metaKey: true })).toBe(true);
    });
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('draws Mod as Ctrl elsewhere, and keeps a row’s own trailing', async () => {
    ReactNative.Platform.OS = 'android';
    const screen = draw(
      <Menubar defaultValue="file">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem shortcut="Mod+Shift+Z">Redo</MenubarItem>
            <MenubarItem shortcut="Mod+K" trailing={<ReactNative.Text>custom</ReactNative.Text>}>
              Search
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
      null,
    );
    await settle();
    expect(screen.getByText('Ctrl+Shift+Z')).toBeTruthy();
    expect(screen.getByText('custom')).toBeTruthy();
    expect(screen.queryByText('Ctrl+K')).toBeNull();
  });

  it('runs an open menu’s item once, and closes the menu as a press would', async () => {
    ReactNative.Platform.OS = 'android';
    const keyboard = fakeKeyboard();
    const onNew = jest.fn();
    const onValueChange = jest.fn();
    draw(
      <Menubar defaultValue="file" onValueChange={onValueChange}>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem shortcut="Mod+N" onPress={onNew}>
              New
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
      menuBarAdapter(undefined, keyboard),
    );
    await settle();
    act(() => {
      keyboard.press({ key: 'n', ctrlKey: true });
    });
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it('does not run or take a disabled item’s chord, nor a held key twice', async () => {
    ReactNative.Platform.OS = 'android';
    const keyboard = fakeKeyboard();
    const onNew = jest.fn();
    const onPrint = jest.fn();
    draw(<Commands onNew={onNew} onPrint={onPrint} />, menuBarAdapter(fakeMenuBar(), keyboard));
    await settle();
    act(() => {
      expect(keyboard.press({ key: 'p', ctrlKey: true })).toBe(false);
    });
    expect(onPrint).not.toHaveBeenCalled();
    act(() => {
      keyboard.press({ key: 'n', ctrlKey: true });
      // Taken (so it does not reach the view), but run only once.
      expect(keyboard.press({ key: 'n', ctrlKey: true, repeat: true })).toBe(true);
    });
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('leaves a focused text field its editing chords, and takes the others', async () => {
    ReactNative.Platform.OS = 'android';
    const keyboard = fakeKeyboard();
    const onNew = jest.fn();
    const onCopy = jest.fn();
    let focused: object | null = null;
    (ReactNative.TextInput as { State?: unknown }).State = {
      currentlyFocusedInput: () => focused,
    };
    draw(<Commands onNew={onNew} onCopy={onCopy} />, menuBarAdapter(fakeMenuBar(), keyboard));
    await settle();
    focused = {};
    act(() => {
      expect(keyboard.press({ key: 'c', ctrlKey: true })).toBe(false);
    });
    expect(onCopy).not.toHaveBeenCalled();
    act(() => {
      expect(keyboard.press({ key: 'n', ctrlKey: true })).toBe(true);
    });
    expect(onNew).toHaveBeenCalledTimes(1);
    focused = null;
    act(() => {
      expect(keyboard.press({ key: 'c', ctrlKey: true })).toBe(true);
    });
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('stops listening once the bar unmounts', async () => {
    ReactNative.Platform.OS = 'android';
    const keyboard = fakeKeyboard();
    const onNew = jest.fn();
    const screen = draw(<Commands onNew={onNew} />, menuBarAdapter(undefined, keyboard));
    await settle();
    screen.unmount();
    expect(keyboard.press({ key: 'n', ctrlKey: true })).toBe(false);
    expect(onNew).not.toHaveBeenCalled();
  });
});

describe('without the capability', () => {
  it('still runs a pressed row, as before', async () => {
    const onNew = jest.fn();
    const screen = draw(declaration(Parts, { onNew }, {}, { defaultValue: 'file' }), null);
    await settle();
    fireEvent.press(screen.getByText('New tab'));
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});
