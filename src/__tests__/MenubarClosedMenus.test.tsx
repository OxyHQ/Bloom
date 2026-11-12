/**
 * A closed menu's rows are never mounted: its entries are read from its
 * declaration's elements (`menubar/description.ts`) so that its shortcuts work
 * while it is closed, and its rows mount as it opens (OxyOS ADR 0021). Only an
 * application's own component, which cannot be read without rendering it, is
 * mounted headless there.
 */
import type React from 'react';
import { useState } from 'react';
import { act, fireEvent, render, type RenderResult } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '../menubar';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformKeyEvent } from '../platform-surface/types';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeEditing, fakeKeyboard, menuBarAdapter } from './support/fake-menu-bar';

const settle = () => act(async () => undefined);

const originalOS = ReactNative.Platform.OS;
beforeEach(() => {
  ReactNative.Platform.OS = 'android';
});
afterEach(() => {
  ReactNative.Platform.OS = originalOS;
});

const ROWS: readonly unknown[] = [
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
];

/** How many of Bloom's rows are mounted, drawn or not. */
const mountedRows = (screen: RenderResult) =>
  screen.UNSAFE_root.findAll((node: ReactTestInstance) => ROWS.includes(node.type)).length;

/** An application's own component rendering rows: read only by mounting it. */
function Recent({ onOpen }: { onOpen: (name: string) => void }) {
  return (
    <>
      <MenubarItem shortcut="Mod+R" onPress={() => onOpen('notes.txt')}>
        notes.txt
      </MenubarItem>
      <MenubarItem onPress={() => onOpen('todo.txt')}>todo.txt</MenubarItem>
    </>
  );
}

interface Spies {
  chosen: jest.Mock<void, [string]>;
}

