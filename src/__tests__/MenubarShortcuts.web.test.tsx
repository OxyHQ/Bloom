/**
 * @jest-environment jsdom
 */

/**
 * WEB: a menu item's shortcut runs it from the page's keys (OxyOS ADR 0021,
 * decision 3), against the DOM react-native-web really produces: with its
 * menu closed or open, with or without the `menu-bar` capability, and in a
 * text field for every chord but the ones the field edits with.
 *
 * Keys are dispatched on the element that has focus, as a browser does; a
 * text field is react-native-web's `TextInput`, which stops every keydown's
 * propagation, so a shortcut heard only in the bubble phase fails here.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { TextInput } from 'react-native';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '../menubar/index.web';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeMenuBar, menuBarAdapter } from './support/fake-menu-bar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const platform = Object.getOwnPropertyDescriptor(Navigator.prototype, 'platform');

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  if (platform) Object.defineProperty(Navigator.prototype, 'platform', platform);
});

function onApple() {
  Object.defineProperty(Navigator.prototype, 'platform', {
    configurable: true,
    get: () => 'MacIntel',
  });
}

function mount(ui: React.ReactElement, adapter: PlatformSurfaceAdapter | null = null) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <PlatformSurfaceProvider value={adapter}>{ui}</PlatformSurfaceProvider>
      </BloomThemeProvider>,
    );
  });
  for (let i = 0; i < 6; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

/** A key press on whatever has focus; returns the event. */
function press(init: KeyboardEventInit & { key: string }): KeyboardEvent {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

const handlers = {
  onNew: jest.fn(),
  onCopy: jest.fn(),
  onDelete: jest.fn(),
  onExport: jest.fn(),
};
beforeEach(() => {
  for (const fn of Object.values(handlers)) fn.mockClear();
});

function App({ open, onValueChange }: { open?: string; onValueChange?: (v?: string) => void }) {
  return (
    <>
      <TextInput testID="field" accessibilityLabel="Name" />
      <Menubar value={open} onValueChange={onValueChange}>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem shortcut="Mod+N" onPress={handlers.onNew}>
              New
            </MenubarItem>
            <MenubarItem shortcut="Delete" onPress={handlers.onDelete}>
              Delete
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem shortcut="Mod+Shift+E" onPress={handlers.onExport}>
                  Export
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem shortcut="Mod+C" onPress={handlers.onCopy}>
              Copy
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
}

const field = () =>
  document.querySelector<HTMLInputElement>('[data-testid="field"]') as HTMLElement;

describe('menu shortcuts on the web', () => {
  it('runs a closed menu’s item, and a closed submenu’s, and consumes the key', () => {
    mount(<App />);
    const event = press({ key: 'n', code: 'KeyN', ctrlKey: true });
    expect(handlers.onNew).toHaveBeenCalledTimes(1);
    // The browser's own Ctrl+N (a new window) does not happen.
    expect(event.defaultPrevented).toBe(true);
    press({ key: 'E', code: 'KeyE', ctrlKey: true, shiftKey: true });
    expect(handlers.onExport).toHaveBeenCalledTimes(1);
    press({ key: 'Delete' });
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('maps Mod to ⌘ on a Mac', () => {
    onApple();
    mount(<App />);
    expect(press({ key: 'n', metaKey: true }).defaultPrevented).toBe(true);
    expect(press({ key: 'n', ctrlKey: true }).defaultPrevented).toBe(false);
    expect(handlers.onNew).toHaveBeenCalledTimes(1);
  });

  it('draws the chord for the platform in an open menu', () => {
    mount(<App open="file" />);
    expect(document.body.textContent).toContain('Ctrl+N');
    expect(document.body.textContent).toContain('Del');
  });

  it('leaves a text field its editing keys and takes the rest, though the field stops them', () => {
    mount(<App />);
    act(() => field().focus());
    expect(document.activeElement).toBe(field());

    const copy = press({ key: 'c', ctrlKey: true });
    expect(handlers.onCopy).not.toHaveBeenCalled();
    expect(copy.defaultPrevented).toBe(false);
    // Typing, and Delete, are the field's too.
    press({ key: 'Delete' });
    expect(handlers.onDelete).not.toHaveBeenCalled();

    expect(press({ key: 'n', ctrlKey: true }).defaultPrevented).toBe(true);
    expect(handlers.onNew).toHaveBeenCalledTimes(1);

    act(() => field().blur());
    press({ key: 'c', ctrlKey: true });
    expect(handlers.onCopy).toHaveBeenCalledTimes(1);
  });

  it('leaves an open menu its own keys, runs a chord in it, and closes it as a press would', () => {
    const onValueChange = jest.fn();
    mount(<App open="file" onValueChange={onValueChange} />);
    // A key with no command modifier is the open menu's (its arrows, its typeahead).
    expect(press({ key: 'Delete' }).defaultPrevented).toBe(false);
    expect(handlers.onDelete).not.toHaveBeenCalled();
    press({ key: 'c', ctrlKey: true });
    expect(handlers.onCopy).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it('stands aside for a key something before it took', () => {
    const taker = (event: KeyboardEvent) => event.preventDefault();
    window.addEventListener('keydown', taker, true);
    try {
      mount(<App />);
      press({ key: 'n', ctrlKey: true });
    } finally {
      window.removeEventListener('keydown', taker, true);
    }
    expect(handlers.onNew).not.toHaveBeenCalled();
  });

  it('works with the menu-bar capability, the bar drawing nothing in the page', async () => {
    const bar = fakeMenuBar();
    mount(<App />, menuBarAdapter(bar));
    await act(async () => undefined);
    expect(container.querySelector('[role="menubar"]')).toBeNull();
    expect(bar.menus.map((menu) => menu.label)).toEqual(['File', 'Edit']);
    press({ key: 'n', ctrlKey: true });
    expect(handlers.onNew).toHaveBeenCalledTimes(1);
  });

  it('stops listening once the bar unmounts', () => {
    mount(<App />);
    act(() => root.render(null));
    expect(press({ key: 'n', ctrlKey: true }).defaultPrevented).toBe(false);
    expect(handlers.onNew).not.toHaveBeenCalled();
  });
});
