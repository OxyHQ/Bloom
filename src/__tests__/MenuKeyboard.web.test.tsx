/**
 * @jest-environment jsdom
 */

/**
 * The anchored menus on WEB, from the keyboard — the ARIA menu-button contract
 * (`floating/menu-keyboard.ts`), against the DOM react-native-web really
 * produces. `DropdownMenu` carries the full matrix; `Menubar` and `ContextMenu`
 * pin that the same keys reach them, since all three render one row set.
 *
 * What shipped: Enter/Space opened the menu and focus stayed on the trigger.
 * The rows are portaled, so the arrows had nothing to move, Tab walked on
 * through the page behind the open menu, and Space pressed nothing
 * (react-native-web presses a `menuitem` on Enter only).
 *
 * Keys are dispatched on `document.activeElement`, so a handler that forgot to
 * move focus leaves the next key on the wrong element and the next assertion
 * fails.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu/index.web';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '../menubar/index.web';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../context-menu/index.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

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
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        {ui}
      </BloomThemeProvider>,
    );
  });
  flush();
}

function flush() {
  for (let i = 0; i < 6; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

/**
 * A key press on whatever holds focus, plus the activation the BROWSER adds to
 * a real `<button>` (Enter on keydown, Space on keyup) that jsdom does not —
 * react-native-web renders a `role="button"` trigger as one and leaves those
 * keys to the browser.
 */
function press(key: string) {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const isButton = target.tagName === 'BUTTON';
  let down!: KeyboardEvent;
  act(() => {
    down = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(down);
    if (isButton && key === 'Enter' && !down.defaultPrevented) target.click();
  });
  const upTarget = (document.activeElement ?? document.body) as HTMLElement;
  act(() => {
    upTarget.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
    if (isButton && upTarget === target && key === ' ' && !down.defaultPrevented) target.click();
  });
  flush();
}

const trigger = (testID: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${testID}"] [aria-haspopup]`) as HTMLElement;
const expanded = (testID: string) => trigger(testID).getAttribute('aria-expanded') === 'true';
const focusedName = () => document.activeElement?.getAttribute('aria-label') ?? null;

const actions = { rename: jest.fn(), duplicate: jest.fn(), archive: jest.fn() };
beforeEach(() => Object.values(actions).forEach((fn) => fn.mockClear()));

function Actions() {
  const [dense, setDense] = React.useState(false);
  const [sort, setSort] = React.useState('newest');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger label="Actions" testID="menu">
        <Text>Actions</Text>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onPress={actions.rename}>Rename</DropdownMenuItem>
        <DropdownMenuItem disabled>Move</DropdownMenuItem>
        <DropdownMenuItem onPress={actions.duplicate}>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={dense} onCheckedChange={setDense} keepOpen>
          Dense
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuItem onPress={actions.archive}>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function openWith(key: string, testID = 'menu') {
  act(() => trigger(testID).focus());
  press(key);
}

const row = (name: string) =>
  document.querySelector<HTMLElement>(`[role="menu"] [aria-label="${name}"]`) as HTMLElement;

describe('DropdownMenu (web) — keyboard', () => {
  it.each(['Enter', ' ', 'ArrowDown'])('%j opens the menu with focus on the first row', (key) => {
    mount(<Actions />);
    openWith(key);
    expect(expanded('menu')).toBe(true);
    expect(focusedName()).toBe('Rename');
  });

  it('ArrowUp opens the menu with focus on the last row', () => {
    mount(<Actions />);
    openWith('ArrowUp');
    expect(expanded('menu')).toBe(true);
    expect(focusedName()).toBe('Archive');
  });

  it('a pointer open leaves focus on the trigger until an arrow moves it in', () => {
    mount(<Actions />);
    act(() => trigger('menu').focus());
    act(() => trigger('menu').click());
    flush();
    expect(expanded('menu')).toBe(true);
    expect(document.activeElement).toBe(trigger('menu'));
    press('ArrowDown');
    expect(focusedName()).toBe('Rename');
  });

  it('arrows skip disabled rows and wrap; Home/End jump', () => {
    mount(<Actions />);
    openWith('Enter');
    press('ArrowDown');
    expect(focusedName()).toBe('Duplicate');
    press('ArrowDown');
    expect(focusedName()).toBe('Dense');
    press('End');
    expect(focusedName()).toBe('Archive');
    press('ArrowDown');
    expect(focusedName()).toBe('Rename');
    press('ArrowUp');
    expect(focusedName()).toBe('Archive');
    press('Home');
    expect(focusedName()).toBe('Rename');
  });

  it.each(['Enter', ' '])('%j activates a row, closes, and returns focus to the trigger', (key) => {
    mount(<Actions />);
    openWith('Enter');
    press('ArrowDown');
    press(key);
    expect(actions.duplicate).toHaveBeenCalledTimes(1);
    expect(expanded('menu')).toBe(false);
    expect(document.activeElement).toBe(trigger('menu'));
  });

  it('Space toggles a keepOpen checkbox row and the menu stays open', () => {
    mount(<Actions />);
    openWith('Enter');
    press('ArrowDown');
    press('ArrowDown');
    expect(focusedName()).toBe('Dense');
    press(' ');
    expect(expanded('menu')).toBe(true);
    expect(row('Dense').getAttribute('aria-checked')).toBe('true');
    press(' ');
    expect(row('Dense').getAttribute('aria-checked')).toBe('false');
  });

  it('Space selects a radio row and closes', () => {
    mount(<Actions />);
    openWith('ArrowUp');
    press('ArrowUp');
    expect(focusedName()).toBe('Oldest');
    press(' ');
    expect(expanded('menu')).toBe(false);
    openWith('Enter');
    expect(row('Oldest').getAttribute('aria-checked')).toBe('true');
  });

  it.each(['Escape', 'Tab'])('%s closes without activating and returns focus to the trigger', (key) => {
    mount(<Actions />);
    openWith('Enter');
    press('ArrowDown');
    press(key);
    expect(expanded('menu')).toBe(false);
    expect(actions.duplicate).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger('menu'));
  });
});

describe('Menubar and ContextMenu (web) — the same keys', () => {
  it('Menubar: Enter opens into the first row, arrows move, Escape returns focus', () => {
    mount(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger testID="file">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
            <MenubarItem>Open</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    openWith('Enter', 'file');
    expect(focusedName()).toBe('New');
    press('ArrowDown');
    expect(focusedName()).toBe('Open');
    press('Escape');
    expect(expanded('file')).toBe(false);
    expect(document.activeElement).toBe(trigger('file'));
  });

  it('ContextMenu: a right-click opens into the first row, and the arrows move', () => {
    const onOpen = jest.fn();
    mount(
      <ContextMenu>
        <ContextMenuTrigger testID="area" label="Canvas">
          <Text>Right-click here</Text>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onPress={onOpen}>Open</ContextMenuItem>
          <ContextMenuItem>Share</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    act(() => {
      trigger('area').dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }),
      );
    });
    flush();
    expect(focusedName()).toBe('Open');
    press('ArrowDown');
    expect(focusedName()).toBe('Share');
    press('ArrowDown');
    expect(focusedName()).toBe('Open');
    press(' ');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