function App({ chosen, withRecent = false }: Spies & { withRecent?: boolean }) {
  const [wrap, setWrap] = useState(false);
  const [zoom, setZoom] = useState('100');
  const [saved, setSaved] = useState(0);
  return (
    <Menubar>
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          {withRecent ? <Recent onOpen={(name) => chosen(`open ${name}`)} /> : null}
          <MenubarItem shortcut="Mod+N" onPress={() => chosen('New')}>
            New
          </MenubarItem>
          {/* Its handler is the latest one: the count it saves goes up. */}
          <MenubarItem
            shortcut="Mod+S"
            onPress={() => {
              chosen(`Save ${saved + 1}`);
              setSaved(saved + 1);
            }}
          >
            Save
          </MenubarItem>
          <MenubarItem shortcut="Mod+P" disabled onPress={() => chosen('Print')}>
            Print…
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Export</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem shortcut="Mod+E" onPress={() => chosen('Export PDF')}>
                PDF
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem action="pasteAndMatchStyle" onPress={() => chosen('Paste plain')}>
            Paste and Match Style
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarGroup>
            <MenubarLabel>Text</MenubarLabel>
            <MenubarCheckboxItem
              shortcut="Mod+Shift+W"
              checked={wrap}
              onCheckedChange={(next) => {
                setWrap(next);
                chosen(`wrap ${next}`);
              }}
            >
              Wrap Lines
            </MenubarCheckboxItem>
          </MenubarGroup>
          <MenubarRadioGroup
            value={zoom}
            onValueChange={(next) => {
              setZoom(next);
              chosen(`zoom ${next}`);
            }}
          >
            <MenubarRadioItem value="100" shortcut="Mod+0">
              Actual Size
            </MenubarRadioItem>
            <MenubarRadioItem value="200" shortcut="Mod+2">
              Double
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function setup(withRecent = false) {
  const keyboard = fakeKeyboard();
  const editing = fakeEditing();
  const chosen = jest.fn<void, [string]>();
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={menuBarAdapter(undefined, keyboard, editing)}>
        <PortalProvider>
          <App chosen={chosen} withRecent={withRecent} />
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
  return { screen, chosen, editing, press };
}

describe('a closed menu', () => {
  it('mounts none of its rows; they mount as it opens and go once it has closed', async () => {
    const { screen } = setup();
    await settle();
    expect(mountedRows(screen)).toBe(0);
    fireEvent.press(screen.getByText('File'));
    await settle();
    expect(screen.getByText('New')).toBeTruthy();
    expect(mountedRows(screen)).toBeGreaterThan(0);
    // Pressing its title again closes it; once it has gone, nothing of it is mounted.
    fireEvent.press(screen.getByText('File'));
    await settle();
    expect(screen.queryByText('New')).toBeNull();
    expect(mountedRows(screen)).toBe(0);
  });

  it("runs its items' shortcuts: an item, a submenu's item, a check item and a radio item", async () => {
    const { chosen, press } = setup();
    await settle();
    expect(press({ key: 'n', ctrlKey: true })).toBe(true);
    expect(press({ key: 'e', ctrlKey: true })).toBe(true);
    expect(press({ key: 'W', ctrlKey: true, shiftKey: true })).toBe(true);
    expect(press({ key: 'W', ctrlKey: true, shiftKey: true })).toBe(true);
    expect(press({ key: '2', ctrlKey: true })).toBe(true);
    expect(chosen.mock.calls.map(([row]) => row)).toEqual([
      'New',
      'Export PDF',
      'wrap true',
      'wrap false',
      'zoom 200',
    ]);
  });

  it('runs the current handler, as a press on its row would', async () => {
    const { chosen, press } = setup();
    await settle();
    press({ key: 's', ctrlKey: true });
    press({ key: 's', ctrlKey: true });
    expect(chosen.mock.calls.map(([row]) => row)).toEqual(['Save 1', 'Save 2']);
  });

  it('takes no disabled item’s chord', async () => {
    const { chosen, press } = setup();
    await settle();
    expect(press({ key: 'p', ctrlKey: true })).toBe(false);
    expect(chosen).not.toHaveBeenCalled();
  });

  it('sends an editing action to the focused field, else runs the item’s own handler', async () => {
    const { chosen, editing, press } = setup();
    await settle();
    const chord = { key: 'V', ctrlKey: true, altKey: true, shiftKey: true };
    expect(press(chord)).toBe(true);
    expect(chosen.mock.calls).toEqual([['Paste plain']]);
    act(() => editing.focus(['pasteAndMatchStyle']));
    await settle();
    expect(press(chord)).toBe(true);
    expect(editing.perform.mock.calls).toEqual([['pasteAndMatchStyle']]);
    expect(chosen).toHaveBeenCalledTimes(1);
    // The field cannot do it: the item is disabled, never the application's.
    act(() => editing.focus([]));
    await settle();
    expect(press(chord)).toBe(false);
    expect(chosen).toHaveBeenCalledTimes(1);
  });

  it('in an open menu, a closed submenu mounts none of its rows and runs their shortcuts', async () => {
    const { screen, chosen, press } = setup();
    await settle();
    fireEvent.press(screen.getByText('File'));
    await settle();
    expect(screen.getByText('Export')).toBeTruthy();
    const pdf = (node: ReactTestInstance) =>
      node.type === MenubarItem && node.props.children === 'PDF';
    expect(screen.UNSAFE_root.findAll(pdf)).toHaveLength(0);
    expect(press({ key: 'e', ctrlKey: true })).toBe(true);
    expect(chosen.mock.calls).toEqual([['Export PDF']]);
  });

  it("mounts an application's own component headless, at its place, its shortcuts working", async () => {
    const { screen, chosen, press } = setup(true);
    await settle();
    // Its rows are mounted (to be read) but nothing draws.
    expect(screen.queryByText('notes.txt')).toBeNull();
    expect(mountedRows(screen)).toBe(2);
    expect(press({ key: 'r', ctrlKey: true })).toBe(true);
    expect(chosen.mock.calls).toEqual([['open notes.txt']]);
  });
});

function Precedence({ chosen }: Spies) {
  return (
    <Menubar>
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem shortcut="Mod+R" onPress={() => chosen('Revert')}>
            Revert
          </MenubarItem>
          <Recent onOpen={(name) => chosen(`open ${name}`)} />
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

describe('the order of a closed menu', () => {
  it('is its declaration’s, whatever registers first: the first item with a chord takes it', async () => {
    const keyboard = fakeKeyboard();
    const chosen = jest.fn<void, [string]>();
    render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PlatformSurfaceProvider value={menuBarAdapter(undefined, keyboard)}>
          <PortalProvider>
            <Precedence chosen={chosen} />
            <PortalOutlet />
          </PortalProvider>
        </PlatformSurfaceProvider>
      </BloomThemeProvider>,
    );
    await settle();
    // `Recent`'s rows mount (and register) before the menu's read entries are registered.
    act(() => {
      keyboard.press({ key: 'r', ctrlKey: true });
    });
    expect(chosen.mock.calls).toEqual([['Revert']]);
  });
});
