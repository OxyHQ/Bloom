/**
 * @jest-environment jsdom
 */

/**
 * WEB: an open menu's alternate follows the document's modifiers: a key going
 * down or up, and the pointer's flags as it moves, against the DOM
 * react-native-web produces; the window losing focus releases them.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '../menubar/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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

function mount() {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <Menubar value="system">
          <MenubarMenu value="system">
            <MenubarTrigger>System</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onPress={() => undefined}>Restart…</MenubarItem>
              <MenubarItem alternate="Alt" onPress={() => undefined}>
                Restart
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </BloomThemeProvider>,
    );
  });
  for (let i = 0; i < 6; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

/** The menu's rows' names, in order. */
const rows = () =>
  [...document.querySelectorAll('[role="menuitem"]')].map((row) => row.textContent?.trim());

const dispatch = (event: Event) =>
  act(() => {
    document.dispatchEvent(event);
  });

describe('an alternate on the web', () => {
  it('shows while Alt is down, from the keys', () => {
    mount();
    expect(rows()).toEqual(['Restart…']);
    dispatch(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }));
    expect(rows()).toEqual(['Restart']);
    dispatch(new KeyboardEvent('keyup', { key: 'Alt', altKey: false, bubbles: true }));
    expect(rows()).toEqual(['Restart…']);
  });

  it('is one row: the focused row stays the same element, and focused, as it swaps', () => {
    mount();
    const row = document.querySelector<HTMLElement>('[role="menuitem"]') as HTMLElement;
    act(() => row.focus());
    expect(document.activeElement).toBe(row);
    dispatch(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }));
    expect(document.querySelector('[role="menuitem"]')).toBe(row);
    expect(row.textContent?.trim()).toBe('Restart');
    expect(document.activeElement).toBe(row);
  });

  it("follows the pointer's flags, and the window losing focus releases them", () => {
    mount();
    const move = new MouseEvent('pointermove', { altKey: true, bubbles: true });
    dispatch(move);
    expect(rows()).toEqual(['Restart']);
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(rows()).toEqual(['Restart…']);
  });
});
